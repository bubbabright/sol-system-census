import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BODIES, type Body, type BodyType } from "@/data/bodies";
import { CatalogBranch, TypeFilter } from "@/components/census/Catalog";
import { DetailPanel } from "@/components/census/DetailPanel";
import { TYPE_ORDER, buildTree, type TreeNode } from "@/components/census/taxonomy";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sol System Census — 184 bodies of the Solar System" },
      {
        name: "description",
        content:
          "A browsable census of the Solar System: planets, moons, dwarf planets, asteroids, comets, interstellar visitors and spacecraft, with portraits and vital statistics.",
      },
      { property: "og:title", content: "Sol System Census" },
      {
        property: "og:description",
        content:
          "Browse 184 Solar System bodies by gravitational binding, with portraits, vitals and lineage.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Census,
});

function Census() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<Set<BodyType>>(new Set(TYPE_ORDER));
  const [selectedId, setSelectedId] = useState<string | null>("earth");
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(["sun", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"]),
  );

  const { byId, roots } = useMemo(() => buildTree(BODIES), []);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    BODIES.forEach((b) => (c[b.type] = (c[b.type] ?? 0) + 1));
    return c;
  }, []);

  const matchSet = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    const set = new Set<string>();
    BODIES.filter(
      (b) => b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q),
    ).forEach((b) => {
      set.add(b.id);
      let cur: Body | undefined = b;
      while (cur?.parent && byId[cur.parent]) {
        set.add(cur.parent);
        cur = byId[cur.parent];
      }
    });
    return set;
  }, [search, byId]);

  const visible = (n: TreeNode): boolean =>
    !matchSet || matchSet.has(n.id) || n.children.some(visible);

  const interstellar = useMemo(
    () => BODIES.filter((b) => b.parent === "interstellar").map((b) => byId[b.id]!),
    [byId],
  );

  const selected = selectedId ? byId[selectedId] ?? null : null;

  const select = (b: Body) => {
    setSelectedId(b.id);
    setExpanded((prev) => {
      const next = new Set(prev);
      let cur: Body | undefined = b;
      while (cur?.parent && byId[cur.parent]) {
        next.add(cur.parent);
        cur = byId[cur.parent];
      }
      return next;
    });
  };

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="mx-auto flex h-screen max-w-[1800px] flex-col px-4 lg:px-6">
      <header className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border py-3 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-baseline gap-3">
          <h1 className="truncate font-display text-2xl leading-none">Sol System Census</h1>
          <span className="label-caps hidden sm:inline">{BODIES.length} bodies</span>
        </div>
        <div className="relative w-full max-w-xs">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Europa, Voyager, Halley…"
            className="w-full rounded-full border border-border bg-surface px-4 py-1.5 text-[13px] outline-none placeholder:text-ink-low focus:border-border-strong"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-low hover:text-foreground"
            >
              ×
            </button>
          )}
        </div>
      </header>

      <main className="grid min-h-0 flex-1 gap-5 py-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Catalog: names + type glyph only. Vitals live in the detail panel. */}
        <nav className="scroll-slim hidden min-h-0 flex-col overflow-y-auto pr-1 lg:flex">
          <TypeFilter
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            counts={counts}
            order={TYPE_ORDER}
          />
          <div className="pt-2">
            {roots.map((n) => (
              <CatalogBranch
                key={n.id}
                node={n}
                depth={0}
                selectedId={selectedId}
                onSelect={select}
                expanded={expanded}
                toggle={toggle}
                visible={visible}
                typeFilter={typeFilter}
              />
            ))}
            {interstellar.length > 0 && (
              <div className="mt-4 border-t border-border pt-3">
                <div className="label-caps px-1 pb-1">Interstellar space</div>
                {interstellar.map((n) => (
                  <CatalogBranch
                    key={n.id}
                    node={n}
                    depth={0}
                    selectedId={selectedId}
                    onSelect={select}
                    expanded={expanded}
                    toggle={toggle}
                    visible={visible}
                    typeFilter={typeFilter}
                  />
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="min-h-0">
          <DetailPanel body={selected} byId={byId} onSelect={select} />
        </div>
      </main>
    </div>
  );
}
