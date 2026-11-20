# 레벨업 탭 캐릭터 — 고화질 픽셀 아트 프롬프트 (복사해서 바로 쓰는 전체본)

정한 것 (2026-11-20)
- 사람 꼬마 셰프, 성별이 드러나지 않는 귀여운 얼굴
- 고화질 HD 픽셀 아트 (128px 격자, 48색)
- 등급이 오를수록 옷으로 전문성 표현, 셰프 모자 높이 = 실력
- 캐릭터 6장 + 상차림 6장을 따로 만들어 앱에서 나란히 놓음

## 공통 캐릭터 설정 (모든 캐릭터 프롬프트에 똑같이 들어감)
- 2.5등신 꼬마, 큰 머리, 둥근 얼굴
- 짧은 검은 단발머리, 앞머리 일자, 까만 점 눈, 분홍 볼, 작은 미소
- 성별이 드러나지 않음
- 정면을 보고 서 있는 전신, 팔은 몸 옆

## 만드는 순서
1. **0번**을 여러 번 뽑아 마음에 드는 1장 확정 → 이게 "공통 캐릭터"
2. **1번**: 0번을 참조 이미지로 넣고 생성
3. **2~6번**: 바로 앞 번호 그림을 참조 이미지로 넣고 생성
4. **상차림 T1~T6**: 참조 이미지 없이, 아무 순서로
5. 받은 그림을 `src/assets/levelup/chef-1.png`~`chef-6.png`, `table-1.png`~`table-6.png`로 넣으면 변환 스크립트가 정리

---

## 0. 공통 캐릭터 시트
```
high-resolution HD pixel art, modern indie game character art, 128x128 pixel grid, crisp clean pixel edges, no blur, rich 48-color palette, soft pixel shading with highlights, subtle dithering, detailed face and clothing folds, colored outline, plain solid warm cream background (#F7F3EA), no text, no logo.
Character sheet of one cute little Korean chef character: chibi proportions about 2.5 heads tall with a big head, round gender-neutral face, short straight black bob hair with blunt bangs, small black dot eyes, pink rosy cheeks, small gentle smile.
Outfit: plain light-gray t-shirt, dark navy pants, brown shoes, beige bib apron tied at the waist.
Show the same character four times side by side: front view, side view, back view, and a close-up row of three faces (happy, proud, surprised). Consistent design, evenly spaced.
```

## 1단계 · 소반 — 앞치마 하나
```
high-resolution HD pixel art, modern indie game character art, 128x128 pixel grid, crisp clean pixel edges, no blur, rich 48-color palette, soft pixel shading with highlights, subtle dithering, detailed face and clothing folds, colored outline, plain solid warm cream background (#F7F3EA), centered, no text, no logo.
Same character as the reference image, keep the face, hair, body proportions and colors exactly the same: a cute little Korean chef, chibi about 2.5 heads tall, round gender-neutral face, short straight black bob hair with blunt bangs, black dot eyes, pink cheeks.
Outfit: plain light-gray t-shirt, dark navy pants, brown shoes, beige bib apron tied at the waist. No hat, no scarf.
Front-facing full body standing pose, arms at the sides, eager and slightly nervous smile, a beginner cook.
```

## 2단계 · 3첩 반상 — + 목 스카프
```
high-resolution HD pixel art, modern indie game character art, 128x128 pixel grid, crisp clean pixel edges, no blur, rich 48-color palette, soft pixel shading with highlights, subtle dithering, detailed face and clothing folds, colored outline, plain solid warm cream background (#F7F3EA), centered, no text, no logo.
Same character as the reference image, keep the face, hair, body proportions, pose and colors exactly the same: a cute little Korean chef, chibi about 2.5 heads tall, round gender-neutral face, short straight black bob hair with blunt bangs, black dot eyes, pink cheeks.
Outfit: the same light-gray t-shirt, dark navy pants, brown shoes and beige bib apron as the reference. NEW: a small red chef neckerchief tied around the neck with a knot at the front. No hat.
Front-facing full body standing pose, cheerful smile.
```

## 3단계 · 5첩 반상 — + 셰프 모자
```
high-resolution HD pixel art, modern indie game character art, 128x128 pixel grid, crisp clean pixel edges, no blur, rich 48-color palette, soft pixel shading with highlights, subtle dithering, detailed face and clothing folds, colored outline, plain solid warm cream background (#F7F3EA), centered, no text, no logo.
Same character as the reference image, keep the face, hair, body proportions, pose and colors exactly the same: a cute little Korean chef, chibi about 2.5 heads tall, round gender-neutral face, short straight black bob hair with blunt bangs, black dot eyes, pink cheeks.
Outfit: the same light-gray t-shirt, dark navy pants, brown shoes, beige bib apron and red neckerchief as the reference. NEW: a short, low white chef hat on the head (only slightly taller than a cap).
Front-facing full body standing pose, happy confident smile.
```

## 4단계 · 7첩 반상 — 셰프 재킷
```
high-resolution HD pixel art, modern indie game character art, 128x128 pixel grid, crisp clean pixel edges, no blur, rich 48-color palette, soft pixel shading with highlights, subtle dithering, detailed face and clothing folds, colored outline, plain solid warm cream background (#F7F3EA), centered, no text, no logo.
Same character as the reference image, keep the face, hair, body proportions, pose and colors exactly the same: a cute little Korean chef, chibi about 2.5 heads tall, round gender-neutral face, short straight black bob hair with blunt bangs, black dot eyes, pink cheeks.
Outfit: NEW: the gray t-shirt is replaced by a crisp white double-breasted chef jacket with two rows of white buttons. Keep the beige bib apron over the jacket, the red neckerchief, the short low white chef hat, dark navy pants and brown shoes.
Front-facing full body standing pose, proud smile, looks like a real cook now.
```

## 5단계 · 9첩 반상 — 높은 셰프 모자 + 국자
```
high-resolution HD pixel art, modern indie game character art, 128x128 pixel grid, crisp clean pixel edges, no blur, rich 48-color palette, soft pixel shading with highlights, subtle dithering, detailed face and clothing folds, colored outline, plain solid warm cream background (#F7F3EA), centered, no text, no logo.
Same character as the reference image, keep the face, hair, body proportions and colors exactly the same: a cute little Korean chef, chibi about 2.5 heads tall, round gender-neutral face, short straight black bob hair with blunt bangs, black dot eyes, pink cheeks.
Outfit: the same white double-breasted chef jacket, beige bib apron, red neckerchief, dark navy pants and brown shoes as the reference. NEW: the hat is now a tall pleated white chef toque (about as tall as the head). NEW: holding a small wooden ladle in one hand.
Front-facing full body standing pose, confident skilled-chef smile.
```

## 6단계 · 12첩 수라상 — 금장 마스터 셰프
```
high-resolution HD pixel art, modern indie game character art, 128x128 pixel grid, crisp clean pixel edges, no blur, rich 48-color palette, soft pixel shading with highlights, subtle dithering, detailed face and clothing folds, colored outline, plain solid warm cream background (#F7F3EA), centered, no text, no logo.
Same character as the reference image, keep the face, hair, body proportions and colors exactly the same: a cute little Korean chef, chibi about 2.5 heads tall, round gender-neutral face, short straight black bob hair with blunt bangs, black dot eyes, pink cheeks.
Outfit: NEW master chef version: white double-breasted chef jacket with shiny gold buttons, red neckerchief with gold trim, the tallest pleated white chef toque with a gold band around it, a small gold medal on a red ribbon on the chest, the beige apron, dark navy pants and brown shoes. Holding the wooden ladle.
Front-facing full body standing pose, proud master chef pose with a big smile, a few small gold sparkle pixels around.
```

---

## 상차림 T1~T6 (참조 이미지 없이)
공통 앞부분:
```
high-resolution HD pixel art, modern indie game item art, 128x128 pixel grid, crisp clean pixel edges, no blur, rich 48-color palette, soft pixel shading with highlights, subtle dithering, colored outline, plain solid warm cream background (#F7F3EA), centered, no text, no logo.
A traditional Korean meal table seen from a slight top-down three-quarter angle, no people.
```
| 번호 | 이름 | 뒤에 붙일 줄 |
|---|---|---|
| T1 | 소반 | `A small round wooden soban with one bowl of white rice and a pair of chopsticks, simple and humble.` |
| T2 | 3첩 반상 | `A small wooden table with a bowl of rice, a bowl of soup, kimchi and three small side dishes.` |
| T3 | 5첩 반상 | `A wooden table with rice, soup, kimchi and five side dishes including a grilled fish and seasoned greens.` |
| T4 | 7첩 반상 | `A wider wooden table with rice, soup, kimchi and seven side dishes including savory pancakes and a braised meat dish.` |
| T5 | 9첩 반상 | `An elegant red lacquered table with shiny brass bowls, rice, soup, kimchi and nine colorful side dishes.` |
| T6 | 12첩 수라상 | `A lavish royal Korean surasang on two red lacquered tables, gleaming gold-brass bowls, twelve colorful side dishes, small gold sparkle pixels.` |
