import { useState } from "react";
import type { BodyType } from "@/data/bodies";
import { Portrait } from "./Portrait";
import { TYPE_META, type TreeNode } from "./taxonomy";

interface RowProps {
  node: TreeNode;
  depth: number;
  selectedId: string | null;
  /** Roving tabindex: exactly one row in the tree is tabbable at a time. */
  activeId: string | null;
  onSelect: (node: TreeNode) => void;
  onFocusRow: (node: TreeNode) => void;
  expanded: Set<string>;
  toggle: (id: string) => void;
  visible: (n: TreeNode) => boolean;
  typeFilter: Set<BodyType>;
}

export function CatalogBranch({
  node,
  depth,
  selectedId,
  activeId,
  onSelect,
  onFocusRow,
  expanded,
  toggle,
  visible,
  typeFilter,
}: RowProps) {
  if (!visible(node)) return null;
  const meta = TYPE_META[node.type];
  const hasKids = node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const selected = selectedId === node.id;
  const shown = typeFilter.has(node.type);

  return (
    <div role={shown ? "treeitem" : "none"} aria-expanded={shown && hasKids ? isOpen : undefined}>
      {shown && (
        <div className="relative">
          {hasKids && (
            <button
              onClick={() => toggle(node.id)}
              tabIndex={-1}
              aria-hidden
              className="absolute top-1/2 z-10 -translate-y-1/2 text-ink-low transition-colors hover:text-primary"
              style={{ left: 4 + depth * 14 }}
            >
              {isOpen ? "▾" : "▸"}
            </button>
          )}
          <button
            id={`row-${node.id}`}
            data-row-id={node.id}
            tabIndex={activeId === node.id ? 0 : -1}
            aria-current={selected ? "true" : undefined}
            onClick={() => {
              onFocusRow(node);
              onSelect(node);
            }}
            className={`group flex w-full items-center gap-3 rounded-md py-1.5 pr-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background ${
              selected ? "bg-surface-raised" : "hover:bg-surface"
            }`}
            style={{ paddingLeft: 20 + depth * 14 }}
          >
            <span
              className="size-8 shrink-0 overflow-hidden rounded-full ring-1 ring-border"
              aria-hidden
            >
              <Portrait body={node} size={64} />
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] leading-tight">
              <span className={selected ? "text-primary" : "text-foreground"}>{node.name}</span>
            </span>
            <span
              className="shrink-0 text-[11px] leading-none"
              style={{ color: meta.color }}
              title={meta.label}
            >
              {meta.glyph}
            </span>
            <span className="sr-only">{meta.label}</span>
          </button>
        </div>
      )}
      {isOpen && hasKids && (
        <div
          role="group"
          className="border-l border-border/60"
          style={{ marginLeft: 12 + depth * 14 }}
        >
          <div style={{ marginLeft: -(12 + depth * 14) }}>
            {node.children.map((c) => (
              <CatalogBranch
                key={c.id}
                node={c}
                depth={depth + 1}
                selectedId={selectedId}
                activeId={activeId}
                onSelect={onSelect}
                onFocusRow={onFocusRow}
                expanded={expanded}
                toggle={toggle}
                visible={visible}
                typeFilter={typeFilter}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


export function TypeFilter({
  typeFilter,
  setTypeFilter,
  counts,
  order,
}: {
  typeFilter: Set<BodyType>;
  setTypeFilter: (s: Set<BodyType>) => void;
  counts: Record<string, number>;
  order: BodyType[];
}) {
  const [open, setOpen] = useState(false);
  const allOn = typeFilter.size === order.length;

  return (
    <div className="px-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="label-caps flex w-full items-center justify-between py-1 hover:text-primary"
      >
        <span>Types · {allOn ? "all" : `${typeFilter.size} of ${order.length}`}</span>
        <span>{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="flex flex-wrap gap-1 pt-2 pb-1">
          {order.map((t) => {
            const on = typeFilter.has(t);
            return (
              <button
                key={t}
                onClick={() => {
                  const next = new Set(typeFilter);
                  if (on) next.delete(t);
                  else next.add(t);
                  setTypeFilter(next);
                }}
                className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] transition-colors ${
                  on ? "border-border-strong bg-surface-raised" : "border-border text-ink-low"
                }`}
              >
                <span style={{ color: on ? TYPE_META[t].color : undefined }}>
                  {TYPE_META[t].glyph}
                </span>
                {TYPE_META[t].label}
                <span className="font-mono text-ink-low">{counts[t] ?? 0}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
