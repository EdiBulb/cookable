# 레벨업 탭 마스코트 — AI 이미지 프롬프트

정한 것 (2026-11-20)
- Cookable 전용 마스코트: **꼬마 냉장고 = 꼬마 셰프** (이름 후보: 냉이 추천 · 꼬냉이 · 쿡이 · 차곡이)
- 스타일: 3D 클레이처럼 말랑한 느낌
- 등급이 오를수록 **옷으로 전문성**이 보임: 앞치마 → 스카프 → 모자 → 셰프 재킷 → 높은 모자 → 금장
- 셰프 모자 높이가 곧 실력 (등급이 오를수록 모자가 높아짐)
- 마스코트 옆 상차림도 함께 바뀜 (소반 → 12첩 수라상)

## 등급별 옷차림
| 등급 | 이름 | 옷차림 (새로 생기는 것) | 상차림 |
|---|---|---|---|
| 1 | 소반 | 베이지 앞치마 하나 | 밥 한 공기 |
| 2 | 3첩 반상 | + 빨간 목 스카프 | 반찬 3 |
| 3 | 5첩 반상 | + 낮은 셰프 모자 | 반찬 5 |
| 4 | 7첩 반상 | + 흰 더블 단추 셰프 재킷 (앞치마는 재킷 위로) | 반찬 7 |
| 5 | 9첩 반상 | 모자가 높은 주름 모자로 + 국자를 듦 | 반찬 9, 놋그릇 |
| 6 | 12첩 수라상 | 금 단추 · 금 테두리 스카프 · 가장 높은 모자에 금띠 · 가슴에 금 메달 | 궁중 수라상 |

## 만드는 순서 (중요: 한 단계씩 이어서)
1. **0번 마스코트 시트**를 여러 번 뽑아 1장 확정 (옷 없이 맨몸 냉장고)
2. **1번**은 0번을 참조 이미지로 넣어 생성
3. **2번부터는 바로 앞 등급 그림을 참조 이미지로** 넣고 "새로 생기는 것"만 추가하라고 함 → 얼굴·몸이 덜 바뀜
4. 1024px 정사각으로 받아 `src/assets/levelup/grade-1.png` ~ `grade-6.png`로 넣으면 webp 512px 변환은 스크립트로 처리
5. 잠긴 등급은 따로 안 만듦 (코드에서 회색 실루엣)

반찬 개수는 정확하지 않아도 괜찮음. 옷차림이 단계마다 하나씩 늘어나는지가 가장 중요.

## 공통 스타일 (모든 프롬프트 앞에 붙임)
```
3D clay render, soft matte plasticine texture, cute chibi mascot character:
a small rounded single-door mini refrigerator in soft pastel green, as a little beginner chef,
the face is on the upper part of the door with small black dot eyes, rosy cheeks and a tiny smile,
a cream-colored vertical door handle, short stubby clay arms and legs,
soft studio lighting, plain warm cream background (#F7F3EA),
centered composition, full body, square image, no text, no logo
```

## 0. 마스코트 시트 (옷 없음)
```
[공통 스타일], character turnaround sheet of the same mascot with no clothes or accessories:
front view, three-quarter view, side view, and three expressions
(happy, proud, surprised with the door slightly open showing a little food inside),
standing, evenly spaced on one image
```

## 1~6. 등급 그림
공통: `[공통 스타일], same mascot as the reference image, keep the face, body shape and colors exactly the same, standing beside a traditional Korean low table,` + 옷차림 줄 + 상차림 줄

| 등급 | 옷차림 줄 | 상차림 줄 |
|---|---|---|
| 1 | `wearing only a simple beige bib apron tied at the waist, looking eager and a little nervous` | `a small round wooden soban with one bowl of steamed rice and a pair of chopsticks` |
| 2 | `same beige bib apron as the reference, now also wearing a small red chef neckerchief tied around the top of the body` | `a small wooden table with rice, soup, kimchi and three small side dishes` |
| 3 | `same apron and red neckerchief as the reference, now also wearing a short white chef hat on top` | `a wooden table with rice, soup, kimchi and five side dishes including grilled fish and seasoned vegetables` |
| 4 | `now wearing a white double-breasted chef jacket with white buttons, the beige apron over it, the same red neckerchief and the same short white chef hat` | `a wider wooden table with rice, soup, kimchi and seven side dishes including savory pancakes and a braised dish` |
| 5 | `same white chef jacket, apron and red neckerchief, the hat is now a tall pleated white chef toque, holding a small wooden ladle, confident smile` | `an elegant red lacquered table with brass bowls, rice, soup, kimchi and nine colorful side dishes` |
| 6 | `white chef jacket with gold buttons, red neckerchief with gold trim, the tallest pleated white chef toque with a gold band, a small gold medal on the chest, proud master chef pose, soft sparkles` | `a lavish royal Korean surasang on two lacquered tables, shiny brass bowls, twelve side dishes, subtle gold accents` |
