import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth, useData } from '@/store'

/** 로그인 상태면 즉시 담기, 게스트면 로그인으로 보냈다가 로그인 직후 자동으로 담는다 (useAuth pending) */
export function useAddToCart({ productId, variantId, name, price, optionName }) {
  const navigate = useNavigate()
  const location = useLocation()
  const authed = useAuth((s) => s.authed)
  const setPending = useAuth((s) => s.setPending)
  const addCartItem = useData((s) => s.addCartItem)
  const [adding, setAdding] = useState(false)

  const run = () => addCartItem(variantId, 1, { productId, name, price, optionName })

  const handleAddToCart = async () => {
    if (!authed) {
      setPending({ type: 'cart', name, run })
      navigate('/login', { state: { from: location.pathname } })
      return
    }
    setAdding(true)
    try {
      await run()
    } finally {
      setAdding(false)
    }
  }

  return { adding, handleAddToCart }
}
