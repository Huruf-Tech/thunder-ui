import React, { type HTMLProps } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import type {
  ComponentRenderFn,
  DialogRootActions,
  DialogTriggerState,
} from "@base-ui/react";

type ConfirmationDialogProps =
  | { type?: "normal"; hint?: never; onConfirm: (dismiss: () => void) => void }
  | { type: "strict"; hint: string; onConfirm: (dismiss: () => void) => void };

export const ConfirmationDialog = (
  props: ConfirmationDialogProps & {
    trigger:
      | React.ReactElement<
        unknown,
        string | React.JSXElementConstructor<unknown>
      >
      | ComponentRenderFn<HTMLProps<unknown>, DialogTriggerState>
      | undefined;
  },
) => {
  const { t } = useTranslation();
  const sheetRef = React.useRef<DialogRootActions>(null);
  const [value, setValue] = React.useState("");
  const [isConfirming, setIsConfirming] = React.useState(false);
  const type = props.type ?? "normal";

  const handleConfirm = async () => {
    try {
      setIsConfirming(true);
      await props.onConfirm(() => sheetRef.current!.close());
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Sheet
      actionsRef={sheetRef}
      onOpenChange={(value) => {
        if (!value) setValue("");
      }}
    >
      <SheetTrigger render={props.trigger}></SheetTrigger>
      <SheetContent side="bottom" className="mx-auto mb-2 max-w-sm rounded-2xl">
        <SheetHeader>
          <SheetTitle className="text-xl">{t("Confirmation")}</SheetTitle>
          <SheetDescription>
            {t("Are you sure you want to do this action?")}
          </SheetDescription>
        </SheetHeader>

        {type === "strict"
          ? (
            <FieldGroup className="px-5">
              <Field>
                <FieldLabel>
                  {t("Type {{hint}} to confirm the action.", {
                    hint: props.hint,
                  })}
                </FieldLabel>
                <Input
                  placeholder={t("Hint here...")}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
                {value && value !== props.hint && (
                  <FieldError>{t("please type a correct hint!")}</FieldError>
                )}
              </Field>
            </FieldGroup>
          )
          : null}
        <SheetFooter>
          <Button
            className="w-full"
            disabled={type === "strict" && value !== props.hint || isConfirming}
            onClick={handleConfirm}
          >
            {t("Confirm")}
          </Button>
          <Button variant="outline" onClick={() => sheetRef.current!.close()}>
            {t("Dismiss")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};