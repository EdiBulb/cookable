/**
 * 레시피 사진 도구
 *
 *   npm run photos:list            → docs/recipe-photo-list.csv (사진 만들 목록 + AI 프롬프트)
 *   npm run photos -- <폴더>        → 폴더의 사진을 정사각형 webp 썸네일로 바꿔 src/assets/recipes/ 에 저장
 *
 * 사진 파일 이름은 레시피 id(kimchi-jjigae.jpg) 또는 레시피 이름(김치찌개.png) 둘 다 된다.
 */
import { readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, extname, basename } from 'node:path'
import sharp from 'sharp'
import { RECIPES } from '../src/data/recipes'

const OUT = 'src/assets/recipes'
const SIZE = 600

const prompt = (name: string, ingredients: string[]) =>
  `Overhead photo of Korean home-cooked "${name}" (${ingredients.slice(0, 4).join(', ')}), ` +
  `served in a simple bowl or plate on a light wooden table, natural window light, ` +
  `realistic food photography, square 1:1, no text, no hands, no logos`

async function list() {
  const have = new Set(existsSync(OUT) ? readdirSync(OUT).filter((f) => f.endsWith('.webp')).map((f) => basename(f, '.webp')) : [])
  const rows = [['id', 'name', 'type', 'has_photo', 'prompt']]
  for (const r of RECIPES) {
    const ings = r.ingredients.map((i) => i.name)
    rows.push([r.id, r.name, r.type, have.has(r.id) ? 'yes' : '', prompt(r.name, ings)])
  }
  const csv = rows.map((row) => row.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(',')).join('\n')
  writeFileSync('docs/recipe-photo-list.csv', '﻿' + csv)
  console.log(`docs/recipe-photo-list.csv — 레시피 ${RECIPES.length}개, 사진 있음 ${have.size}개`)
}

async function convert(dir: string) {
  mkdirSync(OUT, { recursive: true })
  const byKey = new Map<string, string>()
  for (const r of RECIPES) {
    byKey.set(r.id, r.id)
    byKey.set(r.name.normalize('NFC'), r.id)
  }
  let done = 0
  const unknown: string[] = []
  for (const file of readdirSync(dir)) {
    if (!/\.(jpe?g|png|webp|avif)$/i.test(file)) continue
    const key = basename(file, extname(file)).normalize('NFC').trim()
    const id = byKey.get(key)
    if (!id) {
      unknown.push(file)
      continue
    }
    await sharp(join(dir, file))
      .rotate()
      .resize(SIZE, SIZE, { fit: 'cover', position: 'attention' })
      .webp({ quality: 78 })
      .toFile(join(OUT, `${id}.webp`))
    done++
  }
  console.log(`썸네일 ${done}개 저장 → ${OUT}`)
  if (unknown.length) console.log(`이름이 레시피와 안 맞아서 건너뜀 (${unknown.length}개):\n  ${unknown.join('\n  ')}`)
}

const [cmd, arg] = process.argv.slice(2)
if (cmd === 'list') await list()
else if (cmd === 'convert' && arg) await convert(arg)
else console.log('사용법: npm run photos:list  |  npm run photos -- <사진 폴더>')
