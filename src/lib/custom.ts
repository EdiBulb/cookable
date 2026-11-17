import type { Recipe, RecipeOverride } from '../types'

/** 기본 레시피 + 나만의 고친 내용 → 실제로 쓸 레시피 */
export function applyOverride(base: Recipe, ov?: RecipeOverride): Recipe {
  if (!ov) return base
  const removed = new Set(ov.remove)
  const kept = base.ingredients.filter((i) => !removed.has(i.name))
  const existing = new Set(kept.map((i) => i.name))
  const added = ov.add.filter((a) => a.name.trim() && !existing.has(a.name))
  return {
    ...base,
    name: ov.name?.trim() || base.name,
    ingredients: [...kept, ...added],
    baseName: base.name,
    custom: true,
  }
}

/** 고친 게 하나도 없으면 저장할 필요 없음 */
export function isEmptyOverride(ov: RecipeOverride, base: Recipe): boolean {
  return (
    ov.remove.length === 0 &&
    ov.add.length === 0 &&
    !ov.note?.trim() &&
    (!ov.name?.trim() || ov.name.trim() === base.name)
  )
}

export function defaultCustomName(base: Recipe): string {
  return `나만의 ${base.name}`
}

export function isUrl(s: string | undefined): boolean {
  return Boolean(s && /^https?:\/\/\S+$/i.test(s.trim()))
}
