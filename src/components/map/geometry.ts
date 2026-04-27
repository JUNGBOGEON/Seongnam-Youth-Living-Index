import type { DongScore } from "@/lib/data";
import {
  SVG_PADDING,
  SVG_SIZE,
  type BoundaryCollection,
  type BoundaryFeature,
  type MetricKey,
  type SpatialRead,
  type SvgDistrict,
} from "@/components/map/model";

export function createSvgDistricts(
  geo: BoundaryCollection,
  byCd: Record<string, DongScore>
) {
  const bounds = getCoordinateBounds(geo);
  if (!bounds) return [];

  const [minLng, minLat, maxLng, maxLat] = bounds;
  const width = Math.max(0.000001, maxLng - minLng);
  const height = Math.max(0.000001, maxLat - minLat);
  const drawable = SVG_SIZE - SVG_PADDING * 2;

  const project = ([lng, lat]: [number, number]) => {
    const x = SVG_PADDING + ((lng - minLng) / width) * drawable;
    const y = SVG_PADDING + ((maxLat - lat) / height) * drawable;
    return [x, y] as const;
  };

  const districts: SvgDistrict[] = [];

  for (const feature of geo.features) {
    const dongCd = String(
      feature.properties.ADMI_CD ?? feature.properties.dong_cd
    );
    const score = byCd[dongCd];
    const path = geometryToSvgPath(feature.geometry, project);
    const center = geometryCenter(feature.geometry.coordinates, project);

    if (path && center) {
      districts.push({
        center,
        dongCd,
        name: score?.동명 ?? String(feature.properties.dong_name ?? dongCd),
        path,
        score,
      });
    }
  }

  return districts;
}

export function createSpatialRead(
  metricKey: MetricKey,
  districts: SvgDistrict[],
  rankedByMetric: DongScore[]
): SpatialRead | null {
  if (districts.length === 0) return null;

  const readMeta: Record<
    MetricKey,
    {
      accent: string;
      caption: string;
      names: string[];
      title: string;
    }
  > = {
    syli: {
      accent: "#2f6f73",
      caption: "통근·생활 균형",
      names: ["서현1동", "성남동", "야탑1동", "백현동", "삼평동"],
      title: "균형 적합축",
    },
    commute: {
      accent: "#0f4f66",
      caption: "판교 접근 강도",
      names: ["삼평동", "백현동", "판교동", "운중동", "서현1동"],
      title: "판교 접근축",
    },
    rent: {
      accent: "#7a6333",
      caption: "저비용 후보지",
      names: ["하대원동", "복정동", "은행2동", "은행1동", "상대원1동"],
      title: "월세 완충권",
    },
    infra: {
      accent: "#234c4e",
      caption: "생활 밀도",
      names: ["백현동", "정자1동", "서현1동", "수내1동", "삼평동"],
      title: "생활 중심축",
    },
  };
  const meta = readMeta[metricKey];
  const byName = new Map(districts.map((district) => [district.name, district]));
  const fallbackCodes = new Set(
    rankedByMetric.slice(0, 5).map((district) => district.dong_cd)
  );
  const targetDistricts = meta.names
    .map((name) => byName.get(name))
    .filter((district): district is SvgDistrict => Boolean(district));
  const resolved =
    targetDistricts.length >= 3
      ? targetDistricts
      : districts.filter((district) => fallbackCodes.has(district.dongCd));

  const points = resolved
    .map((district) => district.center)
    .sort(([ax, ay], [bx, by]) => ax - bx || ay - by)
    .slice(0, 6);

  if (points.length < 2) return null;

  const label = averagePoint(points);
  const labelX = Math.max(130, Math.min(SVG_SIZE - 130, label[0] + 56));
  const labelY = Math.max(92, Math.min(SVG_SIZE - 92, label[1] - 78));

  return {
    accent: meta.accent,
    caption: meta.caption,
    label: [labelX, labelY],
    path: pointsToPath(points),
    points,
    title: meta.title,
  };
}

export function metricToColor(value: number) {
  if (value >= 82) return "#123f49";
  if (value >= 70) return "#2f6f73";
  if (value >= 58) return "#7aa39d";
  if (value >= 46) return "#b9c9b8";
  if (value >= 34) return "#d9caa5";
  return "#efe8dc";
}

export function elevationFor(value: number, focused = false) {
  const normalized = Math.max(0, Math.min(100, value));
  return 8 + Math.round(normalized * 0.22) + (focused ? 10 : 0);
}

export function reliefOpacity(value: number) {
  const normalized = Math.max(0, Math.min(100, value));
  return 0.08 + normalized * 0.00125;
}

function geometryCenter(
  coordinates: unknown,
  project: (point: [number, number]) => readonly [number, number]
) {
  const points: Array<readonly [number, number]> = [];

  visitCoordinates(coordinates, (point) => {
    points.push(project(point));
  });

  if (points.length === 0) return null;

  const [sumX, sumY] = points.reduce(
    ([accX, accY], [x, y]) => [accX + x, accY + y],
    [0, 0]
  );

  return [sumX / points.length, sumY / points.length] as const;
}

function pointsToPath(points: Array<readonly [number, number]>) {
  return points
    .map(
      ([x, y], index) =>
        `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`
    )
    .join(" ");
}

function averagePoint(points: Array<readonly [number, number]>) {
  const [sumX, sumY] = points.reduce(
    ([accX, accY], [x, y]) => [accX + x, accY + y],
    [0, 0]
  );

  return [sumX / points.length, sumY / points.length] as const;
}

function getCoordinateBounds(geo: BoundaryCollection) {
  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  for (const feature of geo.features) {
    visitCoordinates(feature.geometry.coordinates, ([lng, lat]) => {
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    });
  }

  if (!Number.isFinite(minLng) || !Number.isFinite(minLat)) {
    return null;
  }

  return [minLng, minLat, maxLng, maxLat] as const;
}

function geometryToSvgPath(
  geometry: BoundaryFeature["geometry"],
  project: (point: [number, number]) => readonly [number, number]
) {
  if (geometry.type === "Polygon") {
    return polygonToSvgPath(geometry.coordinates, project);
  }

  if (geometry.type === "MultiPolygon" && Array.isArray(geometry.coordinates)) {
    return geometry.coordinates
      .map((polygon) => polygonToSvgPath(polygon, project))
      .filter(Boolean)
      .join(" ");
  }

  return "";
}

function polygonToSvgPath(
  polygon: unknown,
  project: (point: [number, number]) => readonly [number, number]
) {
  if (!Array.isArray(polygon)) return "";

  return polygon
    .map((ring) => {
      if (!Array.isArray(ring)) return "";

      const commands = ring.filter(isCoordinate).map((point, index) => {
        const [x, y] = project(point);
        return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
      });

      return commands.length ? `${commands.join(" ")} Z` : "";
    })
    .filter(Boolean)
    .join(" ");
}

function visitCoordinates(
  coordinates: unknown,
  visitor: (point: [number, number]) => void
) {
  if (isCoordinate(coordinates)) {
    visitor(coordinates);
    return;
  }

  if (Array.isArray(coordinates)) {
    coordinates.forEach((child) => visitCoordinates(child, visitor));
  }
}

function isCoordinate(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  );
}
