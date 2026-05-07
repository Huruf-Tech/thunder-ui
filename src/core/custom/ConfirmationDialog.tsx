import React, { type HTMLProps } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import type {
  ComponentRenderFn,
  DialogRootActions,
  DialogTriggerState,
} from "@base-ui/react"

type ConfirmationDialogProps =
  | { type?: "normal"; hint?: never; onConfirm: (dismiss: () => void) => void }
  | { type: "strict"; hint: string; onConfirm: (dismiss: () => void) => void }

export const ConfirmationDialog = (
  props: ConfirmationDialogProps & {
    trigger:
      | React.ReactElement<
          unknown,
          string | React.JSXElementConstructor<unknown>
        >
      | ComponentRenderFn<HTMLProps<unknown>, DialogTriggerState>
      | undefined
  }
) => {
  const sheetRef = React.useRef<DialogRootActions>(null)
  const [value, setValue] = React.useState("")
  const type = props.type ?? "normal"

  return (
    <Sheet
      actionsRef={sheetRef}
      onOpenChange={(value) => {
        if (!value) setValue("")
      }}
    >
      <SheetTrigger render={props.trigger}></SheetTrigger>
      <SheetContent side="bottom" className="mx-auto mb-2 max-w-sm rounded-2xl">
        <SheetHeader>
          <SheetTitle className="text-xl">Confirmation</SheetTitle>
          <SheetDescription>
            Are you sure you want to do this action?
          </SheetDescription>
        </SheetHeader>

        {type === "strict" ? (
          <FieldGroup className="px-5">
            <Field>
              <FieldLabel>
                Type <span className="bg-primary/10">{props.hint}</span> to
                confirm the action.
              </FieldLabel>
              <Input
                placeholder={"Hint here..."}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
              {value && value !== props.hint && (
                <FieldError>please type a correct hint!</FieldError>
              )}
            </Field>
          </FieldGroup>
        ) : null}
        <SheetFooter>
          <Button
            className="w-full"
            disabled={type === "strict" && value !== props.hint}
            onClick={() => props.onConfirm(sheetRef.current!.close)}
          >
            Confirm
          </Button>
          <Button variant="outline" onClick={() => sheetRef.current!.close()}>
            Dismiss
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
