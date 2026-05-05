"use client";

import { useState } from "react";
import type { MetricDefinition } from "@/components/map/model";
import type { DongScore } from "@/lib/data";
import {
  isAiPolicyInsight,
  type AiPolicyInsightType,
  type AiPolicyPayloadType,
} from "@/lib/policy-ai.util";

type AiPolicyReadProps = {
  activeMetric: MetricDefinition;
  district: DongScore;
  fallbackInsight: AiPolicyInsightType;
};

type AiPolicySourceType = "ai" | "cache" | "fallback";

type AiPolicyResultType = {
  insight: AiPolicyInsightType;
  key: string;
  source: AiPolicySourceType;
};

type AiPolicyResponseType = {
  insight?: unknown;
  limited?: boolean;
  source?: AiPolicySourceType;
};

export function AiPolicyRead({
  activeMetric,
  district,
  fallbackInsight,
}: AiPolicyReadProps) {
  const [result, setResult] = useState<AiPolicyResultType | null>(null);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const insightKey = `${district.dong_cd}:${activeMetric.key}`;
  const visibleResult = result?.key === insightKey ? result : null;
  const isLoading = loadingKey === insightKey;
  const hasInsight = visibleResult !== null;
  const sourceLabel =
    visibleResult?.source === "fallback"
      ? "기본 요약"
      : visibleResult?.source === "cache"
        ? "AI 요약 저장본"
        : "AI 생성 요약";
  const buttonLabel = isLoading
    ? "AI 요약 중"
    : hasInsight
      ? "다시 요약"
      : "AI 요약 보기";

  async function handleInsightClick() {
    if (isLoading) return;

    setLoadingKey(insightKey);

    const payload: AiPolicyPayloadType = {
      dongCd: district.dong_cd,
      metricKey: activeMetric.key,
    };

    try {
      const response = await fetch("/api/policy-insight", {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const result = (await response.json()) as AiPolicyResponseType;

      if (!isAiPolicyInsight(result.insight)) {
        throw new Error("Invalid response");
      }

      setResult({
        insight: result.insight,
        key: insightKey,
        source: result.source ?? "ai",
      });
    } catch {
      setResult({
        insight: fallbackInsight,
        key: insightKey,
        source: "fallback",
      });
    } finally {
      setLoadingKey((currentKey) =>
        currentKey === insightKey ? null : currentKey
      );
    }
  }

  return (
    <section className="border-b border-line p-6">
      <div className="ai-read-card">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="copy-tiny font-semibold uppercase text-subtle">
              AI 요약
            </p>
            <h3 className="mt-1 type-subhead text-ink">
              AI가 이 동을 쉽게 정리합니다.
            </h3>
          </div>
          <button
            type="button"
            disabled={isLoading}
            className="ai-read-button"
            onClick={handleInsightClick}
          >
            {buttonLabel}
          </button>
        </div>

        {visibleResult ? (
          <div className="ai-read-panel">
            <div>
              <div className="flex items-center gap-2">
                <span className="ai-read-status-dot" aria-hidden="true" />
                <p className="copy-tiny font-semibold text-subtle">
                  {sourceLabel}
                </p>
              </div>
              <p className="mt-2 copy-small leading-normal text-ink">
                {visibleResult.insight.summary}
              </p>
            </div>

            <ul className="ai-read-evidence-list">
              {visibleResult.insight.evidence.map((item) => (
                <li key={item} className="ai-read-evidence-item">
                  <span aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="rounded-field bg-white px-3 py-3">
              <p className="copy-tiny font-semibold text-subtle">다음에 볼 점</p>
              <p className="mt-1 copy-note leading-normal text-ink">
                {visibleResult.insight.action}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-5 copy-note leading-normal text-muted">
            AI가 {district.동명}의 {activeMetric.label} 점수가 어떤 의미인지
            짧게 요약합니다.
          </p>
        )}
      </div>
    </section>
  );
}
