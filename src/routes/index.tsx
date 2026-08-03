import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BODIES, type Body, type BodyType } from "@/data/bodies";
import { CatalogBranch, TypeFilter } from "@/components/census/Catalog";
import { DetailPanel } from "@/components/census/DetailPanel";
import {
  TYPE_ORDER,
  buildTree,
  flattenVisible,
  type TreeNode,
} from "@/components/census/taxonomy";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sol System Census — 184 bodies of the Solar System" },
      {
        name: "description",
        content:
          "A browsable census of the Solar System: planets, moons, dwarf planets, asteroids, comets, interstellar visitors and spacecraft, with portraits and vital statistics.",
      },
      { property: "og:title", content: "Sol System Census — 184 bodies of the Solar System" },
      {
        property: "og:description",
        content:
          "A browsable census of the Solar System: planets, moons, dwarf planets, asteroids, comets, interstellar visitors and spacecraft, with portraits and vital statistics.",
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

  // Keyboard navigation: roving tabindex over the flattened, currently visible rows.
  const [activeId, setActiveId] = useState<string | null>("earth");
  const navRef = useRef<HTMLElement | null>(null);
  const focusPending = useRef(false);

  const rows = useMemo(
    () =>
      flattenVisible([...roots, ...interstellar], { expanded, visible, typeFilter }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roots, interstellar, expanded, typeFilter, matchSet],
  );

  useEffect(() => {
    if (!focusPending.current || !activeId) return;
    focusPending.current = false;
    const el = navRef.current?.querySelector<HTMLElement>(`[data-row-id="${activeId}"]`);
    el?.focus();
    el?.scrollIntoView({ block: "nearest" });
  }, [activeId, rows]);

  const select = useCallback(
    (b: Body) => {
      setSelectedId(b.id);
      setActiveId(b.id);
      setExpanded((prev) => {
        const next = new Set(prev);
        let cur: Body | undefined = b;
        while (cur?.parent && byId[cur.parent]) {
          next.add(cur.parent);
          cur = byId[cur.parent];
        }
        return next;
      });
    },
    [byId],
  );

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /** Move focus (and the detail panel) to the row at `index`. */
  const moveTo = (index: number) => {
    const row = rows[Math.max(0, Math.min(rows.length - 1, index))];
    if (!row) return;
    focusPending.current = true;
    setActiveId(row.node.id);
    setSelectedId(row.node.id);
  };

  const effectiveActiveId =
    activeId && rows.some((r) => r.node.id === activeId) ? activeId : rows[0]?.node.id ?? null;

  const onTreeKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    const i = rows.findIndex((r) => r.node.id === effectiveActiveId);
    const row = i >= 0 ? rows[i] : undefined;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveTo(i < 0 ? 0 : i + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveTo(i < 0 ? 0 : i - 1);
        break;
      case "Home":
        e.preventDefault();
        moveTo(0);
        break;
      case "End":
        e.preventDefault();
        moveTo(rows.length - 1);
        break;
      case "ArrowRight":
        if (!row) return;
        e.preventDefault();
        if (row.hasKids && !row.expanded) toggle(row.node.id);
        else if (row.hasKids) moveTo(i + 1);
        break;
      case "ArrowLeft": {
        if (!row) return;
        e.preventDefault();
        if (row.hasKids && row.expanded) {
          toggle(row.node.id);
        } else if (row.parentId) {
          const p = rows.findIndex((r) => r.node.id === row.parentId);
          if (p >= 0) moveTo(p);
        }
        break;
      }
      case "Enter":
      case " ": {
        if (!row) return;
        e.preventDefault();
        select(row.node);
        break;
      }
      default:
        break;
    }
  };


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
        <nav
          ref={navRef}
          aria-label="Catalog of Solar System bodies"
          className="scroll-slim hidden min-h-0 flex-col overflow-y-auto pr-1 lg:flex"
        >
          <TypeFilter
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            counts={counts}
            order={TYPE_ORDER}
          />
          <div
            role="tree"
            aria-label="Bodies by gravitational binding"
            onKeyDown={onTreeKeyDown}
            className="pt-2"
          >
            {roots.map((n) => (
              <CatalogBranch
                key={n.id}
                node={n}
                depth={0}
                selectedId={selectedId}
                activeId={effectiveActiveId}
                onSelect={select}
                onFocusRow={(node) => setActiveId(node.id)}
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
                    activeId={effectiveActiveId}
                    onSelect={select}
                    onFocusRow={(node) => setActiveId(node.id)}
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
