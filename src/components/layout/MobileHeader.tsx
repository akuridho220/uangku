import { LogOut } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"

export function MobileHeader() {
  const { signOut } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] md:hidden">
      <span className="font-semibold">Keuangan Pribadi</span>
      <Button variant="ghost" size="icon" onClick={signOut} aria-label="Keluar">
        <LogOut className="size-4" />
      </Button>
    </header>
  )
}