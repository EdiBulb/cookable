import { NavLink } from 'react-router-dom'
import { useKitchen } from '../store/KitchenContext'
import { BowlIcon, CartIcon, FridgeIcon } from './icons'

export function TabBar() {
  const { state } = useKitchen()
  const cartCount = state.cart.filter((c) => !c.done).length
  const cls = ({ isActive }: { isActive: boolean }) => (isActive ? 'tab active' : 'tab')

  return (
    <nav className="tabbar" aria-label="메인 메뉴">
      <NavLink to="/" end className={cls}>
        <BowlIcon />
        레시피
      </NavLink>
      <NavLink to="/kitchen" className={cls}>
        <FridgeIcon />
        내 주방
      </NavLink>
      <NavLink to="/cart" className={cls}>
        <span className="tab-icon">
          <CartIcon />
          {cartCount > 0 && (
            <span className="badge" aria-label={`${cartCount}개`}>
              {cartCount}
            </span>
          )}
        </span>
        장바구니
      </NavLink>
    </nav>
  )
}
