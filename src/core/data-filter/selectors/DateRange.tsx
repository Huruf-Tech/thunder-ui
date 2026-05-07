// import { format } from "date-fns";
// import { Calendar, ChevronDown } from "lucide-react";
// import React from "react";
// import { useTranslation } from "react-i18next";
// import { ComboBox } from "@/components/ComboBox";
// import { Button } from "@/components/ui/button";
// import { Group } from "@/components/ui/group";
// import { Label } from "@/components/ui/label";
// import { ActionSheetRef } from "@/Registry/ActionSheet";
// import { ERangeOperator, TDateColumnConfig } from "..";
// import { useDataFilter } from "../DataFilter";

// export const CalendarRangeComp: React.FC<TDateColumnConfig> = (props) => {
// 	const { id, type, displayName, enableOperator } = props;
// 	const { t } = useTranslation();

// 	const { state, setState } = useDataFilter<TDateColumnConfig>();

// 	const operator =
// 		(state[id]?.operator as unknown as ERangeOperator) ??
// 		ERangeOperator.BETWEEN;
// 	const currentValue = state[id]?.value ?? [];

// 	const changeHandler = (state: {
// 		value: Date[];
// 		operator: ERangeOperator;
// 	}) => {
// 		setState((prev) => ({ ...prev, [id]: { type, ...state } }));
// 	};

// 	const selectedOperator = React.useMemo(
// 		() =>
// 			Object.entries(ERangeOperator).find(
// 				([_, value]) => value === operator,
// 			)?.[0],
// 		[operator],
// 	);

// 	return (
// 		<div
// 			className="flex flex-col gap-2 w-full transition-all ease-in-out duration-300"
// 			id={id}
// 		>
// 			<Label className="text-sm">{displayName}</Label>

// 			<Group orientation={"vertical"} className="w-full">
// 				<Button
// 					variant={"outline"}
// 					className="justify-between w-full"
// 					onClick={() =>
// 						ActionSheetRef.current?.trigger("wheelCalendar", true, {
// 							values: currentValue,
// 							onSubmit: (values) => changeHandler({ value: values, operator }),
// 							type: "range",
// 						})
// 					}
// 				>
// 					<p className="truncate">
// 						{currentValue?.length ? (
// 							currentValue.map((v) => format(v, "PPP")).join(" - ")
// 						) : (
// 							<span className="text-muted-foreground">
// 								{t("Choose date range")}
// 							</span>
// 						)}
// 					</p>

// 					<Calendar />
// 				</Button>

// 				{currentValue?.length > 0 && enableOperator ? (
// 					<ComboBox
// 						align="end"
// 						menuItems={Object.entries(ERangeOperator).map(([label, value]) => ({
// 							label,
// 							value,
// 						}))}
// 						searchable={false}
// 						value={operator}
// 						onChange={(val) =>
// 							changeHandler({
// 								value: currentValue,
// 								operator: val as ERangeOperator,
// 							})
// 						}
// 					>
// 						{() => (
// 							<Button
// 								variant={"outline"}
// 								className="justify-between capitalize group"
// 							>
// 								<span className="text-xs">{selectedOperator}</span>
// 								<ChevronDown className="group-aria-expanded:rotate-180 transition-transform ease-in-out duration-300" />
// 							</Button>
// 						)}
// 					</ComboBox>
// 				) : null}
// 			</Group>
// 		</div>
// 	);
// };
