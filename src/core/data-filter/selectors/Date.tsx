import React from "react"
import { Label } from "@/components/ui/label"
import { DateOperator, type TDateColumnConfig } from ".."
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ButtonGroup } from "@/components/ui/button-group"
import { Field, FieldGroup } from "@/components/ui/field"
import { formatDateForInput } from "@/core/lib/utils"

export const CalendarComp: React.FC<TDateColumnConfig> = ({
  id,
  operator = DateOperator.EQUAL,
  ...props
}) => {
  return (
    <FieldGroup>
      <Field>
        {props.displayName && (
          <Label htmlFor={id} className="text-sm">
            {props.displayName}
          </Label>
        )}

        {props.mode === "range" ? (
          <ButtonGroup>
            <Input
              id={id}
              type="date"
              defaultValue={formatDateForInput(props.value?.[0])}
              onChange={(e) =>
                props.onValueChange(
                  [e.target.valueAsDate, props.value?.[1] as Date | null],
                  operator
                )
              }
            />
            <Input
              type="date"
              defaultValue={formatDateForInput(props.value?.[1])}
              onChange={(e) =>
                props.onValueChange(
                  [props.value?.[0] as Date | null, e.target.valueAsDate],
                  operator
                )
              }
            />
          </ButtonGroup>
        ) : (
          <Input
            type="date"
            id={id}
            defaultValue={formatDateForInput(props.value)}
            onChange={(e) =>
              props.onValueChange(e.currentTarget.valueAsDate, operator)
            }
          />
        )}
      </Field>

      {props.enableOperator ? (
        <Field>
          <Select
            value={operator}
            onValueChange={(val) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              props.onValueChange(props.value as any, val!)
            }
          >
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Selector" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {Object.entries(DateOperator).map(([label, value]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      ) : null}
    </FieldGroup>
  )
}
