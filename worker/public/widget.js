/**
 * Sol System Census · "Ask the Professor" embeddable widget.
 *
 * Vanilla JS, zero dependencies, self-contained styling. Add one script
 * tag to any page:
 *
 *   <script src="https://<your-worker>.workers.dev/widget.js"
 *           data-base-url="https://<your-worker>.workers.dev"></script>
 *
 * Optionally, the host page can broadcast the "currently relevant" body
 * so answers are grounded in it:
 *
 *   window.__selectedBody = { name, type, tldr, mass, diameter, orbit, discovered };
 *   window.dispatchEvent(new CustomEvent("sol-census:selection", { detail: body }));
 *
 * The widget reads window.__selectedBody at ask-time (source of truth)
 * and listens for the event only to update its header label live.
 */
(function () {
  "use strict";

  var scriptEl = document.currentScript;
  var BASE_URL = ((scriptEl && scriptEl.dataset.baseUrl) || window.location.origin).trim();
  var ASK_URL = BASE_URL.replace(/\/$/, "") + "/api/ask";

  var COLORS = {
    bg: "#0a0d14",
    bgSoft: "#0d1018",
    bgRow: "#0f131c",
    bgSel: "#1d2740",
    line: "#2a3245",
    ink: "#e8e6e0",
    inkMid: "#a8a8a4",
    amber: "#e9b46a",
    amberHot: "#ffce5a",
    red: "#ff6a4a",
  };
  var FONT_SANS = '"Geist","DM Sans","Helvetica Neue",system-ui,sans-serif';
  var FONT_MONO = '"JetBrains Mono","IBM Plex Mono",ui-monospace,monospace';

  var state = {
    open: false,
    messages: [], // { role: 'user'|'assistant', text }
    status: "idle", // idle | loading | error
    errorMsg: null,
    selectedBody: null,
  };

  function injectStyles() {
    var style = document.createElement("style");
    style.textContent =
      ".professor{position:fixed;bottom:20px;right:20px;z-index:99999;font-family:" +
      FONT_SANS +
      ";}" +
      ".professor-fab{display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:999px;" +
      "background:" +
      COLORS.bgSoft +
      ";color:" +
      COLORS.amberHot +
      ";border:1px solid " +
      COLORS.line +
      ";cursor:pointer;font:inherit;font-size:13px;font-weight:500;" +
      "box-shadow:0 8px 24px rgba(0,0,0,0.4);transition:border-color 120ms,color 120ms;}" +
      ".professor-fab:hover{border-color:" +
      COLORS.amber +
      ";color:" +
      COLORS.amberHot +
      ";}" +
      ".professor-panel{width:340px;max-width:calc(100vw - 24px);height:440px;max-height:70vh;" +
      "display:flex;flex-direction:column;background:" +
      COLORS.bg +
      ";border:1px solid " +
      COLORS.line +
      ";border-radius:14px;box-shadow:0 16px 48px rgba(0,0,0,0.55);overflow:hidden;}" +
      ".professor-head{display:flex;align-items:center;justify-content:space-between;" +
      "padding:12px 14px;border-bottom:1px solid " +
      COLORS.line +
      ";color:" +
      COLORS.ink +
      ";font-size:13px;font-weight:500;}" +
      ".professor-close{background:none;border:none;color:" +
      COLORS.inkMid +
      ";cursor:pointer;font-size:16px;line-height:1;padding:2px 6px;}" +
      ".professor-close:hover{color:" +
      COLORS.ink +
      ";}" +
      ".professor-log{flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:8px;}" +
      ".professor-hint{color:" +
      COLORS.inkMid +
      ";font-size:12.5px;line-height:1.5;margin:0;}" +
      ".professor-msg{font-size:13px;line-height:1.45;padding:8px 10px;border-radius:10px;max-width:85%;white-space:pre-wrap;}" +
      ".professor-msg-user{align-self:flex-end;background:" +
      COLORS.bgSel +
      ";color:" +
      COLORS.ink +
      ";}" +
      ".professor-msg-assistant{align-self:flex-start;background:" +
      COLORS.bgRow +
      ";color:" +
      COLORS.ink +
      ";border:1px solid " +
      COLORS.line +
      ";}" +
      ".professor-typing{color:" +
      COLORS.inkMid +
      ";font-style:italic;}" +
      ".professor-error{align-self:flex-start;color:" +
      COLORS.red +
      ";font-size:12.5px;padding:6px 2px;}" +
      ".professor-input{display:flex;gap:8px;padding:10px;border-top:1px solid " +
      COLORS.line +
      ";}" +
      ".professor-input input{flex:1;background:" +
      COLORS.bgRow +
      ";border:1px solid " +
      COLORS.line +
      ";border-radius:8px;padding:8px 10px;color:" +
      COLORS.ink +
      ";font:13px " +
      FONT_MONO +
      ";}" +
      ".professor-input input:focus{outline:none;border-color:" +
      COLORS.amber +
      ";}" +
      ".professor-input button{background:" +
      COLORS.amber +
      ";color:#1a1408;border:none;border-radius:8px;padding:0 14px;font:inherit;font-weight:600;cursor:pointer;}" +
      ".professor-input button:disabled{opacity:0.4;cursor:default;}";
    document.head.appendChild(style);
  }

  var els = {};

  function render() {
    els.root.innerHTML = "";
    if (!state.open) {
      var fab = document.createElement("button");
      fab.className = "professor-fab";
      fab.type = "button";
      fab.textContent = "🔭 Ask the Professor";
      fab.addEventListener("click", function () {
        state.open = true;
        render();
      });
      els.root.appendChild(fab);
      return;
    }

    var panel = document.createElement("div");
    panel.className = "professor-panel";

    var head = document.createElement("div");
    head.className = "professor-head";
    var label = document.createElement("span");
    label.textContent =
      "Ask the Professor" + (state.selectedBody ? " · " + state.selectedBody.name : "");
    var closeBtn = document.createElement("button");
    closeBtn.className = "professor-close";
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.textContent = "✕";
    closeBtn.addEventListener("click", function () {
      state.open = false;
      render();
    });
    head.appendChild(label);
    head.appendChild(closeBtn);

    var log = document.createElement("div");
    log.className = "professor-log";
    if (state.messages.length === 0) {
      var hint = document.createElement("p");
      hint.className = "professor-hint";
      hint.textContent = state.selectedBody
        ? "Ask me anything about " + state.selectedBody.name + ", or the Solar System at large."
        : "Ask me anything about the Solar System.";
      log.appendChild(hint);
    }
    state.messages.forEach(function (m) {
      var msg = document.createElement("div");
      msg.className = "professor-msg professor-msg-" + m.role;
      msg.textContent = m.text;
      log.appendChild(msg);
    });
    if (state.status === "loading") {
      var typing = document.createElement("div");
      typing.className = "professor-msg professor-msg-assistant professor-typing";
      typing.textContent = "…thinking…";
      log.appendChild(typing);
    }
    if (state.status === "error") {
      var err = document.createElement("div");
      err.className = "professor-error";
      err.textContent = state.errorMsg;
      log.appendChild(err);
    }

    var form = document.createElement("form");
    form.className = "professor-input";
    var input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Ask a question…";
    input.disabled = state.status === "loading";
    var submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "Ask";
    submit.disabled = state.status === "loading";
    form.appendChild(input);
    form.appendChild(submit);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      ask(input.value);
    });

    panel.appendChild(head);
    panel.appendChild(log);
    panel.appendChild(form);
    els.root.appendChild(panel);

    log.scrollTop = log.scrollHeight;
    input.focus();
  }

  function ask(rawQuestion) {
    var question = (rawQuestion || "").trim();
    if (!question || state.status === "loading") return;

    state.messages = state.messages.concat([{ role: "user", text: question }]);
    state.status = "loading";
    state.errorMsg = null;
    render();

    var selectedBody = window.__selectedBody || null;

    fetch(ASK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: question, selectedBody: selectedBody }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.error || "Request failed (" + res.status + ")");
          return data;
        });
      })
      .then(function (data) {
        state.messages = state.messages.concat([{ role: "assistant", text: data.answer || "" }]);
        state.status = "idle";
        render();
      })
      .catch(function (err) {
        state.status = "error";
        state.errorMsg = (err && err.message) || "Something went wrong reaching the Professor.";
        render();
      });
  }

  function init() {
    injectStyles();
    els.root = document.createElement("div");
    els.root.className = "professor";
    document.body.appendChild(els.root);

    state.selectedBody = window.__selectedBody || null;
    window.addEventListener("sol-census:selection", function (e) {
      state.selectedBody = e.detail || null;
      render();
    });

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
