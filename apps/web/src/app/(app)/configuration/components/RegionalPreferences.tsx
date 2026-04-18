"use client";

import * as React from "react";
import { Monitor, ChevronDown, ChevronRight, Ruler, Search, Calculator } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Switch } from "@lekhaly/ui";
import { cn } from "@/lib/utils";
import { useDateFormat } from "@/lib/date-format";
import { getCurrencySettings, setCurrencySymbol, setNumberFormat, subscribeUi } from "@/lib/store/ui";
import { getSettings, setCalendarPreference, setDefaultDateRange, subscribeSettings } from "@/lib/store/settings";
import { MoneyText } from "@/components/app/money";

interface RegionalPreferencesProps {
  expanded: boolean;
  onToggle: () => void;
  printLogo: boolean;
  onPrintLogoChange: (v: boolean) => void;
}

export function RegionalPreferences({
  expanded,
  onToggle,
  printLogo,
  onPrintLogoChange
}: RegionalPreferencesProps) {
  const { dateFormat, setDateFormat } = useDateFormat();
  const [currencySymbol, setCurrencySymbolState] = React.useState(getCurrencySettings().currencySymbol);
  const [numberFormat, setNumberFormatState] = React.useState(getCurrencySettings().numberFormat);
  const [calendarPreference, setCalendarPreferenceState] = React.useState<"BS" | "AD">("BS");
  const [defaultDateRange, setDefaultDateRangeState] = React.useState<string>("this_month");

  React.useEffect(() => {
    const unsubscribe = subscribeUi((next) => {
      setCurrencySymbolState(next.currencySymbol);
      setNumberFormatState(next.numberFormat);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const s = getSettings();
    setCalendarPreferenceState(s.calendarPreference);
    setDefaultDateRangeState(s.defaultDateRange);
    const unsubscribe = subscribeSettings((next) => {
      setCalendarPreferenceState(next.calendarPreference);
      setDefaultDateRangeState(next.defaultDateRange);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Card className={cn("glass-card overflow-hidden lg:col-span-2")}>
      <CardHeader 
        onClick={onToggle}
        className={cn("flex flex-row items-center justify-between cursor-pointer hover:bg-accent/10 transition-colors select-none", expanded ? "pb-2" : "pb-4")}
      >
        <div className="flex items-center gap-3">
           <div className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors">
             {expanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
           </div>
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Monitor className="h-5 w-5 text-blue-600" />
              System & Regional Preferences
            </CardTitle>
            <CardDescription>Setup your business calendar, currency, and date formats</CardDescription>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="animate-in fade-in slide-in-from-top-1 duration-200 lg:p-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Calendar preference */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-blue-500" />
                  Calendar Input
                </h4>
                <p className="text-xs text-muted-foreground mt-1">Default calendar for entry</p>
              </div>
              <div className="flex p-1 bg-muted/40 dark:bg-muted/10 border border-border/50 rounded-2xl w-full">
                {(["BS", "AD"] as const).map(pref => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => setCalendarPreference(pref)}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-200",
                      calendarPreference === pref 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-1 ring-blue-500/50" 
                        : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                    )}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>

            {/* Date display format */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-emerald-500" />
                  Display Format
                </h4>
                <p className="text-xs text-muted-foreground mt-1">How dates appear in lists</p>
              </div>
              <div className="flex p-1 bg-muted/40 dark:bg-muted/10 border border-border/50 rounded-2xl w-full">
                {(["bs", "ad"] as const).map(pref => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => setDateFormat(pref)}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all duration-200",
                      dateFormat === pref 
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 ring-1 ring-emerald-500/50" 
                        : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                    )}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>

            {/* Date range default */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Search className="h-4 w-4 text-orange-500" />
                  Default range
                </h4>
                <p className="text-xs text-muted-foreground mt-1">Initial filter for reports</p>
              </div>
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted/40 dark:bg-muted/10 border border-border/50 rounded-2xl">
                {(["today", "this_week", "this_month", "this_quarter", "this_year"] as const).map(range => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setDefaultDateRange(range)}
                    className={cn(
                      "py-2 px-2 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all duration-200 border",
                      defaultDateRange === range 
                        ? "bg-orange-500 border-orange-400 text-white shadow-md shadow-orange-500/30" 
                        : "bg-transparent border-transparent text-muted-foreground hover:bg-background/50 hover:text-foreground"
                    )}
                  >
                    {range.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Currency settings */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-indigo-500" />
                  Currency & Format
                </h4>
                <p className="text-xs text-muted-foreground mt-1">Formatting and symbol</p>
              </div>
              <div className="space-y-3">
                <div className="flex p-1 bg-muted/40 dark:bg-muted/10 border border-border/50 rounded-2xl w-full">
                  {(["रु.", "NPR", "Rs."] as const).map(symbol => (
                    <button
                      key={symbol}
                      type="button"
                      onClick={() => setCurrencySymbol(symbol)}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-[10px] font-bold transition-all duration-200",
                        currencySymbol === symbol 
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-indigo-500/50" 
                          : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                      )}
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
                <div className="flex p-1 bg-muted/40 dark:bg-muted/10 border border-border/50 rounded-2xl w-full">
                  {(["en-IN", "en-US"] as const).map(format => (
                    <button
                      key={format}
                      type="button"
                      onClick={() => setNumberFormat(format)}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-[10px] font-bold transition-all duration-200",
                        numberFormat === format 
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-indigo-500/50" 
                          : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                      )}
                    >
                      {format === "en-IN" ? "1,23,456" : "123,456"}
                    </button>
                  ))}
                </div>
                <div className="rounded-xl border bg-muted/30 dark:bg-muted/10 px-4 py-2 text-center">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Preview</div>
                  <div className="text-sm font-bold text-indigo-600">
                    <MoneyText value={1234567.89} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border/10">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
              <div className="flex items-center gap-3">
                <Monitor className="h-5 w-5 text-indigo-500" />
                <div className="text-sm font-bold text-foreground">Print Logo on Documents</div>
              </div>
              <Switch 
                checked={printLogo} 
                onCheckedChange={onPrintLogoChange}
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
