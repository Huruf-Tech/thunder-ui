import { SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";
import { Button } from "./ui/button";
import { ActionSheetRef } from "@/registry/ActionSheet";
type ConfirmationDialogProps = {
    onConfirm: (dismiss: () => void) => void | Promise<void>;
};
export const ConfirmationDialog = (props: ConfirmationDialogProps) => {
    return (
        <div className="pb-5">
            <SheetHeader>
                <SheetTitle className="text-2xl">{"Confirmation"}</SheetTitle>
                <SheetDescription className="font-normal">
                    {"Are you sure you want to do this action?"}
                </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col items-center justify-center gap-5 px-5">
                <div className="flex items-center gap-3 w-full">
                    <Button
                        className="grow"
                        onClick={() =>
                            props.onConfirm(() => {
                                ActionSheetRef.current?.isOpen(
                                    "confirmation",
                                    false,
                                );
                            })}
                    >
                        {"Confirm"}
                    </Button>
                    <Button
                        variant={"outline"}
                        className="grow"
                        onClick={() =>
                            ActionSheetRef.current?.isOpen(
                                "confirmation",
                                false,
                            )}
                    >
                        {"Dismiss"}
                    </Button>
                </div>
            </div>
        </div>
    );
};
