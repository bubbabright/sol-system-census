const {
  useState,
  useMemo,
  useEffect,
  useRef
} = React;

// -- Type metadata
const TYPE_META = {
  star: {
    label: "Star",
    glyph: "★",
    color: "#ffce5a"
  },
  planet: {
    label: "Planet",
    glyph: "●",
    color: "#7ec8ff"
  },
  dwarf: {
    label: "Dwarf planet",
    glyph: "◐",
    color: "#c9a87a"
  },
  moon: {
    label: "Moon",
    glyph: "◯",
    color: "#cfcfd0"
  },
  asteroid: {
    label: "Asteroid",
    glyph: "◆",
    color: "#b0916a"
  },
  comet: {
    label: "Comet",
    glyph: "☄",
    color: "#9ec6e0"
  },
  iso: {
    label: "Interstellar",
    glyph: "→",
    color: "#d57aff"
  },
  probe: {
    label: "Spacecraft",
    glyph: "▣",
    color: "#7af09a"
  }
};
const TYPE_ORDER = ["star", "planet", "dwarf", "moon", "asteroid", "comet", "iso", "probe"];

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
  bodies.forEach(b => byId[b.id] = {
    ...b,
    children: []
  });
  const roots = [];
  bodies.forEach(b => {
    if (b.parent && byId[b.parent]) {
      byId[b.parent].children.push(byId[b.id]);
    } else {
      // No parent in dataset = root (sun, interstellar bucket virtual node)
      roots.push(byId[b.id]);
    }
  });
  return {
    byId,
    roots
  };
}

// Get all descendant ids of a node
function descendantIds(node, acc = []) {
  acc.push(node.id);
  node.children.forEach(c => descendantIds(c, acc));
  return acc;
}

// =====================  HEADER + CONTROLS  =====================

function Controls({
  search,
  setSearch,
  groupBy,
  setGroupBy,
  sortBy,
  setSortBy,
  typeFilter,
  setTypeFilter,
  counts
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "controls"
  }, /*#__PURE__*/React.createElement("div", {
    className: "searchwrap"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 14 14",
    className: "searchicon"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "6",
    r: "4.5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.4"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "9.2",
    y1: "9.2",
    x2: "13",
    y2: "13",
    stroke: "currentColor",
    strokeWidth: "1.4"
  })), /*#__PURE__*/React.createElement("input", {
    className: "search",
    placeholder: "Search bodies, e.g. Europa, Voyager, Halley\u2026",
    value: search,
    onChange: e => setSearch(e.target.value)
  }), search && /*#__PURE__*/React.createElement("button", {
    className: "clearbtn",
    onClick: () => setSearch("")
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    className: "ctlgroup"
  }, /*#__PURE__*/React.createElement("label", null, "Group"), /*#__PURE__*/React.createElement("div", {
    className: "segmented"
  }, /*#__PURE__*/React.createElement("button", {
    className: groupBy === "binding" ? "on" : "",
    onClick: () => setGroupBy("binding")
  }, "Gravitational binding"), /*#__PURE__*/React.createElement("button", {
    className: groupBy === "type" ? "on" : "",
    onClick: () => setGroupBy("type")
  }, "Type"), /*#__PURE__*/React.createElement("button", {
    className: groupBy === "none" ? "on" : "",
    onClick: () => setGroupBy("none")
  }, "Flat list"))), /*#__PURE__*/React.createElement("div", {
    className: "ctlgroup"
  }, /*#__PURE__*/React.createElement("label", null, "Sort"), /*#__PURE__*/React.createElement("div", {
    className: "segmented"
  }, /*#__PURE__*/React.createElement("button", {
    className: sortBy === "default" ? "on" : "",
    onClick: () => setSortBy("default")
  }, "Default"), /*#__PURE__*/React.createElement("button", {
    className: sortBy === "name" ? "on" : "",
    onClick: () => setSortBy("name")
  }, "A\u2192Z"), /*#__PURE__*/React.createElement("button", {
    className: sortBy === "mass" ? "on" : "",
    onClick: () => setSortBy("mass")
  }, "Mass"), /*#__PURE__*/React.createElement("button", {
    className: sortBy === "diameter" ? "on" : "",
    onClick: () => setSortBy("diameter")
  }, "Diameter"), /*#__PURE__*/React.createElement("button", {
    className: sortBy === "discovered" ? "on" : "",
    onClick: () => setSortBy("discovered")
  }, "Discovered"))), /*#__PURE__*/React.createElement("div", {
    className: "ctlgroup typefilter"
  }, /*#__PURE__*/React.createElement("label", null, "Filter"), /*#__PURE__*/React.createElement("div", {
    className: "chips"
  }, TYPE_ORDER.map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    className: "chip " + (typeFilter.has(t) ? "on" : ""),
    style: typeFilter.has(t) ? {
      borderColor: TYPE_META[t].color,
      color: TYPE_META[t].color
    } : {},
    onClick: () => {
      const next = new Set(typeFilter);
      if (next.has(t)) next.delete(t);else next.add(t);
      setTypeFilter(next);
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "glyph",
    style: {
      color: TYPE_META[t].color
    }
  }, TYPE_META[t].glyph), TYPE_META[t].label, /*#__PURE__*/React.createElement("span", {
    className: "count"
  }, counts[t] || 0))))));
}

// =====================  ROWS  =====================

function BodyRow({
  body,
  depth,
  selected,
  onSelect,
  isMatch
}) {
  const meta = TYPE_META[body.type];
  return /*#__PURE__*/React.createElement("button", {
    className: "row " + (selected ? "selected " : "") + (isMatch === false ? "dim " : ""),
    style: {
      paddingLeft: 16 + depth * 22
    },
    onClick: () => onSelect(body)
  }, /*#__PURE__*/React.createElement("span", {
    className: "rowtree",
    style: {
      width: depth * 22
    }
  }, depth > 0 && /*#__PURE__*/React.createElement("span", {
    className: "tee"
  }, "\u2514")), /*#__PURE__*/React.createElement("span", {
    className: "thumb"
  }, /*#__PURE__*/React.createElement(Portrait, {
    body: body,
    size: 120
  })), /*#__PURE__*/React.createElement("span", {
    className: "rowmain"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rowname"
  }, body.name), /*#__PURE__*/React.createElement("span", {
    className: "rowmeta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "typetag",
    style: {
      color: meta.color
    }
  }, meta.glyph, " ", meta.label), /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }, "\xB7"), /*#__PURE__*/React.createElement("span", {
    className: "diam"
  }, body.diameter), body.orbit && body.orbit !== "—" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }, "\xB7"), /*#__PURE__*/React.createElement("span", {
    className: "orb"
  }, body.orbit)))), body.status && /*#__PURE__*/React.createElement("span", {
    className: "status status-" + body.status
  }, body.status), /*#__PURE__*/React.createElement("span", {
    className: "rowid"
  }, body.id.toUpperCase()));
}

// Tree branch (binding view)
function TreeBranch({
  node,
  depth,
  selected,
  onSelect,
  matchSet,
  expanded,
  toggle
}) {
  const isExpanded = expanded.has(node.id);
  const hasKids = node.children && node.children.length > 0;
  const isMatch = !matchSet || matchSet.has(node.id);
  return /*#__PURE__*/React.createElement("div", {
    className: "branch"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rowwrap"
  }, hasKids && /*#__PURE__*/React.createElement("button", {
    className: "expander",
    style: {
      left: 6 + depth * 22
    },
    onClick: e => {
      e.stopPropagation();
      toggle(node.id);
    },
    "aria-label": isExpanded ? "collapse" : "expand"
  }, isExpanded ? "▾" : "▸"), /*#__PURE__*/React.createElement(BodyRow, {
    body: node,
    depth: depth,
    selected: selected === node.id,
    onSelect: onSelect,
    isMatch: isMatch
  })), isExpanded && hasKids && /*#__PURE__*/React.createElement("div", {
    className: "children"
  }, node.children.map(c => /*#__PURE__*/React.createElement(TreeBranch, {
    key: c.id,
    node: c,
    depth: depth + 1,
    selected: selected,
    onSelect: onSelect,
    matchSet: matchSet,
    expanded: expanded,
    toggle: toggle
  }))));
}

// =====================  DETAIL PANEL  =====================

function ParentChain({
  body,
  byId,
  onSelect
}) {
  // Walk parents to root
  const chain = [];
  let cur = body;
  while (cur) {
    chain.unshift(cur);
    cur = cur.parent && byId[cur.parent] ? byId[cur.parent] : null;
    if (chain.length > 8) break;
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "chain"
  }, chain.map((b, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: b.id
  }, i > 0 && /*#__PURE__*/React.createElement("span", {
    className: "chainarrow"
  }, "\u203A"), b.id === body.id ? /*#__PURE__*/React.createElement("span", {
    className: "chainself"
  }, b.name) : /*#__PURE__*/React.createElement("button", {
    className: "chainlink",
    onClick: () => onSelect(b)
  }, b.name))), body.parent === "interstellar" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "chainarrow"
  }, "\u203A"), /*#__PURE__*/React.createElement("span", {
    className: "chainself"
  }, body.name)));
}
function DetailPanel({
  body,
  byId,
  onSelect,
  onClose
}) {
  if (!body) {
    return /*#__PURE__*/React.createElement("aside", {
      className: "detail empty"
    }, /*#__PURE__*/React.createElement("div", {
      className: "emptyinner"
    }, /*#__PURE__*/React.createElement("div", {
      className: "emptyglyph"
    }, "\u2299"), /*#__PURE__*/React.createElement("h3", null, "Select a body"), /*#__PURE__*/React.createElement("p", null, "Click any object in the catalog to see its TL;DR, vital statistics, and gravitational lineage.")));
  }
  const meta = TYPE_META[body.type];
  const kids = Object.values(byId).filter(b => b.parent === body.id);
  return /*#__PURE__*/React.createElement("aside", {
    className: "detail"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detailtop"
  }, /*#__PURE__*/React.createElement("button", {
    className: "closebtn",
    onClick: onClose,
    "aria-label": "close"
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    className: "hero"
  }, /*#__PURE__*/React.createElement(Portrait, {
    body: body,
    size: 400
  })), /*#__PURE__*/React.createElement("div", {
    className: "detailbody"
  }, /*#__PURE__*/React.createElement("div", {
    className: "typeline",
    style: {
      color: meta.color
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "glyph"
  }, meta.glyph), meta.label.toUpperCase(), body.status && /*#__PURE__*/React.createElement("span", {
    className: "status status-" + body.status
  }, body.status)), /*#__PURE__*/React.createElement("h1", null, body.name), body.parent && byId[body.parent] && /*#__PURE__*/React.createElement("div", {
    className: "boundto"
  }, "Bound to ", /*#__PURE__*/React.createElement("button", {
    className: "boundlink",
    onClick: () => onSelect(byId[body.parent])
  }, byId[body.parent].name)), body.parent === "interstellar" && /*#__PURE__*/React.createElement("div", {
    className: "boundto interstellar"
  }, "Unbound \xB7 in interstellar space"), /*#__PURE__*/React.createElement(ParentChain, {
    body: body,
    byId: byId,
    onSelect: onSelect
  }), /*#__PURE__*/React.createElement("p", {
    className: "tldr"
  }, body.tldr), /*#__PURE__*/React.createElement("dl", {
    className: "stats"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "Mass"), /*#__PURE__*/React.createElement("dd", null, body.mass)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "Diameter"), /*#__PURE__*/React.createElement("dd", null, body.diameter)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "Orbit"), /*#__PURE__*/React.createElement("dd", null, body.orbit)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "Discovered"), /*#__PURE__*/React.createElement("dd", null, body.discovered))), kids.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "satellites"
  }, /*#__PURE__*/React.createElement("h4", null, "Bound to ", body.name, " ", /*#__PURE__*/React.createElement("span", {
    className: "cnt"
  }, "(", kids.length, ")")), /*#__PURE__*/React.createElement("div", {
    className: "satgrid"
  }, kids.map(k => /*#__PURE__*/React.createElement("button", {
    key: k.id,
    className: "satcard",
    onClick: () => onSelect(k)
  }, /*#__PURE__*/React.createElement("span", {
    className: "satthumb"
  }, /*#__PURE__*/React.createElement(Portrait, {
    body: k,
    size: 64
  })), /*#__PURE__*/React.createElement("span", {
    className: "satname"
  }, k.name), /*#__PURE__*/React.createElement("span", {
    className: "sattype",
    style: {
      color: TYPE_META[k.type].color
    }
  }, TYPE_META[k.type].label)))))));
}

// =====================  MAIN APP  =====================

function App() {
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState("binding");
  const [sortBy, setSortBy] = useState("default");
  const [typeFilter, setTypeFilter] = useState(new Set(TYPE_ORDER));
  const [selectedId, setSelectedId] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set(["sun", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "interstellar"]));
  const {
    byId,
    roots
  } = useMemo(() => buildTree(window.BODIES), []);

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
    const direct = window.BODIES.filter(b => b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || (b.tldr || "").toLowerCase().includes(q));
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
      if (n.has(id)) n.delete(id);else n.add(id);
      return n;
    });
  }

  // Sort comparator
  const cmp = useMemo(() => {
    switch (sortBy) {
      case "name":
        return (a, b) => a.name.localeCompare(b.name);
      case "mass":
        return (a, b) => (parseMass(b.mass) || 0) - (parseMass(a.mass) || 0);
      case "diameter":
        return (a, b) => (parseDiameter(b.diameter) || 0) - (parseDiameter(a.diameter) || 0);
      case "discovered":
        {
          const yr = b => {
            const m = (b.discovered || "").match(/\d{4}/);
            return m ? parseInt(m[0]) : -10000;
          };
          return (a, b) => yr(a) - yr(b);
        }
      default:
        return null;
    }
  }, [sortBy]);

  // Apply sort recursively to tree
  function sortNode(node) {
    if (!node.children || node.children.length === 0) return node;
    const sortedKids = [...node.children];
    if (cmp) sortedKids.sort(cmp);
    return {
      ...node,
      children: sortedKids.map(sortNode)
    };
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
    return {
      ...node,
      children: kids
    };
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
      diameter: "—",
      mass: "—",
      orbit: "—",
      discovered: "—",
      color: ["#000", "#222", "#000"],
      children: cmp ? [...items].sort(cmp) : items
    };
  }, [cmp]);

  // Flat list & type grouping
  const flatVisible = useMemo(() => {
    let arr = window.BODIES.filter(b => typeFilter.has(b.type) && (!matchSet || matchSet.has(b.id)));
    if (cmp) arr = [...arr].sort(cmp);
    return arr;
  }, [typeFilter, matchSet, cmp]);
  const selected = selectedId ? byId[selectedId] : null;

  // Esc closes panel
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setSelectedId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "app"
  }, /*#__PURE__*/React.createElement("header", {
    className: "topbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brandmark"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 32 32",
    width: "28",
    height: "28"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "16",
    cy: "16",
    r: "3.5",
    fill: "#ffce5a"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "16",
    cy: "16",
    rx: "10",
    ry: "10",
    fill: "none",
    stroke: "#5a8cc8",
    strokeWidth: "0.8"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "16",
    cy: "16",
    rx: "14",
    ry: "14",
    fill: "none",
    stroke: "#c87a5a",
    strokeWidth: "0.8"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "26",
    cy: "16",
    r: "1.4",
    fill: "#7ec8ff"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "16",
    cy: "6",
    r: "1",
    fill: "#c87a5a"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "brandtext"
  }, /*#__PURE__*/React.createElement("h1", null, "Sol System Census"), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "A catalog of every named body \u2014 bound, orbiting, escaped"))), /*#__PURE__*/React.createElement("div", {
    className: "totals"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "num"
  }, window.BODIES.length), /*#__PURE__*/React.createElement("span", {
    className: "lbl"
  }, "bodies cataloged")))), /*#__PURE__*/React.createElement(Controls, {
    search: search,
    setSearch: setSearch,
    groupBy: groupBy,
    setGroupBy: setGroupBy,
    sortBy: sortBy,
    setSortBy: setSortBy,
    typeFilter: typeFilter,
    setTypeFilter: setTypeFilter,
    counts: counts
  }), /*#__PURE__*/React.createElement("main", {
    className: "layout"
  }, /*#__PURE__*/React.createElement("section", {
    className: "catalog"
  }, groupBy === "binding" && /*#__PURE__*/React.createElement(React.Fragment, null, treeRoots.map(root => /*#__PURE__*/React.createElement(TreeBranch, {
    key: root.id,
    node: root,
    depth: 0,
    selected: selectedId,
    onSelect: selectBody,
    matchSet: matchSet,
    expanded: expanded,
    toggle: toggleExpand
  })), (() => {
    const visibleKids = interstellarNode.children.filter(c => typeFilter.has(c.type) && (!matchSet || matchSet.has(c.id))).map(c => ({
      ...c,
      children: []
    }));
    if (visibleKids.length === 0) return null;
    return /*#__PURE__*/React.createElement("div", {
      className: "branch interstellar-branch"
    }, /*#__PURE__*/React.createElement("div", {
      className: "rowwrap"
    }, /*#__PURE__*/React.createElement("button", {
      className: "expander",
      style: {
        left: 6
      },
      onClick: () => toggleExpand("interstellar")
    }, expanded.has("interstellar") ? "▾" : "▸"), /*#__PURE__*/React.createElement("button", {
      className: "row virtual",
      onClick: () => {}
    }, /*#__PURE__*/React.createElement("span", {
      className: "thumb interstellar-thumb"
    }, /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 64 64",
      width: "100%",
      height: "100%"
    }, /*#__PURE__*/React.createElement("rect", {
      width: "64",
      height: "64",
      fill: "#000"
    }), Array.from({
      length: 40
    }).map((_, i) => {
      const x = i * 73 % 64,
        y = i * 41 % 64,
        r = i % 3 * 0.4 + 0.4;
      return /*#__PURE__*/React.createElement("circle", {
        key: i,
        cx: x,
        cy: y,
        r: r,
        fill: "#fff",
        opacity: 0.4 + i % 5 * 0.12
      });
    }))), /*#__PURE__*/React.createElement("span", {
      className: "rowmain"
    }, /*#__PURE__*/React.createElement("span", {
      className: "rowname"
    }, "Interstellar Space"), /*#__PURE__*/React.createElement("span", {
      className: "rowmeta"
    }, /*#__PURE__*/React.createElement("span", {
      className: "typetag",
      style: {
        color: TYPE_META.iso.color
      }
    }, TYPE_META.iso.glyph, " Unbound objects"))), /*#__PURE__*/React.createElement("span", {
      className: "rowid"
    }, "\u2014 SOL"))), expanded.has("interstellar") && /*#__PURE__*/React.createElement("div", {
      className: "children"
    }, visibleKids.map(k => /*#__PURE__*/React.createElement("div", {
      key: k.id,
      className: "branch"
    }, /*#__PURE__*/React.createElement("div", {
      className: "rowwrap"
    }, /*#__PURE__*/React.createElement(BodyRow, {
      body: k,
      depth: 1,
      selected: selectedId === k.id,
      onSelect: selectBody
    }))))));
  })()), groupBy === "type" && /*#__PURE__*/React.createElement(React.Fragment, null, TYPE_ORDER.filter(t => typeFilter.has(t)).map(t => {
    const items = flatVisible.filter(b => b.type === t);
    if (items.length === 0) return null;
    return /*#__PURE__*/React.createElement("div", {
      key: t,
      className: "typegroup"
    }, /*#__PURE__*/React.createElement("h2", {
      className: "typehead",
      style: {
        color: TYPE_META[t].color
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "glyph"
    }, TYPE_META[t].glyph), TYPE_META[t].label, /*#__PURE__*/React.createElement("span", {
      className: "cnt"
    }, items.length)), items.map(b => /*#__PURE__*/React.createElement("div", {
      key: b.id,
      className: "branch"
    }, /*#__PURE__*/React.createElement("div", {
      className: "rowwrap"
    }, /*#__PURE__*/React.createElement(BodyRow, {
      body: b,
      depth: 0,
      selected: selectedId === b.id,
      onSelect: selectBody
    })))));
  })), groupBy === "none" && /*#__PURE__*/React.createElement(React.Fragment, null, flatVisible.map(b => /*#__PURE__*/React.createElement("div", {
    key: b.id,
    className: "branch"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rowwrap"
  }, /*#__PURE__*/React.createElement(BodyRow, {
    body: b,
    depth: 0,
    selected: selectedId === b.id,
    onSelect: selectBody
  }))))), flatVisible.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "empty-catalog"
  }, /*#__PURE__*/React.createElement("p", null, "No bodies match your filters."), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setSearch("");
      setTypeFilter(new Set(TYPE_ORDER));
    }
  }, "Reset"))), /*#__PURE__*/React.createElement(DetailPanel, {
    body: selected,
    byId: byId,
    onSelect: selectBody,
    onClose: () => setSelectedId(null)
  })), /*#__PURE__*/React.createElement("footer", {
    className: "foot"
  }, /*#__PURE__*/React.createElement("span", null, "Sol System Census \xB7 ", window.BODIES.length, " bodies \xB7 this is not an exhaustive list \u2014 over 1.3 million asteroids and 4,400 known minor planet moons have been catalogued")));
}
window.App = App;