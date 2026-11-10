import type { Recipe } from '../types'
import { LIGHT_RECIPES, TAG_LABEL, tagsOf, type Tag } from '../data/tags'
import { normalize } from './recommend'

export type DietStyle = 'all' | 'pesco' | 'lacto-ovo' | 'vegan'

export interface DietProfile {
  style: DietStyle
  /** 못 먹는 재료 (알러지) */
  allergies: Tag[]
  /** 싫어하는 재료 이름 */
  dislikes: string[]
}

export const EMPTY_DIET: DietProfile = { style: 'all', allergies: [], dislikes: [] }

export const STYLE_LABEL: Record<DietStyle, string> = {
  all: '다 먹어요',
  pesco: '페스코',
  'lacto-ovo': '락토오보',
  vegan: '비건',
}

export const STYLE_HINT: Record<DietStyle, string> = {
  all: '고기·해산물 모두 먹어요',
  pesco: '고기는 빼고, 해산물·계란·유제품은 먹어요',
  'lacto-ovo': '고기·해산물은 빼고, 계란·유제품은 먹어요',
  vegan: '동물성 재료를 모두 빼요 (계란·유제품·꿀 포함)',
}

const STYLE_BLOCKS: Record<DietStyle, Tag[]> = {
  all: [],
  pesco: ['meat'],
  'lacto-ovo': ['meat', 'seafood'],
  vegan: ['meat', 'seafood', 'egg', 'dairy', 'honey'],
}

export function isDietActive(p: DietProfile): boolean {
  return p.style !== 'all' || p.allergies.length > 0 || p.dislikes.length > 0
}

/**
 * 이 레시피가 내 식단에 맞지 않는 이유. 빈 배열이면 먹어도 됨.
 * 예: ['간장(밀)', '고기', '오이']
 */
export function blockedBy(recipe: Recipe, p: DietProfile): string[] {
  if (!isDietActive(p)) return []
  const reasons: string[] = []
  const dislikes = new Set(p.dislikes.map(normalize))
  const styleBlocks = new Set(STYLE_BLOCKS[p.style])
  const allergies = new Set(p.allergies)
  let styleHit: Tag | null = null

  for (const { name } of recipe.ingredients) {
    const tags = new Set([...tagsOf(name), ...tagsOf(normalize(name))])
    for (const t of tags) {
      if (allergies.has(t)) reasons.push(`${name}(${TAG_LABEL[t]})`)
      if (!styleHit && styleBlocks.has(t)) styleHit = t
    }
    if (dislikes.has(normalize(name))) reasons.push(name)
  }
  if (styleHit) reasons.unshift(TAG_LABEL[styleHit] ?? styleHit)
  return [...new Set(reasons)]
}

/** 아이와 같이 먹을 때: 매운 재료가 하나도 없는 요리 */
export function isMild(recipe: Recipe): boolean {
  return !recipe.ingredients.some(({ name }) => tagsOf(name).includes('spicy'))
}

export function isLight(recipe: Recipe): boolean {
  return LIGHT_RECIPES.has(recipe.name)
}

/** 레시피 홈 "내 식단 적용 중" 한 줄 요약 */
export function dietSummary(p: DietProfile): string {
  const parts: string[] = []
  if (p.style !== 'all') parts.push(STYLE_LABEL[p.style])
  for (const t of p.allergies) parts.push(`${TAG_LABEL[t]} 제외`)
  if (p.dislikes.length > 0) parts.push(`${p.dislikes.join(', ')} 빼고`)
  return parts.join(' · ')
}
