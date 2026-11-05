import { ChevronLeft, ChevronRight } from "lucide-react"
import { formatMonthLabel, shiftMonth } from "@/lib/date"
import { Button } from "@/components/ui/button"

type Props = { month: string; onChange: (month: string) => void }

export function MonthNav({ month, onChange }: Props) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(shiftMonth(month, -1))}
        aria-label="Bulan sebelumnya"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-36 text-center text-sm font-medium capitalize">
        {formatMonthLabel(month)}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(shiftMonth(month, 1))}
        aria-label="Bulan berikutnya"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}