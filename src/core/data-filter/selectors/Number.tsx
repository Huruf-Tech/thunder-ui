import React from "react"
import { Input } from "@/components/ui/input"
import { Slider, SliderValue } from "@/components/ui/slider"
import { RangeOperator, type TNumberColumnConfig } from ".."
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

export const NumberComp: React.FC<TNumberColumnConfig> = ({
  id,
  value,
  min = 0,
  max,
  label,
  operator = RangeOperator.BETWEEN,
  ...props
}) => {
  const [showSlider, setShowSlider] = React.useState(true)

  return (
    <FieldGroup>
      {showSlider ? (
        <Field>
          <Slider
            defaultValue={value}
            min={min}
            max={max}
            onValueChange={(value) =>
              props.onValueChange(value as number[], operator)
            }
          >
            <div className="mb-3 flex items-center justify-between gap-1">
              {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
              <SliderValue />
            </div>
          </Slider>
        </Field>
      ) : (
        <Field>
          {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
          <ButtonGroup id={id}>
            <Input
              type="number"
              placeholder="Min"
              defaultValue={value?.[0] ?? 0}
              min={min}
              onChange={(e) =>
                props.onValueChange(
                  [e.target.valueAsNumber, value?.[1]],
                  operator
                )
              }
            />
            <Input
              type="number"
              placeholder="Max"
              defaultValue={value?.[1]}
              max={max}
              onChange={(e) =>
                props.onValueChange(
                  [value?.[0], e.target.valueAsNumber],
                  operator
                )
              }
            />
          </ButtonGroup>
        </Field>
      )}

      <Field>
        <Button
          variant="ghost"
          size="xs"
          className="max-w-fit"
          onClick={() => setShowSlider(!showSlider)}
        >
          Manual Range
        </Button>
      </Field>

      <Field>
        <Select
          value={operator}
          onValueChange={(val) => props.onValueChange(value, val!)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selector" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.entries(RangeOperator).map(([label, value]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
    </FieldGroup>
  )
}
