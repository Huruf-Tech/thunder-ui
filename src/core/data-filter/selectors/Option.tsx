import React from "react"
import { OptionOperator, type TOptionColumnConfig } from ".."
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

export const SelectComp: React.FC<TOptionColumnConfig> = ({
  label,
  placeholder,
  options,
  operator = OptionOperator.EQUAL,
  value,
  onValueChange,
  ...props
}) => {
  return (
    <FieldGroup>
      <Field>
        {label && <FieldLabel>{label}</FieldLabel>}
        <Combobox
          items={options ?? []}
          onValueChange={(val) => onValueChange(val as string, operator)}
        >
          <ComboboxInput placeholder={placeholder} />
          <ComboboxContent>
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <ComboboxList>
              {(item, idx) => (
                <ComboboxItem key={item.value + idx} value={item.value}>
                  {item.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Field>
      {props.enableOperator && (
        <Field>
          <Select
            value={operator}
            onValueChange={(val) => onValueChange(value, val!)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selector" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {Object.entries(OptionOperator).map(([label, value]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      )}
    </FieldGroup>
  )
}
