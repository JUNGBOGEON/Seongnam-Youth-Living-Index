import { METRIC_BY_KEY, type MetricKey } from "@/components/map/model";
import { getSyliScores, type DongScore } from "@/lib/data";
import {
  createFallbackPolicyInsight,
  isAiPolicyInsight,
  type AiPolicyInsightType,
  type AiPolicyPayloadType,
} from "@/lib/policy-ai.util";

export const runtime = "nodejs";

const OPENAI_RESPONSE_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5-mini";
const CACHE_TTL = 1000 * 60 * 60 * 12;
const MINUTE_LIMIT = 5;
const DAY_LIMIT = 30;

const POLICY_INSIGHT_INSTRUCTIONS = [
  "성남시 청년 주거 데이터를 일반 방문자도 이해하기 쉽게 풀어 씁니다.",
  "입력된 숫자와 기준 이름만 근거로 사용합니다.",
  "전문 용어, 행정 문서 말투, 과장된 홍보 문구, 감탄사는 쓰지 않습니다.",
  "한국어로만 작성합니다.",
  "summary는 쉬운 한 문장, evidence는 두세 개, action은 다음에 볼 점 한 문장으로 작성합니다.",
].join("\n");

type CacheEntryType = {
  expiresAt: number;
  insight: AiPolicyInsightType;
};

type RateBucketType = {
  count: number;
  resetAt: number;
};

type OpenAiResponseContentType = {
  text?: string;
  type?: string;
};

type OpenAiResponseOutputType = {
  content?: OpenAiResponseContentType[];
  type?: string;
};

type OpenAiResponseType = {
  output?: OpenAiResponseOutputType[];
  output_text?: string;
};

type CreateOpenAiPolicyInsightOptionsType = {
  activeMetric: (typeof METRIC_BY_KEY)[MetricKey];
  apiKey: string;
  district: DongScore;
  model: string;
};

const INSIGHT_CACHE = new Map<string, CacheEntryType>();
const MINUTE_BUCKETS = new Map<string, RateBucketType>();
const DAY_BUCKETS = new Map<string, RateBucketType>();

export async function POST(request: Request) {
  if (!isTrustedRequest(request)) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const payload = await getPolicyPayload(request);

  if (!payload) {
    return Response.json({ message: "Invalid request" }, { status: 400 });
  }

  const activeMetric = METRIC_BY_KEY[payload.metricKey];
  const districtList = await getSyliScores();
  const district = districtList.find(
    (item) => item.dong_cd === payload.dongCd
  );

  if (!district) {
    return Response.json({ message: "District not found" }, { status: 404 });
  }

  const fallbackInsight = createFallbackPolicyInsight(district, activeMetric);
  const cacheKey = `${payload.dongCd}:${payload.metricKey}`;
  const cachedInsight = getCachedInsight(cacheKey);

  if (cachedInsight) {
    return Response.json({ insight: cachedInsight, source: "cache" });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json({ insight: fallbackInsight, source: "fallback" });
  }

  if (!canCreateInsight(request)) {
    return Response.json({
      insight: fallbackInsight,
      limited: true,
      source: "fallback",
    });
  }

  try {
    const insight = await createOpenAiPolicyInsight({
      activeMetric,
      apiKey,
      district,
      model: process.env.OPENAI_POLICY_MODEL ?? DEFAULT_MODEL,
    });

    setCachedInsight(cacheKey, insight);

    return Response.json({ insight, source: "ai" });
  } catch {
    return Response.json({ insight: fallbackInsight, source: "fallback" });
  }
}

async function getPolicyPayload(
  request: Request
): Promise<AiPolicyPayloadType | null> {
  const body = (await request.json().catch(() => null)) as Partial<
    AiPolicyPayloadType
  > | null;

  if (!body || typeof body.dongCd !== "string" || !isMetricKey(body.metricKey)) {
    return null;
  }

  return {
    dongCd: body.dongCd,
    metricKey: body.metricKey,
  };
}

function isMetricKey(value: unknown): value is MetricKey {
  return typeof value === "string" && value in METRIC_BY_KEY;
}

function getCachedInsight(cacheKey: string) {
  const cached = INSIGHT_CACHE.get(cacheKey);

  if (!cached) return null;

  if (cached.expiresAt < Date.now()) {
    INSIGHT_CACHE.delete(cacheKey);
    return null;
  }

  return cached.insight;
}

function setCachedInsight(cacheKey: string, insight: AiPolicyInsightType) {
  INSIGHT_CACHE.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL,
    insight,
  });
}

function canCreateInsight(request: Request) {
  const clientKey = getClientKey(request);

  return (
    canUseBucket(MINUTE_BUCKETS, clientKey, MINUTE_LIMIT, 1000 * 60) &&
    canUseBucket(DAY_BUCKETS, clientKey, DAY_LIMIT, 1000 * 60 * 60 * 24)
  );
}

function canUseBucket(
  bucketMap: Map<string, RateBucketType>,
  key: string,
  limit: number,
  windowMs: number
) {
  const now = Date.now();
  const bucket = bucketMap.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucketMap.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;

  return true;
}

function getClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") ?? "local";
}

function isTrustedRequest(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return process.env.NODE_ENV !== "production";
  }

  try {
    const originHost = new URL(origin).host;
    const requestHost =
      request.headers.get("x-forwarded-host") ?? request.headers.get("host");

    return Boolean(requestHost && originHost === requestHost);
  } catch {
    return false;
  }
}

async function createOpenAiPolicyInsight({
  activeMetric,
  apiKey,
  district,
  model,
}: CreateOpenAiPolicyInsightOptionsType) {
  const response = await fetch(OPENAI_RESPONSE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: JSON.stringify(createPolicyInput(district, activeMetric)),
      instructions: POLICY_INSIGHT_INSTRUCTIONS,
      max_output_tokens: 520,
      model,
      reasoning: {
        effort: "low",
      },
      store: false,
      text: {
        format: {
          name: "policy_insight",
          schema: {
            additionalProperties: false,
            properties: {
              action: {
                maxLength: 90,
                type: "string",
              },
              evidence: {
                items: {
                  maxLength: 90,
                  type: "string",
                },
                maxItems: 3,
                minItems: 2,
                type: "array",
              },
              summary: {
                maxLength: 120,
                type: "string",
              },
            },
            required: ["summary", "evidence", "action"],
            type: "object",
          },
          strict: true,
          type: "json_schema",
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error("OpenAI request failed");
  }

  const data = (await response.json()) as OpenAiResponseType;
  const outputText = getOutputText(data);
  const insight = JSON.parse(outputText) as unknown;

  if (!isAiPolicyInsight(insight)) {
    throw new Error("Invalid OpenAI response");
  }

  return insight;
}

function createPolicyInput(
  district: DongScore,
  activeMetric: (typeof METRIC_BY_KEY)[MetricKey]
) {
  return {
    activeMetric: {
      description: activeMetric.description,
      label: activeMetric.label,
      score: Number(activeMetric.value(district).toFixed(1)),
    },
    district: {
      code: district.dong_cd,
      gu: district.구,
      lifestyle: district.lifestyle,
      name: district.동명,
    },
    rent: {
      contractCount: district.n_contracts ?? 0,
      medianMonthlyRent: district.median_rent,
    },
    scores: {
      commute: district.SCORE_COMMUTE_PANGYO,
      infra: district.SCORE_INFRA,
      rent: district.SCORE_RENT,
      syli: district.SYLI_v02,
      youthStay: district.SCORE_YOUTH_STAY,
    },
  };
}

function getOutputText(data: OpenAiResponseType) {
  if (typeof data.output_text === "string") {
    return data.output_text;
  }

  const textList =
    data.output?.flatMap((item) => {
      return (
        item.content
          ?.map((content) => content.text)
          .filter((text): text is string => typeof text === "string") ?? []
      );
    }) ?? [];

  return textList[0] ?? "";
}
