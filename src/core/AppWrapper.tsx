import React from "react";
import { AuthProvider } from "@/core/context/AuthProvider";

import { LoadingProvider } from "@/core/context/LoaderProvider";
import { rgbToHex } from "@/core/lib/utils";
import { Capacitor, SystemBars, SystemBarsStyle } from "@capacitor/core";
import { EdgeToEdge } from "@capawesome/capacitor-android-edge-to-edge-support";
import { useCssVar } from "@/core/lib/cssVars";
import { useTheme } from "@/components/theme-provider";

//! These take an already-converted hex value. They used to call `rgbToHex` a
//! second time on the output of the caller's conversion. See B-20.
const setSystemBars = async (
  hexColor: string,
  style: SystemBarsStyle,
) => {
  await SystemBars.setStyle({ style });
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

        await setSystemBars(
          rgbToHex(background),
          resolvedTheme === "dark"
            ? SystemBarsStyle.Dark
            : SystemBarsStyle.Light,
        );
      } catch (error) {
        console.error(error);
      }
    })();

    return () => {
      if (!Capacitor.isNativePlatform()) return;

      void EdgeToEdge.disable();
    };
  }, [background, resolvedTheme]);

  return (
    <LoadingProvider>
      {import.meta.env.VITE_OAUTH_CLIENT_ID
        ? <AuthProvider>{children}</AuthProvider>
        : children}
    </LoadingProvider>
  );
}

export default AppWrapper;
