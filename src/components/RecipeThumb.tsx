import type { Recipe, RecipeType } from '../types'

/**
 * 레시피 사진. src/assets/recipes/<레시피 id>.webp 가 있으면 그 사진을,
 * 없으면 요리 종류별 색 + 첫 글자로 대신 보여 준다.
 * 사진 추가 방법: docs/recipe-photos.md
 */
const PHOTOS = import.meta.glob<string>('../assets/recipes/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
})

const PHOTO_BY_ID: Record<string, string> = Object.fromEntries(
  Object.entries(PHOTOS).map(([path, url]) => [path.split('/').pop()!.replace('.webp', ''), url]),
)

export function recipePhoto(id: string): string | undefined {
  return PHOTO_BY_ID[id]
}

export const PHOTO_COUNT = Object.keys(PHOTO_BY_ID).length

/** 사진이 없을 때 종류별 배경색 / 글자색 */
const TYPE_TONE: Record<RecipeType, [string, string]> = {
  '국·찌개': ['#fdeee6', '#a3451c'],
  '밥·덮밥': ['#fbf3dc', '#7a5a00'],
  면: ['#f6eddc', '#875a18'],
  '볶음·구이': ['#fde8e8', '#a32d2d'],
  반찬: ['#e7f3ec', '#1f6b45'],
  '분식·간식': ['#fbeaf0', '#993556'],
  양식: ['#e8eefb', '#2c4f8c'],
}

export function RecipeThumb({
  recipe,
  className = 'recipe-thumb',
  fullName = false,
}: {
  recipe: Pick<Recipe, 'id' | 'name' | 'type'>
  className?: string
  /** 사진이 없을 때 첫 글자 대신 이름 전체를 보여 줄지 (타일·상세처럼 넓은 곳) */
  fullName?: boolean
}) {
  const url = recipePhoto(recipe.id)
  const [bg, fg] = TYPE_TONE[recipe.type]
  if (url) {
    return (
      <span className={`${className} has-photo`} aria-hidden="true">
        <img src={url} alt="" loading="lazy" decoding="async" />
      </span>
    )
  }
  return (
    <span
      className={`${className}${fullName ? ' thumb-name' : ''}`}
      aria-hidden="true"
      style={{ background: bg, color: fg }}
    >
      {fullName ? recipe.name : recipe.name[0]}
    </span>
  )
}
