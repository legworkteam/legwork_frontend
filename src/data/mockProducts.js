export const MOCK_PRODUCTS = {
  'scan-result': { name: 'Visetos Original Tote', variant: 'COGNAC / ONE SIZE' },
}

export function getMockProduct(productId) {
  return MOCK_PRODUCTS[productId] ?? { name: '인식된 제품', variant: productId }
}
