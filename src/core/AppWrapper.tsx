import React from "react";
import { AuthProvider } from "@/core/context/AuthProvider";

import { LoadingProvider } from "@/core/context/LoaderProvider";
import { rgbToHex } from "@/core/lib/utils";
import { Capacitor, SystemBars, SystemBarsStyle } from "@capacitor/core";
import { EdgeToEdge } from "@capawesome/capacitor-android-edge-to-edge-support";
import { useCssVar } from "@/core/lib/cssVars";
import { useTheme } from "@/components/theme-provider";

const setDarkStyle = async (color: string) => {
  const hexColor = rgbToHex(color);
  await SystemBars.setStyle({ style: SystemBarsStyle.Dark });
  await EdgeToEdge.setStatusBarColor({ color: hexColor });
  await EdgeToEdge.setNavigationBarColor({ color: hexColor });
};

const setLightStyle = async (color: string) => {
  const hexColor = rgbToHex(color);
  await SystemBars.setStyle({ style: SystemBarsStyle.Light });
  await EdgeToEdge.setStatusBarColor({ color: hexColor });
  await EdgeToEdge.setNavigationBarColor({ color: hexColor });
};

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const background = useCssVar("--background");

  React.useEffect(() => {
    if (!Capacitor.isNativePlatform() || !background) return;

    void (async () => {
      try {
        await EdgeToEdge.enable();

        const hexColor = rgbToHex(background);

        if (resolvedTheme === "dark") await setDarkStyle(hexColor);
        else await setLightStyle(hexColor);
      } catch (error) {
        console.error(error);
      }
    })();

    return () => {
      if (!Capacitor.isNativePlatform()) return;

      void EdgeToEdge.disable();
    };
  }, [background]);

  return (
    <LoadingProvider>
      {import.meta.env.VITE_OAUTH_CLIENT_ID
        ? <AuthProvider>{children}</AuthProvider>
        : children}
    </LoadingProvider>
  );
}

export default AppWrapper;
