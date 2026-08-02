import type { Body, BodyType } from "@/data/bodies";

export const TYPE_META: Record<BodyType, { label: string; glyph: string; color: string }> = {
  star: { label: "Star", glyph: "★", color: "#ffce5a" },
  planet: { label: "Planet", glyph: "●", color: "#7ec8ff" },
  dwarf: { label: "Dwarf planet", glyph: "◐", color: "#c9a87a" },
  moon: { label: "Moon", glyph: "◯", color: "#cfcfd0" },
  asteroid: { label: "Asteroid", glyph: "◆", color: "#b0916a" },
  comet: { label: "Comet", glyph: "☄", color: "#9ec6e0" },
  iso: { label: "Interstellar", glyph: "→", color: "#d57aff" },
  probe: { label: "Spacecraft", glyph: "▣", color: "#7af09a" },
};

export const TYPE_ORDER: BodyType[] = [
  "star",
  "planet",
  "dwarf",
  "moon",
  "asteroid",
  "comet",
  "iso",
  "probe",
];

export interface TreeNode extends Body {
  children: TreeNode[];
}

export function buildTree(bodies: Body[]) {
  const byId: Record<string, TreeNode> = {};
  bodies.forEach((b) => {
    byId[b.id] = { ...b, children: [] };
  });
  const roots: TreeNode[] = [];
  bodies.forEach((b) => {
    const node = byId[b.id];
    if (b.parent && byId[b.parent]) byId[b.parent].children.push(node);
    else if (b.parent !== "interstellar") roots.push(node);
  });
  return { byId, roots };
}

export function ancestorsOf(body: Body, byId: Record<string, TreeNode>): Body[] {
  const chain: Body[] = [];
  let cur: Body | null = body.parent ? byId[body.parent] ?? null : null;
  while (cur) {
    chain.unshift(cur);
    cur = cur.parent && byId[cur.parent] ? byId[cur.parent] : null;
    if (chain.length > 8) break;
  }
  return chain;
}
