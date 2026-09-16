"use client";

import { useEffect } from "react";

/**
 * Inicializa plugins nativos de Capacitor cuando TalentoLink corre
 * dentro de la app Android / iOS (WebView). En el navegador no hace nada.
 */
export function NativeBridge() {
  useEffect(() => {
    let cancelled = false;
    const cleanups: Array<() => void> = [];

    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform() || cancelled) return;

        document.documentElement.classList.add("tl-native");

        const [{ App }, { StatusBar, Style }, { SplashScreen }, { Keyboard }, { LocalNotifications }] =
          await Promise.all([
            import("@capacitor/app"),
            import("@capacitor/status-bar"),
            import("@capacitor/splash-screen"),
            import("@capacitor/keyboard"),
            import("@capacitor/local-notifications"),
          ]);

        await StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined);
        await StatusBar.setBackgroundColor({ color: "#070b14" }).catch(() => undefined);
        await SplashScreen.hide().catch(() => undefined);
        await Keyboard.setAccessoryBarVisible({ isVisible: true }).catch(() => undefined);
        await LocalNotifications.requestPermissions().catch(() => undefined);

        const back = await App.addListener("backButton", ({ canGoBack }) => {
          const path = window.location.pathname;
          if (canGoBack || (path !== "/admin" && path !== "/admin/login" && window.history.length > 1)) {
            window.history.back();
            return;
          }
          App.exitApp();
        });
        cleanups.push(() => {
          back.remove();
        });
      } catch {
        /* sitio web normal */
      }
    })();

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return null;
}
