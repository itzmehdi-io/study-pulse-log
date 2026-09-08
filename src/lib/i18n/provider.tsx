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
  /** Locale-aware compact duration, e.g. "1h 42m" / "۱س ۴۲د". */
  formatDur: (ms: number, opts?: { showSeconds?: boolean }) => string;
  /** Locale-aware goal label from minutes. */
  goalText: (minutes: number) => string;
  /** 6 (Saturday) in fa, 1 (Monday) in en. */
  weekStartsOn: number;
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

  const value = useMemo<I18nValue>(() => createI18nValue(lang, setLang), [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function createI18nValue(lang: Lang, setLang: (next: Lang) => void): I18nValue {
  {
    const dir: "rtl" | "ltr" = lang === "fa" ? "rtl" : "ltr";
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
      formatDur: (ms, opts) => {
        const total = Math.max(0, Math.floor(ms / 1000));
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        const sec = total % 60;
        const u = lang === "fa" ? { h: "س", m: "د", s: "ث" } : { h: "h", m: "m", s: "s" };
        if (h > 0) return n(`${h}${u.h} ${String(m).padStart(2, "0")}${u.m}`);
        if (m > 0)
          return n(
            opts?.showSeconds ? `${m}${u.m} ${String(sec).padStart(2, "0")}${u.s}` : `${m}${u.m}`,
          );
        return n(`${sec}${u.s}`);
      },
      goalText: (minutes) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        const u = lang === "fa" ? { h: "س", m: "د" } : { h: "h", m: "m" };
        if (h && m) return n(`${h}${u.h} ${m}${u.m}`);
        if (h) return n(`${h}${u.h}`);
        return n(`${m}${u.m}`);
      },
      weekStartsOn: lang === "fa" ? 6 : 1,
      monthName: (date) =>
        lang === "fa"
          ? JALALI_MONTHS_FA[toJalali(date).jm - 1]!
          : date.toLocaleDateString("en-US", { month: "long" }),
    };
  }
}

const FALLBACK_I18N = createI18nValue("fa", () => {});

export function useI18n(): I18nValue {
  return useContext(I18nContext) ?? FALLBACK_I18N;
}

export { JALALI_MONTHS_EN, JALALI_MONTHS_FA };
export type { Lang, MessageKey };
