const { useState, useMemo, useEffect, useRef } = React;

// -- Type metadata
const TYPE_META = {
  star:     { label: "Star",                glyph: "★", color: "#ffce5a" },
  planet:   { label: "Planet",              glyph: "●", color: "#7ec8ff" },
  dwarf:    { label: "Dwarf planet",        glyph: "◐", color: "#c9a87a" },
  moon:     { label: "Moon",                glyph: "◯", color: "#cfcfd0" },
  asteroid: { label: "Asteroid",            glyph: "◆", color: "#b0916a" },
  comet:    { label: "Comet",               glyph: "☄", color: "#9ec6e0" },
  iso:      { label: "Interstellar",        glyph: "→", color: "#d57aff" },
  probe:    { label: "Spacecraft",          glyph: "▣", color: "#7af09a" },
};

const TYPE_ORDER = ["star","planet","dwarf","moon","asteroid","comet","iso","probe"];

// Approximate parse to sortable mass (kg).
function parseMass(s) {
  if (!s || /unknown/i.test(s)) return NaN;
  const m = s.match(/([\d.,]+)\s*[×x]\s*10[\^]?([⁰¹²³⁴⁵⁶⁷⁸⁹\-\d]+)/);
  if (m) {
    const base = parseFloat(m[1].replace(/,/g, ""));
    const sup = m[2].replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, c => "0123456789"["⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c)]);
    return base * Math.pow(10, parseInt(sup, 10));
  }
  const k = s.match(/([\d.,]+)\s*kg/);
  if (k) return parseFloat(k[1].replace(/,/g, ""));
  return NaN;
}
function parseDiameter(s) {
  if (!s || /unknown|—/.test(s)) return NaN;
  const m = s.match(/([\d.,]+)\s*km/);
  if (m) return parseFloat(m[1].replace(/,/g, ""));
  const mm = s.match(/([\d.,]+)\s*m/);
  if (mm) return parseFloat(mm[1].replace(/,/g, "")) / 1000;
  return NaN;
}

// Build tree from flat list
function buildTree(bodies) {
  const byId = {};
  bodies.forEach(b => byId[b.id] = { ...b, children: [] });
  const roots = [];
  bodies.forEach(b => {
    if (b.parent && byId[b.parent]) {
      byId[b.parent].children.push(byId[b.id]);
    } else {
      // No parent in dataset = root (sun, interstellar bucket virtual node)
      roots.push(byId[b.id]);
    }
  });
  return { byId, roots };
}

// Get all descendant ids of a node
function descendantIds(node, acc=[]) {
  acc.push(node.id);
  node.children.forEach(c => descendantIds(c, acc));
  return acc;
}

// =====================  HEADER + CONTROLS  =====================

function Controls({ search, setSearch, groupBy, setGroupBy, sortBy, setSortBy, typeFilter, setTypeFilter, counts }) {
  return (
    <div className="controls">
      <div className="searchwrap">
        <svg width="14" height="14" viewBox="0 0 14 14" className="searchicon"><circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.4"/><line x1="9.2" y1="9.2" x2="13" y2="13" stroke="currentColor" strokeWidth="1.4"/></svg>
        <input
          className="search"
          placeholder="Search bodies, e.g. Europa, Voyager, Halley…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <button className="clearbtn" onClick={() => setSearch("")}>×</button>}
      </div>

      <div className="ctlgroup">
        <label>Group</label>
        <div className="segmented">
          <button className={groupBy==="binding"?"on":""} onClick={()=>setGroupBy("binding")}>Gravitational binding</button>
          <button className={groupBy==="type"?"on":""} onClick={()=>setGroupBy("type")}>Type</button>
          <button className={groupBy==="none"?"on":""} onClick={()=>setGroupBy("none")}>Flat list</button>
        </div>
      </div>

      <div className="ctlgroup">
        <label>Sort</label>
        <div className="segmented">
          <button className={sortBy==="default"?"on":""} onClick={()=>setSortBy("default")}>Default</button>
          <button className={sortBy==="name"?"on":""} onClick={()=>setSortBy("name")}>A→Z</button>
          <button className={sortBy==="mass"?"on":""} onClick={()=>setSortBy("mass")}>Mass</button>
          <button className={sortBy==="diameter"?"on":""} onClick={()=>setSortBy("diameter")}>Diameter</button>
          <button className={sortBy==="discovered"?"on":""} onClick={()=>setSortBy("discovered")}>Discovered</button>
        </div>
      </div>

      <div className="ctlgroup typefilter">
        <label>Filter</label>
        <div className="chips">
          {TYPE_ORDER.map(t => (
            <button
              key={t}
              className={"chip " + (typeFilter.has(t) ? "on" : "")}
              style={typeFilter.has(t) ? { borderColor: TYPE_META[t].color, color: TYPE_META[t].color } : {}}
              onClick={() => {
                const next = new Set(typeFilter);
                if (next.has(t)) next.delete(t); else next.add(t);
                setTypeFilter(next);
              }}
            >
              <span className="glyph" style={{ color: TYPE_META[t].color }}>{TYPE_META[t].glyph}</span>
              {TYPE_META[t].label}
              <span className="count">{counts[t] || 0}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// =====================  ROWS  =====================

function BodyRow({ body, depth, selected, onSelect, isMatch }) {
  const meta = TYPE_META[body.type];
  return (
    <button
      className={"row " + (selected ? "selected " : "") + (isMatch === false ? "dim " : "")}
      style={{ paddingLeft: 16 + depth * 22 }}
      onClick={() => onSelect(body)}
    >
      <span className="rowtree" style={{ width: depth * 22 }}>
        {depth > 0 && <span className="tee">└</span>}
      </span>
      <span className="thumb">
        <Portrait body={body} size={120} />
      </span>
      <span className="rowmain">
        <span className="rowname">{body.name}</span>
        <span className="rowmeta">
          <span className="typetag" style={{ color: meta.color }}>{meta.glyph} {meta.label}</span>
          <span className="dot">·</span>
          <span className="diam">{body.diameter}</span>
          {body.orbit && body.orbit !== "—" && <>
            <span className="dot">·</span>
            <span className="orb">{body.orbit}</span>
          </>}
        </span>
      </span>
      {body.status && <span className={"status status-" + body.status}>{body.status}</span>}
      <span className="rowid">{body.id.toUpperCase()}</span>
    </button>
  );
}

// Tree branch (binding view)
function TreeBranch({ node, depth, selected, onSelect, matchSet, expanded, toggle }) {
  const isExpanded = expanded.has(node.id);
  const hasKids = node.children && node.children.length > 0;
  const isMatch = !matchSet || matchSet.has(node.id);

  return (
    <div className="branch">
      <div className="rowwrap">
        {hasKids && (
          <button
            className="expander"
            style={{ left: 6 + depth * 22 }}
            onClick={(e) => { e.stopPropagation(); toggle(node.id); }}
            aria-label={isExpanded ? "collapse" : "expand"}
          >{isExpanded ? "▾" : "▸"}</button>
        )}
        <BodyRow body={node} depth={depth} selected={selected === node.id} onSelect={onSelect} isMatch={isMatch}/>
      </div>
      {isExpanded && hasKids && (
        <div className="children">
          {node.children.map(c => (
            <TreeBranch key={c.id} node={c} depth={depth + 1} selected={selected} onSelect={onSelect} matchSet={matchSet} expanded={expanded} toggle={toggle}/>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================  DETAIL PANEL  =====================

function ParentChain({ body, byId, onSelect }) {
  // Walk parents to root
  const chain = [];
  let cur = body;
  while (cur) {
    chain.unshift(cur);
    cur = cur.parent && byId[cur.parent] ? byId[cur.parent] : null;
    if (chain.length > 8) break;
  }
  return (
    <div className="chain">
      {chain.map((b, i) => (
        <React.Fragment key={b.id}>
          {i > 0 && <span className="chainarrow">›</span>}
          {b.id === body.id ? (
            <span className="chainself">{b.name}</span>
          ) : (
            <button className="chainlink" onClick={() => onSelect(b)}>{b.name}</button>
          )}
        </React.Fragment>
      ))}
      {body.parent === "interstellar" && (
        <>
          <span className="chainarrow">›</span>
          <span className="chainself">{body.name}</span>
        </>
      )}
    </div>
  );
}

function DetailPanel({ body, byId, onSelect, onClose }) {
  if (!body) {
    return (
      <aside className="detail empty">
        <div className="emptyinner">
          <div className="emptyglyph">⊙</div>
          <h3>Select a body</h3>
          <p>Click any object in the catalog to see its TL;DR, vital statistics, and gravitational lineage.</p>
        </div>
      </aside>
    );
  }
  const meta = TYPE_META[body.type];
  const kids = Object.values(byId).filter(b => b.parent === body.id);

  return (
    <aside className="detail">
      <div className="detailtop">
        <button className="closebtn" onClick={onClose} aria-label="close">×</button>
      </div>
      <div className="hero">
        <Portrait body={body} size={400}/>
      </div>
      <div className="detailbody">
        <div className="typeline" style={{ color: meta.color }}>
          <span className="glyph">{meta.glyph}</span>
          {meta.label.toUpperCase()}
          {body.status && <span className={"status status-" + body.status}>{body.status}</span>}
        </div>
        <h1>{body.name}</h1>
        {body.parent && byId[body.parent] && (
          <div className="boundto">
            Bound to <button className="boundlink" onClick={() => onSelect(byId[body.parent])}>{byId[body.parent].name}</button>
          </div>
        )}
        {body.parent === "interstellar" && (
          <div className="boundto interstellar">Unbound · in interstellar space</div>
        )}
        <ParentChain body={body} byId={byId} onSelect={onSelect}/>

        <p className="tldr">{body.tldr}</p>

        <dl className="stats">
          <div><dt>Mass</dt><dd>{body.mass}</dd></div>
          <div><dt>Diameter</dt><dd>{body.diameter}</dd></div>
          <div><dt>Orbit</dt><dd>{body.orbit}</dd></div>
          <div><dt>Discovered</dt><dd>{body.discovered}</dd></div>
        </dl>

        {kids.length > 0 && (
          <div className="satellites">
            <h4>Bound to {body.name} <span className="cnt">({kids.length})</span></h4>
            <div className="satgrid">
              {kids.map(k => (
                <button key={k.id} className="satcard" onClick={() => onSelect(k)}>
                  <span className="satthumb"><Portrait body={k} size={64}/></span>
                  <span className="satname">{k.name}</span>
                  <span className="sattype" style={{ color: TYPE_META[k.type].color }}>{TYPE_META[k.type].label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

// =====================  MAIN APP  =====================

function App() {
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState("binding");
  const [sortBy, setSortBy] = useState("default");
  const [typeFilter, setTypeFilter] = useState(new Set(TYPE_ORDER));
  const [selectedId, setSelectedId] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set(["sun","earth","mars","jupiter","saturn","uranus","neptune","pluto","interstellar"]));

  const { byId, roots } = useMemo(() => buildTree(window.BODIES), []);

  // Counts per type
  const counts = useMemo(() => {
    const c = {};
    window.BODIES.forEach(b => c[b.type] = (c[b.type] || 0) + 1);
    return c;
  }, []);

  // Match set against search
  const matchSet = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    const direct = window.BODIES.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      (b.tldr || "").toLowerCase().includes(q)
    );
    // Expand to include ancestor chain so matches stay visible in tree
    const set = new Set();
    direct.forEach(b => {
      set.add(b.id);
      let cur = b;
      while (cur.parent && byId[cur.parent]) {
        set.add(cur.parent);
        cur = byId[cur.parent];
      }
    });
    return set;
  }, [search, byId]);

  // Auto-expand search results
  useEffect(() => {
    if (matchSet) {
      setExpanded(prev => new Set([...prev, ...matchSet]));
    }
  }, [matchSet]);

  function selectBody(b) {
    setSelectedId(b.id);
    // expand ancestors
    setExpanded(prev => {
      const next = new Set(prev);
      let cur = b;
      while (cur.parent && byId[cur.parent]) {
        next.add(cur.parent);
        cur = byId[cur.parent];
      }
      return next;
    });
  }

  function toggleExpand(id) {
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  // Sort comparator
  const cmp = useMemo(() => {
    switch (sortBy) {
      case "name": return (a, b) => a.name.localeCompare(b.name);
      case "mass": return (a, b) => (parseMass(b.mass) || 0) - (parseMass(a.mass) || 0);
      case "diameter": return (a, b) => (parseDiameter(b.diameter) || 0) - (parseDiameter(a.diameter) || 0);
      case "discovered": {
        const yr = b => {
          const m = (b.discovered || "").match(/\d{4}/);
          return m ? parseInt(m[0]) : -10000;
        };
        return (a, b) => yr(a) - yr(b);
      }
      default: return null;
    }
  }, [sortBy]);

  // Apply sort recursively to tree
  function sortNode(node) {
    if (!node.children || node.children.length === 0) return node;
    const sortedKids = [...node.children];
    if (cmp) sortedKids.sort(cmp);
    return { ...node, children: sortedKids.map(sortNode) };
  }

  const sortedRoots = useMemo(() => {
    if (!cmp) return roots;
    return [...roots].sort(cmp).map(sortNode);
  }, [roots, cmp]);

  // Filter helper — does node or any descendant pass type filter + search?
  function visibleFilter(node) {
    const passesType = typeFilter.has(node.type);
    const passesSearch = !matchSet || matchSet.has(node.id);
    if (passesType && passesSearch) return true;
    // recurse — keep if any kid is visible
    return node.children.some(c => visibleFilter(c));
  }

  function pruneTree(node) {
    const kids = node.children.filter(visibleFilter).map(pruneTree);
    return { ...node, children: kids };
  }

  const treeRoots = useMemo(() => {
    return sortedRoots.filter(visibleFilter).map(pruneTree);
  }, [sortedRoots, typeFilter, matchSet]);

  // For "interstellar" bodies (parent === "interstellar"), display under a virtual node
  const interstellarNode = useMemo(() => {
    const items = window.BODIES.filter(b => b.parent === "interstellar");
    return {
      id: "interstellar",
      virtual: true,
      name: "Interstellar Space",
      type: "iso",
      tldr: "Objects no longer gravitationally bound to the Sun — either escaped (Voyagers, Pioneers) or just passing through (ʻOumuamua, 2I/Borisov).",
      diameter: "—", mass: "—", orbit: "—", discovered: "—",
      color: ["#000","#222","#000"],
      children: cmp ? [...items].sort(cmp) : items
    };
  }, [cmp]);

  // Flat list & type grouping
  const flatVisible = useMemo(() => {
    let arr = window.BODIES.filter(b =>
      typeFilter.has(b.type) && (!matchSet || matchSet.has(b.id))
    );
    if (cmp) arr = [...arr].sort(cmp);
    return arr;
  }, [typeFilter, matchSet, cmp]);

  const selected = selectedId ? byId[selectedId] : null;

  // Esc closes panel
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") setSelectedId(null); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brandmark">
            <svg viewBox="0 0 32 32" width="28" height="28">
              <circle cx="16" cy="16" r="3.5" fill="#ffce5a"/>
              <ellipse cx="16" cy="16" rx="10" ry="10" fill="none" stroke="#5a8cc8" strokeWidth="0.8"/>
              <ellipse cx="16" cy="16" rx="14" ry="14" fill="none" stroke="#c87a5a" strokeWidth="0.8"/>
              <circle cx="26" cy="16" r="1.4" fill="#7ec8ff"/>
              <circle cx="16" cy="6" r="1" fill="#c87a5a"/>
            </svg>
          </div>
          <div className="brandtext">
            <h1>Sol System Census</h1>
            <div className="sub">A catalog of every named body — bound, orbiting, escaped</div>
          </div>
        </div>
        <div className="totals">
          <div><span className="num">{window.BODIES.length}</span><span className="lbl">bodies cataloged</span></div>
        </div>
      </header>

      <Controls
        search={search} setSearch={setSearch}
        groupBy={groupBy} setGroupBy={setGroupBy}
        sortBy={sortBy} setSortBy={setSortBy}
        typeFilter={typeFilter} setTypeFilter={setTypeFilter}
        counts={counts}
      />

      <main className="layout">
        <section className="catalog">
          {groupBy === "binding" && (
            <>
              {treeRoots.map(root => (
                <TreeBranch key={root.id} node={root} depth={0} selected={selectedId} onSelect={selectBody} matchSet={matchSet} expanded={expanded} toggle={toggleExpand}/>
              ))}
              {/* Interstellar bucket */}
              {(() => {
                const visibleKids = interstellarNode.children.filter(c => typeFilter.has(c.type) && (!matchSet || matchSet.has(c.id))).map(c => ({...c, children:[]}));
                if (visibleKids.length === 0) return null;
                return (
                  <div className="branch interstellar-branch">
                    <div className="rowwrap">
                      <button className="expander" style={{ left: 6 }} onClick={() => toggleExpand("interstellar")}>{expanded.has("interstellar") ? "▾" : "▸"}</button>
                      <button className="row virtual" onClick={() => {}}>
                        <span className="thumb interstellar-thumb">
                          <svg viewBox="0 0 64 64" width="100%" height="100%">
                            <rect width="64" height="64" fill="#000"/>
                            {Array.from({length: 40}).map((_,i)=>{
                              const x = (i * 73 % 64), y = (i * 41 % 64), r = (i % 3) * 0.4 + 0.4;
                              return <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={0.4 + (i%5)*0.12}/>
                            })}
                          </svg>
                        </span>
                        <span className="rowmain">
                          <span className="rowname">Interstellar Space</span>
                          <span className="rowmeta">
                            <span className="typetag" style={{ color: TYPE_META.iso.color }}>{TYPE_META.iso.glyph} Unbound objects</span>
                          </span>
                        </span>
                        <span className="rowid">— SOL</span>
                      </button>
                    </div>
                    {expanded.has("interstellar") && (
                      <div className="children">
                        {visibleKids.map(k => (
                          <div key={k.id} className="branch">
                            <div className="rowwrap">
                              <BodyRow body={k} depth={1} selected={selectedId === k.id} onSelect={selectBody}/>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          )}

          {groupBy === "type" && (
            <>
              {TYPE_ORDER.filter(t => typeFilter.has(t)).map(t => {
                const items = flatVisible.filter(b => b.type === t);
                if (items.length === 0) return null;
                return (
                  <div key={t} className="typegroup">
                    <h2 className="typehead" style={{ color: TYPE_META[t].color }}>
                      <span className="glyph">{TYPE_META[t].glyph}</span>
                      {TYPE_META[t].label}<span className="cnt">{items.length}</span>
                    </h2>
                    {items.map(b => (
                      <div key={b.id} className="branch">
                        <div className="rowwrap">
                          <BodyRow body={b} depth={0} selected={selectedId === b.id} onSelect={selectBody}/>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          )}

          {groupBy === "none" && (
            <>
              {flatVisible.map(b => (
                <div key={b.id} className="branch">
                  <div className="rowwrap">
                    <BodyRow body={b} depth={0} selected={selectedId === b.id} onSelect={selectBody}/>
                  </div>
                </div>
              ))}
            </>
          )}

          {flatVisible.length === 0 && (
            <div className="empty-catalog">
              <p>No bodies match your filters.</p>
              <button onClick={() => { setSearch(""); setTypeFilter(new Set(TYPE_ORDER)); }}>Reset</button>
            </div>
          )}
        </section>

        <DetailPanel body={selected} byId={byId} onSelect={selectBody} onClose={() => setSelectedId(null)}/>
      </main>

      <footer className="foot">
        <span>Sol System Census · {window.BODIES.length} bodies · this is not an exhaustive list — over 1.3 million asteroids and 4,400 known minor planet moons have been catalogued</span>
      </footer>
    </div>
  );
}

window.App = App;
