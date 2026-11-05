import { Route, Routes } from "react-router-dom"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { AppLayout } from "@/components/layout/AppLayout"
import LoginPage from "@/pages/LoginPage"
import DashboardPage from "@/pages/DashboardPage"
import SetupPage from "@/pages/SetupPage"
import TransactionsPage from "@/pages/TransactionsPage"
import BudgetingPage from "@/pages/BudgetingPage"

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/transaksi" element={<TransactionsPage />} />
          <Route path="/budgeting" element={<BudgetingPage />} />
          <Route path="/setup" element={<SetupPage />} />
        </Route>
      </Route>
    </Routes>
  )
}