import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

export const useRegisterPushNotification = () => {
	const isWeb = Capacitor.getPlatform() === "web";

	const registerPushNotification = async () => {
		if (isWeb) return;

		try {
			let permStatus = await PushNotifications.checkPermissions();

			if (permStatus.receive === "prompt") {
				permStatus = await PushNotifications.requestPermissions();
			}

			if (permStatus.receive !== "granted") {
				// You might want to handle this more gracefully than a throw
				console.warn("User denied push permissions");
				return;
			}

			await PushNotifications.register();
			console.log("Push registration successful");
		} catch (error) {
			console.error("Push registration failed", error);
		}
	};

	return { registerPushNotification };
};
