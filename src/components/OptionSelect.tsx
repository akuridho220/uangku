import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type Option = { value: string; label: string }

type Props = {
  id?: string
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
}

export function OptionSelect({ id, value, onChange, options, placeholder }: Props) {
  return (
    <Select
      items={options}
      value={value || null}
      onValueChange={(v) => onChange(v ?? "")}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}