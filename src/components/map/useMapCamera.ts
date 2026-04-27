"use client";

import type {
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
import { useCallback, useRef, useState } from "react";
import type { DongScore } from "@/lib/data";
import {
  MAX_MAP_ZOOM,
  MIN_MAP_ZOOM,
  SVG_SIZE,
  type MapCamera,
} from "@/components/map/model";

type PointerPoint = {
  clientX: number;
  clientY: number;
};

type PanGesture = {
  didMove: boolean;
  panSpeed: number;
  pointerId: number;
  rect: DOMRect;
  startCamera: MapCamera;
  startX: number;
  startY: number;
  tapDistrict?: DongScore;
  type: "pan";
};

type PinchGesture = {
  didMove: boolean;
  rect: DOMRect;
  startCamera: MapCamera;
  startCenterX: number;
  startCenterY: number;
  startDistance: number;
  startSvgX: number;
  startSvgY: number;
  type: "pinch";
};

type MapGesture = PanGesture | PinchGesture;

type UseMapCameraArgs = {
  onSelect: (district?: DongScore) => void;
  scoresByDongCode: Record<string, DongScore>;
};

const MOUSE_PAN_SPEED = 0.42;
const TOUCH_PAN_SPEED = 0.72;
const WHEEL_ZOOM_SENSITIVITY = 0.0014;

export function useMapCamera({
  onSelect,
  scoresByDongCode,
}: UseMapCameraArgs) {
  const [mapCamera, setMapCamera] = useState<MapCamera>({
    scale: 1,
    x: 0,
    y: 0,
  });
  const mapCameraRef = useRef(mapCamera);
  const mapSvgRef = useRef<SVGSVGElement | null>(null);
  const activePointers = useRef(new Map<number, PointerPoint>());
  const mapGesture = useRef<MapGesture | null>(null);

  const updateMapCamera = useCallback((nextCamera: MapCamera) => {
    const clamped = clampMapCamera(nextCamera);

    mapCameraRef.current = clamped;
    setMapCamera(clamped);
  }, []);

  const startPinchGesture = useCallback((rect: DOMRect) => {
    const pointers = [...activePointers.current.values()];
    if (pointers.length < 2) return;

    const [first, second] = pointers;
    const centerX = (first.clientX + second.clientX) / 2;
    const centerY = (first.clientY + second.clientY) / 2;
    const startCamera = mapCameraRef.current;
    const viewBoxSize = SVG_SIZE / startCamera.scale;

    mapGesture.current = {
      didMove: false,
      rect,
      startCamera,
      startCenterX: centerX,
      startCenterY: centerY,
      startDistance: getPointDistance(first, second),
      startSvgX:
        startCamera.x + ((centerX - rect.left) / rect.width) * viewBoxSize,
      startSvgY:
        startCamera.y + ((centerY - rect.top) / rect.height) * viewBoxSize,
      type: "pinch",
    };
  }, []);

  const handleMapPointerDown = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      const svg = mapSvgRef.current;
      if (!svg) return;

      svg.setPointerCapture(event.pointerId);
      activePointers.current.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
      });

      const rect = svg.getBoundingClientRect();
      if (activePointers.current.size >= 2) {
        event.preventDefault();
        startPinchGesture(rect);
        return;
      }

      mapGesture.current = {
        didMove: false,
        panSpeed:
          event.pointerType === "mouse" ? MOUSE_PAN_SPEED : TOUCH_PAN_SPEED,
        pointerId: event.pointerId,
        rect,
        startCamera: mapCameraRef.current,
        startX: event.clientX,
        startY: event.clientY,
        tapDistrict: getPointerDistrict(event, scoresByDongCode),
        type: "pan",
      };
    },
    [scoresByDongCode, startPinchGesture]
  );

  const handleMapPointerMove = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      const currentPoint = activePointers.current.get(event.pointerId);
      if (!currentPoint || !mapGesture.current) return;

      activePointers.current.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
      });

      const gesture = mapGesture.current;

      if (gesture.type === "pinch") {
        const pointers = [...activePointers.current.values()];
        if (pointers.length < 2 || gesture.startDistance <= 0) return;

        event.preventDefault();

        const [first, second] = pointers;
        const distance = getPointDistance(first, second);
        const centerX = (first.clientX + second.clientX) / 2;
        const centerY = (first.clientY + second.clientY) / 2;
        const scale =
          gesture.startCamera.scale * (distance / gesture.startDistance);
        const clampedScale = clamp(scale, MIN_MAP_ZOOM, MAX_MAP_ZOOM);
        const nextViewBoxSize = SVG_SIZE / clampedScale;

        gesture.didMove =
          gesture.didMove ||
          Math.abs(distance - gesture.startDistance) > 5 ||
          getDistanceBetweenPoints(
            centerX,
            centerY,
            gesture.startCenterX,
            gesture.startCenterY
          ) > 5;

        updateMapCamera({
          scale: clampedScale,
          x:
            gesture.startSvgX -
            ((centerX - gesture.rect.left) / gesture.rect.width) *
              nextViewBoxSize,
          y:
            gesture.startSvgY -
            ((centerY - gesture.rect.top) / gesture.rect.height) *
              nextViewBoxSize,
        });
        return;
      }

      if (gesture.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - gesture.startX;
      const deltaY = event.clientY - gesture.startY;
      const viewBoxSize = SVG_SIZE / gesture.startCamera.scale;

      gesture.didMove =
        gesture.didMove || getDistanceBetweenPoints(deltaX, deltaY, 0, 0) > 5;

      if (gesture.didMove) {
        event.preventDefault();
        updateMapCamera({
          scale: gesture.startCamera.scale,
          x:
            gesture.startCamera.x -
            (deltaX / gesture.rect.width) * viewBoxSize * gesture.panSpeed,
          y:
            gesture.startCamera.y -
            (deltaY / gesture.rect.height) * viewBoxSize * gesture.panSpeed,
        });
      }
    },
    [updateMapCamera]
  );

  const handleMapPointerEnd = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      const svg = mapSvgRef.current;
      if (svg?.hasPointerCapture(event.pointerId)) {
        svg.releasePointerCapture(event.pointerId);
      }

      const gesture = mapGesture.current;
      const wasDragging = gesture?.didMove ?? false;
      const tapDistrict =
        gesture?.type === "pan" ? gesture.tapDistrict : undefined;
      activePointers.current.delete(event.pointerId);

      if (activePointers.current.size >= 2 && svg) {
        startPinchGesture(svg.getBoundingClientRect());
        return;
      }

      if (activePointers.current.size === 1 && svg) {
        const [pointerId, pointer] = [...activePointers.current.entries()][0];
        mapGesture.current = {
          didMove: wasDragging,
          panSpeed: TOUCH_PAN_SPEED,
          pointerId,
          rect: svg.getBoundingClientRect(),
          startCamera: mapCameraRef.current,
          startX: pointer.clientX,
          startY: pointer.clientY,
          type: "pan",
        };
        return;
      }

      if (event.type === "pointerup" && !wasDragging && tapDistrict) {
        onSelect(tapDistrict);
      }

      mapGesture.current = null;
    },
    [onSelect, startPinchGesture]
  );

  const handleMapWheel = useCallback(
    (event: ReactWheelEvent<SVGSVGElement>) => {
      event.preventDefault();

      const svg = mapSvgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const current = mapCameraRef.current;
      const currentViewBoxSize = SVG_SIZE / current.scale;
      const pointX =
        current.x + ((event.clientX - rect.left) / rect.width) * currentViewBoxSize;
      const pointY =
        current.y + ((event.clientY - rect.top) / rect.height) * currentViewBoxSize;
      const clampedWheel = clamp(-event.deltaY, -80, 80);
      const scaleFactor = Math.exp(clampedWheel * WHEEL_ZOOM_SENSITIVITY);
      const nextScale = clamp(
        current.scale * scaleFactor,
        MIN_MAP_ZOOM,
        MAX_MAP_ZOOM
      );
      const nextViewBoxSize = SVG_SIZE / nextScale;

      updateMapCamera({
        scale: nextScale,
        x: pointX - ((event.clientX - rect.left) / rect.width) * nextViewBoxSize,
        y: pointY - ((event.clientY - rect.top) / rect.height) * nextViewBoxSize,
      });
    },
    [updateMapCamera]
  );

  return {
    handleMapPointerDown,
    handleMapPointerEnd,
    handleMapPointerMove,
    handleMapWheel,
    mapCamera,
    mapSvgRef,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampMapCamera(camera: MapCamera) {
  const scale = clamp(camera.scale, MIN_MAP_ZOOM, MAX_MAP_ZOOM);
  const viewBoxSize = SVG_SIZE / scale;
  const maxOffset = SVG_SIZE - viewBoxSize;

  return {
    scale,
    x: clamp(camera.x, 0, maxOffset),
    y: clamp(camera.y, 0, maxOffset),
  };
}

function getPointerDistrict(
  event: ReactPointerEvent<SVGSVGElement>,
  scoresByDongCode: Record<string, DongScore>
) {
  if (!(event.target instanceof Element)) return undefined;

  const target = event.target.closest<SVGElement>("[data-map-dong]");
  const dongCd = target?.getAttribute("data-map-dong");

  return dongCd ? scoresByDongCode[dongCd] : undefined;
}

function getPointDistance(first: PointerPoint, second: PointerPoint) {
  return getDistanceBetweenPoints(
    first.clientX,
    first.clientY,
    second.clientX,
    second.clientY
  );
}

function getDistanceBetweenPoints(
  firstX: number,
  firstY: number,
  secondX: number,
  secondY: number
) {
  return Math.hypot(firstX - secondX, firstY - secondY);
}
