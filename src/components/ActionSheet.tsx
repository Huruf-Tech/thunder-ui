import React from "react";
import {
	ActionSheetRegistry,
	type TActionSheetRegistry,
} from "@/Registry/ActionSheet";
import { Sheet, SheetContent } from "@/components/ui/sheet";

type TSheetName = keyof TActionSheetRegistry;
export type ActionSheetRef={
    isOpen:<K extends TSheetName>(
        sheetName:K,
        value: boolean,
        data?: Parameters<TActionSheetRegistry[K]>[number],
    )=>void
}
export const ActionSheet=({ref}:{ref:React.Ref<ActionSheetRef>})=>{
    const [isOpen, setIsOpen] = React.useState(false);
	const [data, setData] = React.useState<
		| {
				sheetName: TSheetName;
				data?: Parameters<TActionSheetRegistry[TSheetName]>[number];
		  }
		| undefined
	>(undefined);

    React.useImperativeHandle(ref, () => ({
		isOpen: (name, value, nextData) => {
			setIsOpen(value);
			setData({ sheetName: name, data: nextData });
		},
	}));

    const Comp = React.useMemo(
		() => (data?.sheetName ? ActionSheetRegistry[data?.sheetName] : undefined),
		[data],
	);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
			<SheetContent
				side="bottom"
				className="max-w-full md:max-w-sm m-3 md:mx-auto rounded-md mb-5"
			>
				{/** biome-ignore lint/suspicious/noExplicitAny: <off> */}
				{Comp ? <Comp {...(data?.data as any)} /> : null}
			</SheetContent>
		</Sheet>
    )
}