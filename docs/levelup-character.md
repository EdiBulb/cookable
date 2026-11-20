# 레벨업 탭 캐릭터 — 픽셀 아트 프롬프트

정한 것 (2026-11-20)
- 사람 꼬마 셰프, 성별이 드러나지 않는 귀여운 얼굴
- 스타일: **픽셀 아트** (8비트 게임 스프라이트)
- 등급이 오를수록 옷으로 전문성 표현, 셰프 모자 높이 = 실력
- 상차림은 등급마다 소반 → 12첩 수라상

## 그림을 두 종류로 나눔 (추천)
캐릭터와 상차림을 **따로** 만들고 앱에서 나란히 놓는다.
- 캐릭터 6장: 옷만 바뀌니 얼굴이 덜 흔들림, 나중에 걷기·요리 모션 추가 쉬움
- 상차림 6장: 결과 시트·등급 카드에 따로 써도 됨

## 등급표
| 등급 | 이름 | 캐릭터 옷차림 (새로 생기는 것) | 상차림 |
|---|---|---|---|
| 1 | 소반 | 평상복 + 베이지 앞치마 | 밥 한 공기 |
| 2 | 3첩 반상 | + 빨간 목 스카프 | 반찬 3 |
| 3 | 5첩 반상 | + 낮은 흰 셰프 모자 | 반찬 5 |
| 4 | 7첩 반상 | 평상복 → 흰 더블 단추 셰프 재킷 | 반찬 7 |
| 5 | 9첩 반상 | 모자가 높은 주름 모자로 + 국자 | 반찬 9, 놋그릇 |
| 6 | 12첩 수라상 | 금 단추, 금 테두리 스카프, 금띠 모자, 가슴에 금 메달 | 궁중 수라상 |

## 만드는 순서
1. **0번 캐릭터 시트**를 여러 번 뽑아 1장 확정 (앞치마만 입은 1등급 모습)
2. 캐릭터 2~6번은 **바로 앞 등급 그림을 참조 이미지로** 넣고 새로 생기는 것만 추가
3. 상차림 1~6번은 아무 순서로 생성 (같은 팔레트 유지)
4. 받은 그림은 `src/assets/levelup/`에 `chef-1.png`~`chef-6.png`, `table-1.png`~`table-6.png`로 넣기
5. 변환 스크립트가 **진짜 픽셀로 정리**: 작게 줄이기(최근접 이웃) → 팔레트 정리 → 화면에서는 `image-rendering: pixelated`로 확대
6. 잠긴 등급은 따로 안 만듦 (코드에서 회색 실루엣)

## 공통 스타일 (모든 프롬프트 앞에 붙임)
```
pixel art, 8-bit retro game sprite, 64x64 pixel grid, crisp hard pixel edges, no anti-aliasing,
limited 16-color palette, dark 1-pixel outline, simple flat shading,
plain solid warm cream background (#F7F3EA), centered, no text, no logo
```

## 캐릭터 (공통 줄)
```
[공통 스타일], a cute little Korean chef character, chibi proportions with a big head,
gender-neutral round face, black dot eyes, rosy cheeks, short black bob hair,
front-facing full body standing pose, same character design in every image,
```

| 번호 | 옷차림 줄 |
|---|---|
| 0 (시트) | `character sprite sheet: front, side and back view, plus happy, proud and surprised faces, wearing a plain light-gray t-shirt, dark pants and a beige bib apron` |
| 1 | `wearing a plain light-gray t-shirt, dark pants and a beige bib apron, eager and a little nervous expression` |
| 2 | `same outfit as the reference image, now also wearing a small red neckerchief around the neck` |
| 3 | `same outfit as the reference image, now also wearing a short white chef hat` |
| 4 | `the t-shirt is replaced by a white double-breasted chef jacket with white buttons, keep the beige apron, red neckerchief and short white chef hat` |
| 5 | `same chef jacket, apron and red neckerchief, the hat is now a tall pleated white chef toque, holding a small wooden ladle, confident smile` |
| 6 | `white chef jacket with gold buttons, red neckerchief with gold trim, the tallest pleated white chef toque with a gold band, a small gold medal on the chest, proud master chef pose, a few sparkle pixels` |

## 상차림 (공통 줄)
```
[공통 스타일], a traditional Korean meal table seen from a slight top-down angle, game item icon style,
```

| 번호 | 상차림 줄 |
|---|---|
| 1 | `a small round wooden soban with one bowl of white rice and chopsticks` |
| 2 | `a small wooden table with rice, soup, kimchi and three small side dishes` |
| 3 | `a wooden table with rice, soup, kimchi and five side dishes including a grilled fish` |
| 4 | `a wider wooden table with rice, soup, kimchi and seven side dishes including savory pancakes` |
| 5 | `an elegant red lacquered table with brass bowls and nine colorful side dishes` |
| 6 | `a lavish royal surasang on two red lacquered tables, shiny gold brass bowls, twelve side dishes, sparkle pixels` |
