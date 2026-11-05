import { NavLink } from "react-router-dom"
import { LogOut } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { navItems } from "./nav-items"

export function Sidebar() {
  const { session, signOut } = useAuth()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
      <div className="px-5 py-5 text-lg font-semibold">Keuangan Pribadi</div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-3">
        <p className="truncate px-3 pb-2 text-xs text-muted-foreground">
          {session?.user.email}
        </p>
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={signOut}>
          <LogOut className="size-4" />
          Keluar
        </Button>
      </div>
    </aside>
  )
}