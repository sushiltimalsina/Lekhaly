import * as React from "react";
import { translateText } from "@lekhaly/ui";
import { getSettings, subscribeSettings, type Language } from "./store/settings";

export function useTranslation() {
  const [language, setLanguage] = React.useState<Language>(() => getSettings().language);

  React.useEffect(() => subscribeSettings((settings) => setLanguage(settings.language)), []);

  return (text: string) => translateText(text, language);
}
