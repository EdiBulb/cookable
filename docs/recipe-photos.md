# 레시피 사진 넣는 법

사진이 없는 레시피는 요리 종류별 색 + 첫 글자 타일로 보여요. 사진은 하나씩 추가해도 돼요.

## 1. 사진 목록과 프롬프트 받기

```bash
npm run photos:list
```

`docs/recipe-photo-list.csv`에 레시피 189개의 id, 이름, 사진 유무, AI 이미지 프롬프트가 생겨요.
(엑셀·구글 시트에서 열면 돼요.)

## 2. 사진 만들기

- **AI로 만들기**: 프롬프트를 Gemini / ImageFX / Google Flow 등에 넣어 생성 → 실제 요리와 비슷한지 꼭 확인
- **직접 찍기**: 만들어 먹을 때 위에서 한 장 (정사각형으로 잘려요)
- **쓰면 안 되는 것**: 블로그·만개의레시피·인스타 등 남의 사진 (저작권)

파일 이름은 레시피 **id** 또는 **이름**으로 저장해요. 예: `kimchi-fried-rice.jpg` 또는 `김치볶음밥.png`

## 3. 썸네일로 바꾸기

```bash
npm run photos -- ~/Downloads/cookable-photos
```

정사각형 600px webp로 바꿔서 `src/assets/recipes/<id>.webp`에 저장해요. 이름이 레시피와 안 맞는 파일은 목록으로 알려 줘요.
커밋하고 푸시하면 자동 배포돼요.
