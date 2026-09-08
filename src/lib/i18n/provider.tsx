import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { MESSAGES, type Lang, type MessageKey } from "./messages";
import {
  JALALI_MONTHS_EN,
  JALALI_MONTHS_FA,
  WEEKDAYS_EN_LONG,
  WEEKDAYS_EN_SHORT,
  WEEKDAYS_FA_LONG,
  WEEKDAYS_FA_SHORT,
  persianWeekdayIndex,
  toJalali,
  toPersianDigits,
} from "./jalali";

const LANG_KEY = "focus.lang.v1";

export interface I18nValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: MessageKey) => string;
  /** Locale-aware digits (Persian digits in fa). */
  n: (value: string | number) => string;
  /** Jalali in fa, Gregorian in en. */
  formatDate: (date: Date, style?: "long" | "short" | "numeric" | "monthYear") => string;
  formatTime: (ts: number) => string;
  weekdayShort: (date: Date) => string;
  weekdayLong: (date: Date) => string;
  monthName: (date: Date) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function readLang(): Lang {
  if (typeof window === "undefined") return "fa";
  const raw = window.localStorage.getItem(LANG_KEY);
  return raw === "en" || raw === "fa" ? raw : "fa";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fa");

  useEffect(() => {
    setLangState(readLang());
  }, []);

  const dir = lang === "fa" ? "rtl" : "ltr";

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("lang", lang);
    root.setAttribute("dir", dir);
    root.classList.toggle("font-fa", lang === "fa");
  }, [lang, dir]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(LANG_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<I18nValue>(() => {
    const dict = MESSAGES[lang];
    const n = (v: string | number) => (lang === "fa" ? toPersianDigits(v) : String(v));

    const formatDate: I18nValue["formatDate"] = (date, style = "long") => {
      if (lang === "fa") {
        const { jy, jm, jd } = toJalali(date);
        const month = JALALI_MONTHS_FA[jm - 1]!;
        if (style === "numeric") return n(`${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`);
        if (style === "monthYear") return `${month} ${n(jy)}`;
        if (style === "short") return `${n(jd)} ${month}`;
        return `${WEEKDAYS_FA_LONG[persianWeekdayIndex(date)]!}، ${n(jd)} ${month} ${n(jy)}`;
      }
      if (style === "numeric") return date.toLocaleDateString("en-GB");
      if (style === "monthYear")
        return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      if (style === "short") return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    };

    return {
      lang,
      dir,
      setLang,
      toggleLang: () => setLang(lang === "fa" ? "en" : "fa"),
      t: (key) => dict[key] ?? key,
      n,
      formatDate,
      formatTime: (ts) => {
        const d = new Date(ts);
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        return lang === "fa"
          ? n(`${hh}:${mm}`)
          : d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      },
      weekdayShort: (date) =>
        (lang === "fa" ? WEEKDAYS_FA_SHORT : WEEKDAYS_EN_SHORT)[persianWeekdayIndex(date)]!,
      weekdayLong: (date) =>
        (lang === "fa" ? WEEKDAYS_FA_LONG : WEEKDAYS_EN_LONG)[persianWeekdayIndex(date)]!,
      monthName: (date) =>
        lang === "fa"
          ? JALALI_MONTHS_FA[toJalali(date).jm - 1]!
          : date.toLocaleDateString("en-US", { month: "long" }),
    };
  }, [lang, dir, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export { JALALI_MONTHS_EN, JALALI_MONTHS_FA };
export type { Lang, MessageKey };
