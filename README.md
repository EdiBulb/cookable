# Cookable

냉장고에 있는 재료로 만들 수 있는 요리를 추천하고, 다 떨어진 재료는 장바구니에 자동으로 담아 주는 모바일 웹앱.

## MVP 기능

- **내 주방**: 실제 냉장고처럼 칸별(냉동실 · 과일칸 · 일반 재료칸 · 음료칸 · 채소칸 + 찬장) 보기 / 카테고리별 전체 보기
- **남은 양 체크**: 재료를 누르면 0~5단계로 바로 변경, 0이 되면 장바구니에 자동 추가
- **식재료 넣기**: 미리 준비된 재료 목록에서 탭으로 선택, "자취 필수템" 한 번에 담기, 직접 입력
- **레시피 추천**: "지금 바로 만들 수 있어요" / "하나만 더 사면 돼요" (부족한 재료 바로 장바구니에)
- **레시피 상세**: 재료 보유 여부, 조리 순서, 유튜브 검색 링크, 요리 후 쓴 재료 남은 양 체크
- **장바구니**: 자동/레시피/직접 추가 구분, 체크 후 "장보기 끝"을 누르면 냉장고에 다시 채워짐
- **스플래시**: 냉장고 문이 열리는 인트로 (첫 실행 2초, 이후 0.9초, 모션 줄이기 설정 시 생략)

## 기술 스택

React 19 · TypeScript (strict) · Vite · React Router (HashRouter) · Vitest
데이터는 서버 없이 `localStorage`에 저장 (`src/store/KitchenContext.tsx`).

## 구조

```
src/
  types.ts                 도메인 타입 (FridgeItem, CartItem, Recipe …)
  data/catalog.ts          재료 목록 · 칸/카테고리 라벨 · 자취 필수템
  data/recipes.ts          기본 레시피 (재료 이름은 catalog 표준 이름과 동일)
  lib/recommend.ts         추천 로직 (이름 정규화 → 보유 재료 비교 → 분류)
  store/kitchen.ts         useReducer용 순수 리듀서 (자동 장바구니 규칙 포함)
  store/KitchenContext.tsx Context + localStorage 저장
  components/              BottomSheet, LevelPicker/LevelBars, TabBar, Splash, icons
  screens/                 Kitchen, AddIngredients, Recipes, RecipeDetail, Cart
```

## 실행

```bash
npm install
npm run dev     # 개발 서버
npm test        # 추천 로직 · 리듀서 테스트
npm run build   # dist/ 에 정적 파일 생성
```

## 백로그 (MVP 이후)

- 요리 기록 · 요리별 레벨 · 자주 해먹는 요리 기반 재료 추천
- 유통기한 알림
- 재료 사진 (브랜드가 중요한 재료)
- **[보류] 식품안전나라 레시피 API 연동** — 본인인증(한국 휴대폰 문자)이 가능해지면 진행
  1. foodsafetykorea.go.kr 개인회원 가입 → 데이터활용서비스에서 '조리식품의 레시피 DB'(COOKRCP01) 이용신청 (무료, 자동 승인)
  2. `https://openapi.foodsafetykorea.go.kr/api/<인증키>/COOKRCP01/json/1/5` 로 응답 확인
  3. GitHub → Settings → Secrets and variables → Actions → `FOOD_API_KEY` 등록
  4. 빌드 때 레시피를 받아 재료 이름 필터링(청소 → 목록 → 별칭 → 포함 검사), 모르는 재료가 남은 레시피는 제외하고 리포트 출력
- **선택 로그인 "내 냉장고 기억하기"** (구글 로그인 + Supabase 백업) — 로그인 없이 쓰다가 원할 때만 로그인
  - 권유 시점: 재료를 어느 정도 넣은 뒤(예: 10개 이상), 장보기 끝을 누른 직후 — 지킬 데이터가 생겼을 때
  - 첫 로그인 때 폰(localStorage)에 있던 냉장고·장바구니를 서버로 옮기기
  - 필요한 것: Supabase 프로젝트, 구글 OAuth 설정, 개인정보처리방침 페이지
  - 카카오톡 인앱 브라우저는 구글 로그인이 막히므로 외부 브라우저 전환 유지
