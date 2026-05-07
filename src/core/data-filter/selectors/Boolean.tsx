import React from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { BooleanOperator, type TBooleanColumnConfig } from ".."
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const SwitchComp: React.FC<TBooleanColumnConfig> = ({
  id,
  displayName,
  enableOperator,
  operator = BooleanOperator.EQUAL,
  value,
  onValueChange,
}) => {
  return (
    <div className="flex w-full items-center justify-between gap-3">
      <Label htmlFor={id} className="cursor-pointer">
        <Switch
          id={id}
          checked={value}
          onCheckedChange={(checked) => onValueChange(checked, operator)}
        />
        {displayName}
      </Label>

      {enableOperator && (
        <Select
          value={operator}
          onValueChange={(val) => onValueChange(value, val!)}
        >
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Selector" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.entries(BooleanOperator).map(([label, value]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
