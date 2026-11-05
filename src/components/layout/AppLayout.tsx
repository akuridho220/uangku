import { Outlet } from "react-router-dom"
import { BottomNav } from "./BottomNav"
import { MobileHeader } from "./MobileHeader"
import { Sidebar } from "./Sidebar"

export function AppLayout() {
  return (
    <div className="min-h-svh">
      <Sidebar />
      <MobileHeader />
      <main className="md:pl-60">
        <div className="mx-auto w-full max-w-5xl p-4 pb-24 md:p-8">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}