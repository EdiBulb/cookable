/**
 * 체험 모드(?demo=1)용 가짜 레시피 사진 만들기.
 *   npx tsx scripts/demo-photos.ts
 * 나무 식탁 위 그릇 일러스트를 레시피마다 색을 달리해 그린다. 실제 사용자 화면에는 나오지 않음.
 * 사진 없는 타일 모양도 확인할 수 있게 3개 중 1개는 일부러 비워 둔다.
 */
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import sharp from 'sharp'
import { RECIPES } from '../src/data/recipes'
import type { RecipeType } from '../src/types'

const OUT = 'public/demo'
const SIZE = 480

// 요리 종류별 음식 색 [국물/밥 바탕, 건더기1, 건더기2]
const FOOD: Record<RecipeType, [string, string, string]> = {
  '국·찌개': ['#c8462c', '#f2e6c9', '#3f7d3a'],
  '밥·덮밥': ['#f4ead2', '#b5542a', '#4f8a3a'],
  면: ['#e9c98a', '#8b3a1e', '#5d9a45'],
  '볶음·구이': ['#9c3b22', '#e7b25a', '#3d7a34'],
  반찬: ['#6f9b3c', '#d8c36a', '#c9532f'],
  '분식·간식': ['#d9542f', '#f2d36b', '#f6efe0'],
  양식: ['#e9d3a6', '#c0392b', '#5b8c3b'],
}

function hash(s: string): number {
  let h = 2166136261
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

function svg(id: string, type: RecipeType): string {
  let seed = hash(id)
  const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296)
  const [base, a, b] = FOOD[type]
  const bowl = type === '국·찌개' || type === '면' || type === '밥·덮밥'
  const pieces = Array.from({ length: 14 }, (_, i) => {
    const ang = rnd() * Math.PI * 2
    const r = Math.sqrt(rnd()) * 108
    const x = 240 + Math.cos(ang) * r
    const y = 250 + Math.sin(ang) * r
    const w = 14 + rnd() * 26
    const h = 10 + rnd() * 18
    const fill = i % 3 === 0 ? b : a
    return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${w.toFixed(1)}" ry="${h.toFixed(1)}" fill="${fill}" transform="rotate(${Math.round(rnd() * 180)} ${x.toFixed(1)} ${y.toFixed(1)})" opacity="0.95"/>`
  }).join('')
  const grain = Array.from({ length: 9 }, (_, i) => {
    const y = 20 + i * 55 + rnd() * 20
    return `<path d="M0 ${y.toFixed(0)} C160 ${(y - 12).toFixed(0)} 320 ${(y + 14).toFixed(0)} 480 ${y.toFixed(0)}" stroke="#a87a4f" stroke-width="2" fill="none" opacity="0.35"/>`
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 480 480">
  <rect width="480" height="480" fill="#c99a6b"/>${grain}
  <ellipse cx="248" cy="262" rx="186" ry="182" fill="#000" opacity="0.18"/>
  <circle cx="240" cy="250" r="182" fill="${bowl ? '#2f3a44' : '#f7f4ee'}"/>
  <circle cx="240" cy="250" r="${bowl ? 150 : 160}" fill="${bowl ? '#f1ece2' : '#ffffff'}"/>
  <circle cx="240" cy="250" r="${bowl ? 132 : 128}" fill="${base}"/>
  ${pieces}
  <ellipse cx="185" cy="185" rx="60" ry="26" fill="#fff" opacity="0.18" transform="rotate(-35 185 185)"/>
</svg>`
}

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
const ids: string[] = []
for (const [i, r] of RECIPES.entries()) {
  if (i % 3 === 2) continue // 사진 없는 타일도 섞어서 보이게
  await sharp(Buffer.from(svg(r.id, r.type))).webp({ quality: 72 }).toFile(`${OUT}/${r.id}.webp`)
  ids.push(r.id)
}
writeFileSync(
  'src/data/demoPhotos.ts',
  `// scripts/demo-photos.ts가 만든 목록 — 직접 고치지 마세요\nexport const DEMO_PHOTO_IDS = new Set<string>(${JSON.stringify(ids)})\n`,
)
console.log(`가짜 사진 ${ids.length}개 → ${OUT} (레시피 ${RECIPES.length}개 중)`)
