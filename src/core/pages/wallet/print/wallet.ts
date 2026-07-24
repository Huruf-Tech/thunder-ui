import i18n from "i18next";

import WalletTemplateSource from "./template/wallet-template.hbs?raw";
import Handlebars from "@/core/lib/handlebars";
import { loadFontsCSS, loadTailwindCSS } from "@/core/lib/utils";

const WalletTemplate = Handlebars.compile(WalletTemplateSource);

export const buildWalletHTML = async (data: {
  title: string;
  content: string;
  lang?: string;
  dir?: string;
}) => {
  const [tailwind, fonts] = await Promise.all([
    loadTailwindCSS(),
    loadFontsCSS(),
  ]);

  const lang = i18n.language || "ar";

  return WalletTemplate({
    lang,
    dir: lang === "en" ? "ltr" : "rtl",
    ...data,
    tailwind,
    fonts,
  });
};
