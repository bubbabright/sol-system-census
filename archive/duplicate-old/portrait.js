// SVG portrait renderer for celestial bodies.
// Procedurally generates a plausible image based on type + color palette + seed.

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = h * 16777619 >>> 0;
  }
  return h;
}
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = s * 1664525 + 1013904223 >>> 0;
    return s / 0xffffffff;
  };
}
function imgUrl(body, w) {
  if (!body.img) return null;
  // If it's already a full URL, use directly. Otherwise treat as a Wikimedia filename.
  if (/^https?:\/\//.test(body.img)) return body.img;
  return "https://en.wikipedia.org/wiki/Special:FilePath/" + encodeURIComponent(body.img) + "?width=" + (w || 480);
}
function Portrait({
  body,
  size = 320
}) {
  const [imgFailed, setImgFailed] = React.useState(false);
  const url = imgUrl(body, size >= 200 ? 480 : 160);

  // If we have a remote image URL and it hasn't failed, render <img>
  if (url && !imgFailed) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: "100%",
        height: "100%",
        background: "radial-gradient(ellipse at center, #050810 0%, #000 100%)",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: url,
      alt: body.name,
      loading: "lazy",
      referrerPolicy: "no-referrer",
      onError: () => setImgFailed(true),
      style: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center",
        display: "block"
      }
    }));
  }

  // Fallback: procedural SVG portrait
  const r = size / 2;
  const cx = r,
    cy = r;
  const [bg, c1, c2] = body.color || ["#000", "#888", "#555"];
  const rand = rng(hash(body.id));
  const uid = "p_" + body.id.replace(/[^a-z0-9]/gi, "");
  const tex = body.texture || "rocky";

  // Background starfield
  const stars = [];
  const r2 = rng(hash(body.id + "_s"));
  for (let i = 0; i < 60; i++) {
    const x = r2() * size,
      y = r2() * size,
      s = r2() * 1.2 + 0.2;
    const o = 0.3 + r2() * 0.7;
    stars.push(/*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: x,
      cy: y,
      r: s,
      fill: "#fff",
      opacity: o
    }));
  }

  // PROBE
  if (tex === "probe") {
    return /*#__PURE__*/React.createElement("svg", {
      viewBox: `0 0 ${size} ${size}`,
      style: {
        width: "100%",
        height: "100%",
        display: "block"
      }
    }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("radialGradient", {
      id: uid + "_bg",
      cx: "50%",
      cy: "50%",
      r: "60%"
    }, /*#__PURE__*/React.createElement("stop", {
      offset: "0%",
      stopColor: "#0a1018"
    }), /*#__PURE__*/React.createElement("stop", {
      offset: "100%",
      stopColor: "#02040a"
    }))), /*#__PURE__*/React.createElement("rect", {
      width: size,
      height: size,
      fill: `url(#${uid}_bg)`
    }), stars, /*#__PURE__*/React.createElement("g", {
      transform: `translate(${cx}, ${cy})`
    }, /*#__PURE__*/React.createElement("rect", {
      x: -90,
      y: -12,
      width: 60,
      height: 24,
      fill: "#1a3050",
      stroke: "#4a78b0",
      strokeWidth: "1"
    }), /*#__PURE__*/React.createElement("rect", {
      x: 30,
      y: -12,
      width: 60,
      height: 24,
      fill: "#1a3050",
      stroke: "#4a78b0",
      strokeWidth: "1"
    }), [-78, -66, -54, -42, 42, 54, 66, 78].map((x, i) => /*#__PURE__*/React.createElement("line", {
      key: i,
      x1: x,
      y1: -12,
      x2: x,
      y2: 12,
      stroke: "#4a78b0",
      strokeWidth: "0.5"
    })), /*#__PURE__*/React.createElement("rect", {
      x: -22,
      y: -18,
      width: 44,
      height: 36,
      fill: c1,
      stroke: "#0a0a0a",
      strokeWidth: "1.5"
    }), /*#__PURE__*/React.createElement("rect", {
      x: -18,
      y: -14,
      width: 36,
      height: 4,
      fill: "#d4af37",
      opacity: "0.6"
    }), /*#__PURE__*/React.createElement("ellipse", {
      cx: 0,
      cy: -38,
      rx: 22,
      ry: 8,
      fill: "#d4d4d4",
      stroke: "#444",
      strokeWidth: "1"
    }), /*#__PURE__*/React.createElement("line", {
      x1: 0,
      y1: -30,
      x2: 0,
      y2: -18,
      stroke: "#888",
      strokeWidth: "2"
    }), /*#__PURE__*/React.createElement("line", {
      x1: -22,
      y1: 10,
      x2: -44,
      y2: 28,
      stroke: "#666",
      strokeWidth: "2"
    }), /*#__PURE__*/React.createElement("rect", {
      x: -52,
      y: 26,
      width: 14,
      height: 8,
      fill: "#3a2814",
      stroke: "#1a0a00",
      strokeWidth: "0.5"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: r * 0.7,
      cy: -r * 0.7,
      r: 3,
      fill: body.status === "active" ? "#7af09a" : body.status === "impacted" ? "#ff6a4a" : "#aaa"
    })));
  }

  // COMET
  if (tex === "comet") {
    return /*#__PURE__*/React.createElement("svg", {
      viewBox: `0 0 ${size} ${size}`,
      style: {
        width: "100%",
        height: "100%",
        display: "block"
      }
    }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("radialGradient", {
      id: uid + "_bg",
      cx: "50%",
      cy: "50%",
      r: "70%"
    }, /*#__PURE__*/React.createElement("stop", {
      offset: "0%",
      stopColor: "#020410"
    }), /*#__PURE__*/React.createElement("stop", {
      offset: "100%",
      stopColor: "#000"
    })), /*#__PURE__*/React.createElement("radialGradient", {
      id: uid + "_coma",
      cx: "50%",
      cy: "50%",
      r: "50%"
    }, /*#__PURE__*/React.createElement("stop", {
      offset: "0%",
      stopColor: c1,
      stopOpacity: "0.9"
    }), /*#__PURE__*/React.createElement("stop", {
      offset: "60%",
      stopColor: c1,
      stopOpacity: "0.25"
    }), /*#__PURE__*/React.createElement("stop", {
      offset: "100%",
      stopColor: c1,
      stopOpacity: "0"
    })), /*#__PURE__*/React.createElement("linearGradient", {
      id: uid + "_tail",
      x1: "0%",
      y1: "50%",
      x2: "100%",
      y2: "50%"
    }, /*#__PURE__*/React.createElement("stop", {
      offset: "0%",
      stopColor: c1,
      stopOpacity: "0.7"
    }), /*#__PURE__*/React.createElement("stop", {
      offset: "100%",
      stopColor: c1,
      stopOpacity: "0"
    })), /*#__PURE__*/React.createElement("linearGradient", {
      id: uid + "_ion",
      x1: "0%",
      y1: "50%",
      x2: "100%",
      y2: "50%"
    }, /*#__PURE__*/React.createElement("stop", {
      offset: "0%",
      stopColor: "#8ec8ff",
      stopOpacity: "0.5"
    }), /*#__PURE__*/React.createElement("stop", {
      offset: "100%",
      stopColor: "#8ec8ff",
      stopOpacity: "0"
    }))), /*#__PURE__*/React.createElement("rect", {
      width: size,
      height: size,
      fill: `url(#${uid}_bg)`
    }), stars, /*#__PURE__*/React.createElement("path", {
      d: `M ${cx} ${cy} Q ${cx + size * 0.5} ${cy - 20} ${size} ${cy - 30} L ${size} ${cy + 10} Q ${cx + size * 0.4} ${cy + 20} ${cx} ${cy} Z`,
      fill: `url(#${uid}_tail)`
    }), /*#__PURE__*/React.createElement("path", {
      d: `M ${cx} ${cy} L ${size} ${cy + 15} L ${size} ${cy + 25} L ${cx} ${cy + 4} Z`,
      fill: `url(#${uid}_ion)`
    }), /*#__PURE__*/React.createElement("circle", {
      cx: cx,
      cy: cy,
      r: r * 0.45,
      fill: `url(#${uid}_coma)`
    }), /*#__PURE__*/React.createElement("circle", {
      cx: cx,
      cy: cy,
      r: r * 0.09,
      fill: c2,
      stroke: "#000",
      strokeWidth: "0.5"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: cx - r * 0.03,
      cy: cy - r * 0.03,
      r: r * 0.05,
      fill: c1,
      opacity: "0.6"
    }));
  }

  // STAR (Sun)
  if (tex === "star") {
    return /*#__PURE__*/React.createElement("svg", {
      viewBox: `0 0 ${size} ${size}`,
      style: {
        width: "100%",
        height: "100%",
        display: "block"
      }
    }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("radialGradient", {
      id: uid + "_bg",
      cx: "50%",
      cy: "50%",
      r: "70%"
    }, /*#__PURE__*/React.createElement("stop", {
      offset: "0%",
      stopColor: "#1a0800"
    }), /*#__PURE__*/React.createElement("stop", {
      offset: "100%",
      stopColor: "#000"
    })), /*#__PURE__*/React.createElement("radialGradient", {
      id: uid + "_corona",
      cx: "50%",
      cy: "50%",
      r: "50%"
    }, /*#__PURE__*/React.createElement("stop", {
      offset: "0%",
      stopColor: "#fff8c0",
      stopOpacity: "1"
    }), /*#__PURE__*/React.createElement("stop", {
      offset: "35%",
      stopColor: c1,
      stopOpacity: "0.9"
    }), /*#__PURE__*/React.createElement("stop", {
      offset: "60%",
      stopColor: c2,
      stopOpacity: "0.5"
    }), /*#__PURE__*/React.createElement("stop", {
      offset: "100%",
      stopColor: c2,
      stopOpacity: "0"
    })), /*#__PURE__*/React.createElement("radialGradient", {
      id: uid + "_surface",
      cx: "42%",
      cy: "42%",
      r: "60%"
    }, /*#__PURE__*/React.createElement("stop", {
      offset: "0%",
      stopColor: "#fff4b0"
    }), /*#__PURE__*/React.createElement("stop", {
      offset: "60%",
      stopColor: c1
    }), /*#__PURE__*/React.createElement("stop", {
      offset: "100%",
      stopColor: c2
    }))), /*#__PURE__*/React.createElement("rect", {
      width: size,
      height: size,
      fill: `url(#${uid}_bg)`
    }), stars, /*#__PURE__*/React.createElement("circle", {
      cx: cx,
      cy: cy,
      r: r * 0.95,
      fill: `url(#${uid}_corona)`
    }), /*#__PURE__*/React.createElement("circle", {
      cx: cx,
      cy: cy,
      r: r * 0.55,
      fill: `url(#${uid}_surface)`
    }), Array.from({
      length: 40
    }).map((_, i) => {
      const a = rand() * Math.PI * 2;
      const d = Math.sqrt(rand()) * r * 0.5;
      const x = cx + Math.cos(a) * d,
        y = cy + Math.sin(a) * d;
      return /*#__PURE__*/React.createElement("circle", {
        key: i,
        cx: x,
        cy: y,
        r: 1.5 + rand() * 2,
        fill: "#fff8c0",
        opacity: 0.3 + rand() * 0.4
      });
    }), /*#__PURE__*/React.createElement("ellipse", {
      cx: cx + 18,
      cy: cy + 8,
      rx: 8,
      ry: 5,
      fill: "#7c2a00",
      opacity: "0.6"
    }));
  }

  // ROCKY / ICY / CLOUDY / GAS / EARTH — orbital body
  // shared: background + globe with radial light gradient + features
  const sphereId = uid + "_sphere";
  const shadowId = uid + "_shadow";
  const features = [];
  if (tex === "rocky" || tex === "icy") {
    // craters
    const n = 18 + Math.floor(rand() * 12);
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2;
      const d = Math.sqrt(rand()) * r * 0.78;
      const x = cx + Math.cos(a) * d,
        y = cy + Math.sin(a) * d;
      // skip if outside disc
      if (Math.hypot(x - cx, y - cy) > r * 0.82) continue;
      const cr = 2 + rand() * (tex === "icy" ? 6 : 9);
      features.push(/*#__PURE__*/React.createElement("circle", {
        key: "cr" + i,
        cx: x,
        cy: y,
        r: cr,
        fill: "#000",
        opacity: 0.18 + rand() * 0.25
      }));
      features.push(/*#__PURE__*/React.createElement("circle", {
        key: "cr" + i + "h",
        cx: x - cr * 0.25,
        cy: y - cr * 0.25,
        r: cr * 0.55,
        fill: "#fff",
        opacity: 0.05 + rand() * 0.08
      }));
    }
  }
  if (tex === "cloudy") {
    const n = 6;
    for (let i = 0; i < n; i++) {
      const cy2 = cy - r * 0.6 + i / (n - 1) * r * 1.2;
      const w = r * (1.7 - Math.abs((cy2 - cy) / r) * 0.8);
      features.push(/*#__PURE__*/React.createElement("ellipse", {
        key: "cl" + i,
        cx: cx,
        cy: cy2,
        rx: w * 0.45,
        ry: r * 0.04 + rand() * 4,
        fill: "#fff",
        opacity: 0.06 + rand() * 0.06
      }));
    }
  }
  if (tex === "gas") {
    const n = 10;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const cy2 = cy - r * 0.85 + t * r * 1.7;
      const dx = Math.abs(cy2 - cy) / r;
      const w = r * Math.sqrt(Math.max(0, 1 - dx * dx)) * 0.95;
      const bandColor = i % 2 === 0 ? c1 : c2;
      features.push(/*#__PURE__*/React.createElement("ellipse", {
        key: "b" + i,
        cx: cx,
        cy: cy2,
        rx: w,
        ry: r * 0.07,
        fill: bandColor,
        opacity: 0.35
      }));
    }
    // Great Red Spot for Jupiter
    if (body.id === "jupiter") {
      features.push(/*#__PURE__*/React.createElement("ellipse", {
        key: "grs",
        cx: cx + 22,
        cy: cy + 18,
        rx: 18,
        ry: 9,
        fill: "#8b2a00",
        opacity: "0.85"
      }));
    }
  }
  if (tex === "earth") {
    // Continents — approximate blobs
    features.push(/*#__PURE__*/React.createElement("g", {
      key: "continents"
    }, /*#__PURE__*/React.createElement("path", {
      d: `M ${cx - 30} ${cy - 40} q 20 -10 40 5 q 10 25 -5 50 q -20 20 -40 5 q -25 -25 5 -60 z`,
      fill: c2,
      opacity: "0.85"
    }), /*#__PURE__*/React.createElement("path", {
      d: `M ${cx - 70} ${cy - 30} q -10 20 5 50 q 15 25 5 50 q -15 -10 -25 -40 q -10 -30 15 -60 z`,
      fill: c2,
      opacity: "0.7"
    }), /*#__PURE__*/React.createElement("ellipse", {
      cx: cx + 50,
      cy: cy + 30,
      rx: 18,
      ry: 10,
      fill: c2,
      opacity: "0.8"
    }), /*#__PURE__*/React.createElement("ellipse", {
      cx: cx,
      cy: cy - r * 0.85,
      rx: r * 0.4,
      ry: r * 0.1,
      fill: "#fff",
      opacity: "0.6"
    }), /*#__PURE__*/React.createElement("ellipse", {
      cx: cx,
      cy: cy + r * 0.88,
      rx: r * 0.5,
      ry: r * 0.08,
      fill: "#fff",
      opacity: "0.6"
    }), /*#__PURE__*/React.createElement("ellipse", {
      cx: cx - r * 0.3,
      cy: cy + r * 0.1,
      rx: r * 0.35,
      ry: r * 0.06,
      fill: "#fff",
      opacity: "0.18"
    }), /*#__PURE__*/React.createElement("ellipse", {
      cx: cx + r * 0.35,
      cy: cy - r * 0.2,
      rx: r * 0.3,
      ry: r * 0.06,
      fill: "#fff",
      opacity: "0.2"
    })));
  }

  // Polar caps for Mars
  if (body.id === "mars") {
    features.push(/*#__PURE__*/React.createElement("ellipse", {
      key: "np",
      cx: cx,
      cy: cy - r * 0.85,
      rx: r * 0.25,
      ry: r * 0.08,
      fill: "#fff",
      opacity: "0.8"
    }));
    features.push(/*#__PURE__*/React.createElement("ellipse", {
      key: "sp",
      cx: cx,
      cy: cy + r * 0.85,
      rx: r * 0.2,
      ry: r * 0.06,
      fill: "#fff",
      opacity: "0.7"
    }));
  }
  // Pluto heart
  if (body.id === "pluto") {
    features.push(/*#__PURE__*/React.createElement("path", {
      key: "heart",
      d: `M ${cx - 20} ${cy + 5} q -8 -18 10 -12 q 8 -10 18 4 q 6 18 -14 28 q -22 -10 -14 -20 z`,
      fill: "#f0d8b0",
      opacity: "0.85"
    }));
  }
  // Io sulfur splotches
  if (body.id === "io") {
    for (let i = 0; i < 8; i++) {
      const a = rand() * Math.PI * 2,
        d = Math.sqrt(rand()) * r * 0.7;
      features.push(/*#__PURE__*/React.createElement("circle", {
        key: "io" + i,
        cx: cx + Math.cos(a) * d,
        cy: cy + Math.sin(a) * d,
        r: 4 + rand() * 8,
        fill: "#6a1a00",
        opacity: 0.4 + rand() * 0.3
      }));
    }
  }
  // Europa cracks
  if (body.id === "europa") {
    for (let i = 0; i < 12; i++) {
      const y0 = cy + (rand() - 0.5) * r * 1.6;
      features.push(/*#__PURE__*/React.createElement("path", {
        key: "eu" + i,
        d: `M ${cx - r * 0.85} ${y0} Q ${cx} ${y0 + (rand() - 0.5) * 30} ${cx + r * 0.85} ${y0 + (rand() - 0.5) * 40}`,
        stroke: "#8a3818",
        strokeWidth: 0.8 + rand() * 1,
        fill: "none",
        opacity: 0.6
      }));
    }
  }
  // Mimas big crater (Herschel)
  if (body.id === "mimas") {
    features.push(/*#__PURE__*/React.createElement("circle", {
      key: "herschel",
      cx: cx - r * 0.35,
      cy: cy - r * 0.2,
      r: r * 0.32,
      fill: "#000",
      opacity: "0.22"
    }));
    features.push(/*#__PURE__*/React.createElement("circle", {
      key: "herschel2",
      cx: cx - r * 0.35,
      cy: cy - r * 0.2,
      r: r * 0.32,
      fill: "none",
      stroke: "#fff",
      strokeWidth: "1",
      opacity: "0.15"
    }));
    features.push(/*#__PURE__*/React.createElement("circle", {
      key: "herschel3",
      cx: cx - r * 0.32,
      cy: cy - r * 0.22,
      r: r * 0.06,
      fill: "#000",
      opacity: "0.5"
    }));
  }
  // Iapetus two-tone
  if (body.id === "iapetus") {
    features.push(/*#__PURE__*/React.createElement("path", {
      key: "dark",
      d: `M ${cx} ${cy - r * 0.95} A ${r * 0.95} ${r * 0.95} 0 0 1 ${cx} ${cy + r * 0.95} A ${r * 0.4} ${r * 0.95} 0 0 0 ${cx} ${cy - r * 0.95} Z`,
      fill: "#1a120c",
      opacity: "0.85"
    }));
  }
  // Charon dark cap
  if (body.id === "charon") {
    features.push(/*#__PURE__*/React.createElement("ellipse", {
      key: "mordor",
      cx: cx,
      cy: cy - r * 0.78,
      rx: r * 0.35,
      ry: r * 0.18,
      fill: "#5a2818",
      opacity: "0.7"
    }));
  }
  // Triton cantaloupe
  if (body.id === "triton") {
    for (let i = 0; i < 24; i++) {
      const a = rand() * Math.PI * 2,
        d = Math.sqrt(rand()) * r * 0.75;
      features.push(/*#__PURE__*/React.createElement("circle", {
        key: "tri" + i,
        cx: cx + Math.cos(a) * d,
        cy: cy + Math.sin(a) * d,
        r: 3 + rand() * 5,
        fill: "#6a4838",
        opacity: 0.3 + rand() * 0.2
      }));
    }
  }

  // Rings
  let rings = null;
  if (body.rings) {
    const ringColor = body.id === "saturn" ? "#e8d6a0" : "#cce0e8";
    rings = /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("ellipse", {
      cx: cx,
      cy: cy,
      rx: r * 1.55,
      ry: r * 0.28,
      fill: "none",
      stroke: ringColor,
      strokeWidth: r * 0.04,
      opacity: "0.5"
    }), /*#__PURE__*/React.createElement("ellipse", {
      cx: cx,
      cy: cy,
      rx: r * 1.35,
      ry: r * 0.24,
      fill: "none",
      stroke: ringColor,
      strokeWidth: r * 0.08,
      opacity: "0.65"
    }), /*#__PURE__*/React.createElement("ellipse", {
      cx: cx,
      cy: cy,
      rx: r * 1.18,
      ry: r * 0.21,
      fill: "none",
      stroke: ringColor,
      strokeWidth: r * 0.03,
      opacity: "0.4"
    }));
  }
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${size} ${size}`,
    style: {
      width: "100%",
      height: "100%",
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("radialGradient", {
    id: uid + "_bg",
    cx: "50%",
    cy: "50%",
    r: "70%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: bg
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#000"
  })), /*#__PURE__*/React.createElement("radialGradient", {
    id: sphereId,
    cx: "35%",
    cy: "35%",
    r: "75%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: c1
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "60%",
    stopColor: c2
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#000"
  })), /*#__PURE__*/React.createElement("radialGradient", {
    id: shadowId,
    cx: "35%",
    cy: "35%",
    r: "80%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#fff",
    stopOpacity: "0.0"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "60%",
    stopColor: "#000",
    stopOpacity: "0.0"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#000",
    stopOpacity: "0.55"
  })), /*#__PURE__*/React.createElement("clipPath", {
    id: uid + "_clip"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: cx,
    cy: cy,
    r: r * 0.92
  }))), /*#__PURE__*/React.createElement("rect", {
    width: size,
    height: size,
    fill: `url(#${uid}_bg)`
  }), stars, rings && /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("ellipse", {
    cx: cx,
    cy: cy,
    rx: r * 1.55,
    ry: r * 0.28,
    fill: "none",
    stroke: body.id === "saturn" ? "#e8d6a0" : "#cce0e8",
    strokeWidth: r * 0.04,
    opacity: "0.5",
    clipPath: `inset(0 0 50% 0)`
  })), /*#__PURE__*/React.createElement("circle", {
    cx: cx,
    cy: cy,
    r: r * 0.92,
    fill: `url(#${sphereId})`
  }), /*#__PURE__*/React.createElement("g", {
    clipPath: `url(#${uid}_clip)`
  }, features), /*#__PURE__*/React.createElement("circle", {
    cx: cx,
    cy: cy,
    r: r * 0.92,
    fill: `url(#${shadowId})`
  }), /*#__PURE__*/React.createElement("circle", {
    cx: cx,
    cy: cy,
    r: r * 0.92,
    fill: "none",
    stroke: "#000",
    strokeWidth: "1",
    opacity: "0.4"
  }), rings);
}
window.Portrait = Portrait;