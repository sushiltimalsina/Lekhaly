import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { Input } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import { createUnit, deleteUnit, listUnits, type UnitRecord } from "@/lib/api/units";
import { createItemGroup, deleteItemGroup, listItemGroups, type ItemGroupRecord } from "@/lib/api/item-groups";
import { Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function ConfigurationPage() {
  const [searchParams] = useSearchParams();
  const focus = searchParams.get("focus");
  const unitsRef = React.useRef<HTMLDivElement | null>(null);
  const groupsRef = React.useRef<HTMLDivElement | null>(null);
  const [units, setUnits] = React.useState<UnitRecord[]>([]);
  const [groups, setGroups] = React.useState<ItemGroupRecord[]>([]);
  const [unitInput, setUnitInput] = React.useState("");
  const [groupInput, setGroupInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    const normalizeList = <T,>(input: unknown): T[] => {
      if (Array.isArray(input)) return input as T[];
      const obj = input as { items?: T[]; data?: T[] } | null;
      return obj?.items ?? obj?.data ?? [];
    };
    Promise.all([listUnits({ take: 200 }), listItemGroups({ take: 200 })])
      .then(([uRes, gRes]) => {
        if (!alive) return;
        const uData = normalizeList<UnitRecord>(uRes);
        const gData = normalizeList<ItemGroupRecord>(gRes);
        setUnits(uData);
        setGroups(gData);
      })
      .catch((e: any) => {
        if (!alive) return;
        setError(e?.message ?? "Failed to load configuration data.");
      });
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    if (focus === "units") {
      unitsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (focus === "groups") {
      groupsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [focus]);

  const addUnit = async () => {
    const name = unitInput.trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    try {
      const created = await createUnit({ name });
      setUnits((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setUnitInput("");
    } catch (e: any) {
      setError(e?.message ?? "Failed to add unit.");
    } finally {
      setBusy(false);
    }
  };

  const addGroup = async () => {
    const name = groupInput.trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    try {
      const created = await createItemGroup({ name });
      setGroups((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setGroupInput("");
    } catch (e: any) {
      setError(e?.message ?? "Failed to add group.");
    } finally {
      setBusy(false);
    }
  };

  const removeGroup = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      await deleteItemGroup(id);
      setGroups((prev) => prev.filter((g) => g.id !== id));
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete group.");
    } finally {
      setBusy(false);
    }
  };

  const removeUnit = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      await deleteUnit(id);
      setUnits((prev) => prev.filter((u) => u.id !== id));
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete unit.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuration"
        description="Manage item units and groups used across the system."
      />

      {error ? (
        <div className="rounded-xl border border-red-600/30 bg-red-600/10 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          ref={unitsRef}
          className={cn(
            "rounded-xl border bg-card p-6 shadow-sm space-y-4",
            focus === "units" && "ring-2 ring-primary/40"
          )}
        >
          <div className="text-sm font-semibold">Units</div>
          <div className="flex items-center gap-2">
            <Input value={unitInput} onChange={(e) => setUnitInput(e.target.value)} placeholder="Add new unit" />
            <Button onClick={addUnit} disabled={busy || !unitInput.trim()}>
              Add
            </Button>
          </div>
          <div className="grid gap-2">
            {units.length ? (
              units.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span>{u.name}</span>
                  <button
                    type="button"
                    onClick={() => removeUnit(u.id)}
                    disabled={busy}
                    className="rounded-md border px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No units added yet.</div>
            )}
          </div>
        </section>

        <section
          ref={groupsRef}
          className={cn(
            "rounded-xl border bg-card p-6 shadow-sm space-y-4",
            focus === "groups" && "ring-2 ring-primary/40"
          )}
        >
          <div className="text-sm font-semibold">Groups</div>
          <div className="flex items-center gap-2">
            <Input value={groupInput} onChange={(e) => setGroupInput(e.target.value)} placeholder="Add new group" />
            <Button onClick={addGroup} disabled={busy || !groupInput.trim()}>
              Add
            </Button>
          </div>
          <div className="grid gap-2">
            {groups.length ? (
              groups.map((g) => (
                <div key={g.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span>{g.name}</span>
                  <button
                    type="button"
                    onClick={() => removeGroup(g.id)}
                    disabled={busy}
                    className="rounded-md border px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No groups added yet.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
