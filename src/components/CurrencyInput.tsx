import { Input } from "@/components/ui/input"

type Props = {
  id?: string
  value: string // hanya digit
  onChange: (digits: string) => void
  placeholder?: string
}

export function CurrencyInput({ id, value, onChange, placeholder = "0" }: Props) {
  return (
    <Input
      id={id}
      inputMode="numeric"
      placeholder={placeholder}
      value={value ? Number(value).toLocaleString("id-ID") : ""}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
    />
  )
}