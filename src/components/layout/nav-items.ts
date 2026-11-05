import { Coins, LayoutDashboard, PiggyBank, ReceiptText, Settings2 } from "lucide-react"

export const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/transaksi", label: "Transaksi", icon: ReceiptText, end: false },
  { to: "/budgeting", label: "Budgeting", icon: PiggyBank, end: false },
  { to: "/tabungan", label: "Tabungan", icon: Coins, end: false },
  { to: "/setup", label: "Set Up", icon: Settings2, end: false },
]