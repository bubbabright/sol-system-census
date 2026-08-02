import type { Body } from "@/data/bodies";
import { Portrait } from "./Portrait";
import { TYPE_META, ancestorsOf, type TreeNode } from "./taxonomy";

function Fact({ label, value }: { label: string; value?: string }) {
  if (!value || value === "—") return null;
  return (
    <div className="min-w-0">
      <div className="label-caps">{label}</div>
      <div className="mt-0.5 truncate font-mono text-[12px] text-foreground" title={value}>
        {value}
      </div>
    </div>
  );
}

export function DetailPanel({
  body,
  byId,
  onSelect,
}: {
  body: TreeNode | null;
  byId: Record<string, TreeNode>;
  onSelect: (b: Body) => void;
}) {
  if (!body) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-border bg-surface/40 p-10 text-center">
        <div>
          <div className="font-display text-5xl text-primary">⊙</div>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Pick an object from the catalog to see its portrait, vitals and lineage.
          </p>
        </div>
      </div>
    );
  }

  const meta = TYPE_META[body.type];
  const chain = ancestorsOf(body, byId);
  const kids = body.children;

  return (
    <article className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-surface/40">
      {/* Hero: the image owns the panel. Name, type and lineage sit on it, so
          nothing is repeated in the body below. */}
      <div className="relative shrink-0 aspect-[16/9] w-full overflow-hidden bg-background md:aspect-[2/1]">
        <Portrait body={body} size={640} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
            {chain.map((b) => (
              <span key={b.id} className="flex items-center gap-2">
                <button
                  onClick={() => onSelect(b)}
                  className="pointer-events-auto text-muted-foreground transition-colors hover:text-primary"
                >
                  {b.name}
                </button>
                <span className="text-ink-low">›</span>
              </span>
            ))}
            {body.parent === "interstellar" && (
              <span className="flex items-center gap-2 text-muted-foreground">
                Interstellar space <span className="text-ink-low">›</span>
              </span>
            )}
            <span style={{ color: meta.color }}>
              {meta.glyph} {meta.label}
            </span>
            {body.status && (
              <span className="rounded-full border border-border-strong px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {body.status}
              </span>
            )}
          </div>
          <h1 className="mt-1 font-display text-4xl leading-none md:text-6xl">{body.name}</h1>
        </div>
      </div>

      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-5 pb-6 md:px-7">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-border py-4 sm:grid-cols-4">
          <Fact label="Mass" value={body.mass} />
          <Fact label="Diameter" value={body.diameter} />
          <Fact label="Orbit" value={body.orbit} />
          <Fact label="Discovered" value={body.discovered} />
        </div>

        <p className="max-w-[68ch] pt-4 text-[15px] leading-relaxed text-foreground/90">
          {body.tldr}
        </p>

        {kids.length > 0 && (
          <div className="pt-6">
            <div className="label-caps">Bound to {body.name} · {kids.length}</div>
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {kids.map((k) => (
                <button
                  key={k.id}
                  onClick={() => onSelect(k)}
                  className="group text-left"
                >
                  <span className="block aspect-square w-full overflow-hidden rounded-lg border border-border transition-colors group-hover:border-border-strong">
                    <Portrait body={k} size={160} />
                  </span>
                  <span className="mt-1.5 block truncate text-[12px] transition-colors group-hover:text-primary">
                    {k.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
