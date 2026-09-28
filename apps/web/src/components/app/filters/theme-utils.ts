import { ThemeAccentColor } from "./types";

export function getThemeClasses(accent: ThemeAccentColor = "indigo") {
    switch (accent) {
        case "emerald":
            return {
                badgeBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
                buttonPrimary: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20",
                textAccent: "text-emerald-600 dark:text-emerald-400",
                borderFocus: "focus:border-emerald-500 hover:border-emerald-300",
                iconColor: "text-emerald-500",
                ringFocus: "focus:ring-emerald-500/20",
                activeItem: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold",
                tagBg: "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300",
            };
        case "orange":
            return {
                badgeBg: "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
                buttonPrimary: "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20",
                textAccent: "text-orange-600 dark:text-orange-400",
                borderFocus: "focus:border-orange-500 hover:border-orange-300",
                iconColor: "text-orange-500",
                ringFocus: "focus:ring-orange-500/20",
                activeItem: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 font-bold",
                tagBg: "bg-orange-50 border-orange-100 dark:bg-orange-950/30 dark:border-orange-800/50 text-orange-700 dark:text-orange-300",
            };
        case "sky":
            return {
                badgeBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800",
                buttonPrimary: "bg-sky-600 hover:bg-sky-700 text-white shadow-sky-500/20",
                textAccent: "text-sky-600 dark:text-sky-400",
                borderFocus: "focus:border-sky-500 hover:border-sky-300",
                iconColor: "text-sky-500",
                ringFocus: "focus:ring-sky-500/20",
                activeItem: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 font-bold",
                tagBg: "bg-sky-50 border-sky-100 dark:bg-sky-950/30 dark:border-sky-800/50 text-sky-700 dark:text-sky-300",
            };
        case "violet":
            return {
                badgeBg: "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800",
                buttonPrimary: "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/20",
                textAccent: "text-violet-600 dark:text-violet-400",
                borderFocus: "focus:border-violet-500 hover:border-violet-300",
                iconColor: "text-violet-500",
                ringFocus: "focus:ring-violet-500/20",
                activeItem: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 font-bold",
                tagBg: "bg-violet-50 border-violet-100 dark:bg-violet-950/30 dark:border-violet-800/50 text-violet-700 dark:text-violet-300",
            };
        case "rose":
            return {
                badgeBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
                buttonPrimary: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20",
                textAccent: "text-rose-600 dark:text-rose-400",
                borderFocus: "focus:border-rose-500 hover:border-rose-300",
                iconColor: "text-rose-500",
                ringFocus: "focus:ring-rose-500/20",
                activeItem: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 font-bold",
                tagBg: "bg-rose-50 border-rose-100 dark:bg-rose-950/30 dark:border-rose-800/50 text-rose-700 dark:text-rose-300",
            };
        case "amber":
            return {
                badgeBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
                buttonPrimary: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20",
                textAccent: "text-amber-600 dark:text-amber-400",
                borderFocus: "focus:border-amber-500 hover:border-amber-300",
                iconColor: "text-amber-500",
                ringFocus: "focus:ring-amber-500/20",
                activeItem: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 font-bold",
                tagBg: "bg-amber-50 border-amber-100 dark:bg-amber-950/30 dark:border-amber-800/50 text-amber-700 dark:text-amber-300",
            };
        case "blue":
            return {
                badgeBg: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
                buttonPrimary: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20",
                textAccent: "text-blue-600 dark:text-blue-400",
                borderFocus: "focus:border-blue-500 hover:border-blue-300",
                iconColor: "text-blue-500",
                ringFocus: "focus:ring-blue-500/20",
                activeItem: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 font-bold",
                tagBg: "bg-blue-50 border-blue-100 dark:bg-blue-950/30 dark:border-blue-800/50 text-blue-700 dark:text-blue-300",
            };
        case "slate":
            return {
                badgeBg: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700",
                buttonPrimary: "bg-slate-800 hover:bg-slate-900 text-white shadow-slate-500/20",
                textAccent: "text-slate-800 dark:text-slate-200",
                borderFocus: "focus:border-slate-500 hover:border-slate-400",
                iconColor: "text-slate-500",
                ringFocus: "focus:ring-slate-500/20",
                activeItem: "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 font-bold",
                tagBg: "bg-slate-100 border-slate-200 dark:bg-slate-800/60 dark:border-slate-700 text-slate-800 dark:text-slate-200",
            };
        case "indigo":
        default:
            return {
                badgeBg: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
                buttonPrimary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20",
                textAccent: "text-indigo-600 dark:text-indigo-400",
                borderFocus: "focus:border-indigo-500 hover:border-indigo-300",
                iconColor: "text-indigo-500",
                ringFocus: "focus:ring-indigo-500/20",
                activeItem: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold",
                tagBg: "bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300",
            };
    }
}
