import raw from './mcm_products_mock_data_v2.json'

const images = import.meta.glob('../assets/product/*.jpg', { eager: true, import: 'default' })
const imageFor = (id) => images[`../assets/product/${id}.jpg`]

/**
 * 실제 API(§11)는 variantId(색상/사이즈 조합) 기준으로 장바구니를 담는데,
 * 이 mock 카탈로그엔 variant 개념이 없어서 상품당 가짜 variantId 1개로 연결한다.
 * 실제 백엔드 연동 시 GET /products/{id}/variants 로 교체.
 */
export const PRODUCTS = raw.map((p) => ({ ...p, image: imageFor(p.id), variantId: `var_${p.id}` }))

/** 색상 스와치용 — matchingItems.colors(한글)를 hex로 매핑 */
export const COLOR_SWATCH = {
  블랙: '#1a1c1c',
  브라운: '#a9642f',
  베이지: '#e4d9c4',
}

export function getProduct(id) {
  return PRODUCTS.find((p) => String(p.id) === String(id))
}

export function getProductByCode(code) {
  const needle = code?.trim().toLowerCase()
  return PRODUCTS.find((p) => p.productCode.toLowerCase() === needle)
}

/** 품번 스캔/직접입력 결과 매칭 — 숫자 id 우선, 그다음 품번 코드, 둘 다 실패하면 undefined */
export function findProduct(idOrCode) {
  return getProduct(idOrCode) ?? getProductByCode(String(idOrCode ?? ''))
}

export function getRandomProduct() {
  return PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)]
}

/** 같은 카테고리 → 스타일 태그 겹침 순으로 추천, 부족하면 다른 상품으로 채움 */
export function getRecommendations(productId, limit = 2) {
  const current = getProduct(productId)
  if (!current) return PRODUCTS.slice(0, limit)

  const rest = PRODUCTS.filter((p) => p.id !== current.id)
  const sameCategory = rest.filter((p) => p.category === current.category)
  const sharedStyle = rest.filter(
    (p) => !sameCategory.includes(p) && p.styleTags.some((tag) => current.styleTags.includes(tag))
  )
  const others = rest.filter((p) => !sameCategory.includes(p) && !sharedStyle.includes(p))

  return [...sameCategory, ...sharedStyle, ...others].slice(0, limit)
}

export function formatPrice(price) {
  return `${price.toLocaleString('ko-KR')}원`
}
