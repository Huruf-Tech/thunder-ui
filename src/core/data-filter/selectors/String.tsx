import React from "react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { StringOperator, type TStringColumnConfig } from ".."
import { Field } from "@/components/ui/field"
import { IconSearch } from "@tabler/icons-react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const SearchComp: React.FC<TStringColumnConfig> = ({
  id,
  label,
  placeholder,
  enableOperator,
  operator = StringOperator.MATCH,
  value,
  onValueChange,
  ...props
}) => {
  return (
    <Field>
      {label && <Label htmlFor={id}>{label}</Label>}
      <InputGroup>
        <InputGroupInput
          placeholder={placeholder ?? "Search..."}
          value={value}
          onChange={(e) => onValueChange(e.target.value, operator)}
        />
        <InputGroupAddon>
          {props.icon ? <props.icon /> : <IconSearch />}
        </InputGroupAddon>
        {enableOperator ? (
          <InputGroupAddon align="inline-end" className="pe-0.5">
            <Select
              value={operator}
              onValueChange={(val) => onValueChange(value, val!)}
            >
              <SelectTrigger>
                <SelectValue placeholder={"Selector"} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {Object.entries(StringOperator).map(([label, value]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
    </Field>
  )
}
