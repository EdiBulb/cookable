# 레벨업 탭 캐릭터 — AI 이미지 프롬프트

정한 것 (2026-11-20)
- 사람 요리사, 성별이 드러나지 않는 귀여운 얼굴
- 옷: 한복 (연두빛 저고리 + 흰 앞치마, 앱 브랜드 초록과 맞춤)
- 스타일: 3D 클레이처럼 말랑한 느낌
- 캐릭터는 고정, 앞의 상차림만 등급마다 바뀜 (소반 → 12첩 수라상)

## 만드는 순서
1. 캐릭터 시트(0번)를 여러 번 뽑아 마음에 드는 1장을 확정
2. 1~6번은 그 시트를 **참조 이미지로 넣고** 생성 (얼굴·옷·자세 유지)
3. 1024px 정사각으로 받아서 `src/assets/levelup/grade-1.png` ~ `grade-6.png`로 넣으면 webp 512px 변환은 스크립트로 처리
4. 잠긴 등급 그림은 따로 만들지 않음 (코드에서 회색 실루엣 처리)

반찬 개수가 프롬프트와 정확히 안 맞아도 괜찮음. 등급이 오를수록 상이 확실히 풍성해 보이는지가 중요.

## 공통 스타일 (모든 프롬프트 앞에 붙임)
```
3D clay render, soft matte plasticine texture, rounded chubby chibi proportions,
cute gender-neutral Korean chef with a round face, small dot eyes, rosy cheeks,
short soft black bob hair, wearing a pastel green hanbok jeogori with a white apron,
gentle smile, soft studio lighting, plain warm cream background (#F7F3EA),
centered composition, no text, no logo
```

## 0. 캐릭터 시트
```
[공통 스타일], character turnaround sheet of the same character:
front view, three-quarter view, side view, and three facial expressions
(happy, proud, surprised), standing, full body, evenly spaced on one image
```

## 1~6. 등급 그림
공통: `[공통 스타일], same character as the reference image, sitting cross-legged behind a traditional Korean low table, full body, square image,` + 아래 한 줄

| 등급 | 이름 | 상차림 줄 |
|---|---|---|
| 1 | 소반 | `a small round wooden soban with one bowl of steamed rice and a pair of chopsticks, simple and humble` |
| 2 | 3첩 반상 | `a small wooden table with rice, soup, kimchi and three small side dishes` |
| 3 | 5첩 반상 | `a wooden table with rice, soup, kimchi and five side dishes including grilled fish and seasoned vegetables` |
| 4 | 7첩 반상 | `a wider wooden table with rice, soup, kimchi and seven side dishes including savory pancakes and a braised dish` |
| 5 | 9첩 반상 | `an elegant red lacquered table with brass bowls, rice, soup, kimchi and nine colorful side dishes, noble household feast` |
| 6 | 12첩 수라상 | `a lavish royal Korean surasang on two lacquered tables, shiny brass bowls, twelve side dishes, subtle gold accents and soft sparkles, the character looks proud` |
