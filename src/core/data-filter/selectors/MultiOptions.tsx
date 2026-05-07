import React from "react"
import {
  MultiOptionOperator,
  OptionOperator,
  type TMultiOptionColumnConfig,
} from ".."
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const MultiSelectComp: React.FC<TMultiOptionColumnConfig> = ({
  id,
  options,
  value,
  placeholder,
  operator = MultiOptionOperator.INCLUDES,
  label,
  enableOperator,
  onValueChange,
}) => {
  const anchor = useComboboxAnchor()

  return (
    <FieldGroup>
      <Field>
        {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
        <Combobox
          id={id}
          items={options ?? []}
          multiple
          autoHighlight
          defaultValue={value}
          onValueChange={(val) => onValueChange(val, operator)}
        >
          <ComboboxChips ref={anchor}>
            <ComboboxValue>
              {(item) => (
                <React.Fragment>
                  {item.map((item: string) => (
                    <ComboboxChip key={item}>{item}</ComboboxChip>
                  ))}
                  <ComboboxChipsInput placeholder={placeholder} />
                </React.Fragment>
              )}
            </ComboboxValue>
          </ComboboxChips>
          <ComboboxContent anchor={anchor}>
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item.value} value={item.value}>
                  {item.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Field>

      {enableOperator && (
        <Select
          value={operator}
          onValueChange={(val) => onValueChange(value, val!)}
        >
          <SelectTrigger className="w-full">
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
      )}
    </FieldGroup>
  )
}
