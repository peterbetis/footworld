"use client";

import { createContext, useContext } from "react";
import { getMessages, type Locale, type Messages } from "@/lib/i18n";

// Messages contain functions, so client components receive the locale and
// look the messages up here rather than having them passed from the server.
const I18nContext = createContext<Messages>(getMessages("en"));

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <I18nContext.Provider value={getMessages(locale)}>{children}</I18nContext.Provider>;
}

export function useT(): Messages {
  return useContext(I18nContext);
}
