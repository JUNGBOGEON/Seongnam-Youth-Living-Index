# Seongnam Youth Living Index

성남 청년 1인가구의 주거 적합도를 행정동 단위로 비교하는 인터랙티브 데이터 웹앱입니다. 공공데이터와 민간 생활 데이터를 하나의 지표로 정리하고, 지도와 인사이트 페이지에서 통근, 월세, 생활 인프라, 청년 체류 조건을 함께 볼 수 있게 만들었습니다.

## What It Shows

- 성남시 50개 행정동의 SYLI 점수와 순위
- 판교 통근, 월세 접근성, 생활 인프라 기준별 지도 비교
- 동별 정책 판정과 다음 검토 포인트
- 주요 발견을 묶은 인사이트 페이지
- 산식, 가중치, 데이터 출처, 한계를 정리한 방법론 페이지

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- SVG 기반 행정동 지도

## Data

웹앱에서 사용하는 정리 데이터는 `public/data`에 포함되어 있습니다.

- `syli_scores.json`: 행정동별 점수와 순위 계산용 지표
- `dong_boundaries.geojson`: 성남시 행정동 경계
- `insights.json`: 인사이트 페이지용 요약 지표
- `scenarios.json`: 정책 시나리오용 보조 데이터

원천 대용량 데이터는 저장소에 포함하지 않습니다. 재현이나 검증이 필요한 경우, 원천 데이터는 별도 보관소에서 관리하는 것을 전제로 합니다.

## Local Setup

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 열면 됩니다.

## Scripts

```bash
npm run dev      # local development
npm run build    # production build
npm run start    # run production server
npm run lint     # eslint
```

## Project Structure

```text
src/app                 page routes
src/components          shared UI and map components
src/lib                 data loading helpers
public/data             processed app data
public/images           static images
```

## Notes

이 프로젝트는 2026 성남시 공공데이터 활용 시각화 경진대회 출품을 목표로 만들었습니다. 지표는 정책 검토를 돕기 위한 비교 도구이며, 개별 주거지의 품질이나 실제 계약 가능성을 직접 판단하는 용도로 쓰기에는 한계가 있습니다.
