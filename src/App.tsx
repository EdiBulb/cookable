import { useEffect } from 'react'
import { HashRouter, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { track } from './lib/analytics'
import { KitchenProvider } from './store/KitchenContext'
import { Splash } from './components/Splash'
import { TabBar } from './components/TabBar'
import { KitchenScreen } from './screens/KitchenScreen'
import { AddIngredientsScreen } from './screens/AddIngredientsScreen'
import { RecipesScreen } from './screens/RecipesScreen'
import { RecipeDetailScreen } from './screens/RecipeDetailScreen'
import { CartScreen } from './screens/CartScreen'
import { SettingsScreen } from './screens/SettingsScreen'

/** 탭바는 메인 탭 화면에서만 보여준다. 첫 화면은 레시피(앱을 여는 이유) */
const TAB_ROUTES = ['/', '/kitchen', '/cart']

function Shell() {
  const { pathname } = useLocation()
  useEffect(() => {
    const screen = pathname.startsWith('/recipes/') ? 'recipe_detail' : pathname === '/' ? 'recipes' : pathname.slice(1)
    track('screen_view', { screen })
  }, [pathname])
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<RecipesScreen />} />
        <Route path="/kitchen" element={<KitchenScreen />} />
        <Route path="/add" element={<AddIngredientsScreen />} />
        <Route path="/recipes/:id" element={<RecipeDetailScreen />} />
        <Route path="/cart" element={<CartScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="*" element={<RecipesScreen />} />
      </Routes>
      {TAB_ROUTES.includes(pathname) && <TabBar />}
    </div>
  )
}

// 기본은 HashRouter: 서버 설정 없이 어떤 정적 호스팅에서도 새로고침이 동작.
// 주소창 해시를 쓸 수 없는 임베드 환경(미리보기 등)에서는 VITE_ROUTER=memory 로 빌드.
const Router = import.meta.env.VITE_ROUTER === 'memory' ? MemoryRouter : HashRouter

export default function App() {
  return (
    <Router>
      <KitchenProvider>
        <Shell />
        <Splash />
      </KitchenProvider>
    </Router>
  )
}
