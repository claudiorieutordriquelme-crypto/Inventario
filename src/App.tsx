import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './features/dashboard/Dashboard'
import { InventoryPage } from './features/inventory/InventoryPage'
import { FunnelPage } from './features/funnel/FunnelPage'
import { CustomersPage } from './features/funnel/CustomersPage'
import { CatalogPage } from './features/catalog/CatalogPage'
import { CommunityPage } from './features/community/CommunityPage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inventario" element={<InventoryPage />} />
        <Route path="/funnel" element={<FunnelPage />} />
        <Route path="/clientes" element={<CustomersPage />} />
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route path="/comunidad" element={<CommunityPage />} />
      </Routes>
    </Layout>
  )
}
