import React from "react";
import type { ActionSheetRef as TActionSheetRef } from "../components/ActionSheet";

const ConfirmationDialog = React.lazy(() =>
	import("../components/ConfirmationDialog").then((module) => ({
		default: module.ConfirmationDialog,
	})),
);

export type TActionSheetRegistry = typeof ActionSheetRegistry;

export const ActionSheetRegistry = {
	confirmation: ConfirmationDialog
};

export const ActionSheetRef = React.createRef<TActionSheetRef>();
