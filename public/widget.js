/* DocsChat embed widget - add <script src="https://YOUR-DOMAIN/widget.js" defer></script> to any page.
   A floating button opens the /chat page in an iframe panel. Escape closes it; under 480px wide the panel is full-screen. */
(function () {
  if (window.__docschatWidget) return;
  var script = document.currentScript || document.querySelector('script[src*="widget.js"]');
  var origin;
  try { origin = new URL(script.src).origin; } catch (e) { return; }
  window.__docschatWidget = true;

  var PRIMARY = "#4F46E5", PRIMARY_HOVER = "#4338CA", SHADOW = "0 8px 24px rgba(15,23,42,.18), 0 1px 2px rgba(15,23,42,.08)";
  var NS = "http://www.w3.org/2000/svg";
  var mobile = window.matchMedia("(max-width: 480px)");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var open = false, loaded = false, previousOverflow = "";

  function set(el, styles) { for (var k in styles) el.style[k] = styles[k]; }
  function icon(paths) {
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "26");
    svg.setAttribute("height", "26");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "#fff");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    set(svg, { display: "block", pointerEvents: "none" });
    paths.forEach(function (d) {
      var p = document.createElementNS(NS, "path");
      p.setAttribute("d", d);
      svg.appendChild(p);
    });
    return svg;
  }
  var chatIcon = icon(["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"]);
  var closeIcon = icon(["M18 6 6 18", "m6 6 12 12"]);

  var btn = document.createElement("button");
  btn.type = "button";
  btn.id = "docschat-launcher";
  btn.title = "Chat with us";
  btn.setAttribute("aria-label", "Open chat");
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", "docschat-panel");
  btn.appendChild(chatIcon);
  set(btn, {
    position: "fixed", right: "20px", bottom: "20px", width: "56px", height: "56px", padding: "0", margin: "0",
    display: "flex", alignItems: "center", justifyContent: "center", border: "0", borderRadius: "12px",
    background: PRIMARY, color: "#fff", cursor: "pointer", boxShadow: SHADOW, zIndex: "2147483646",
    transition: "background-color .15s ease, transform .15s ease", outline: "none"
  });

  var frame = document.createElement("iframe");
  frame.id = "docschat-panel";
  frame.title = "Chat assistant";
  frame.setAttribute("aria-hidden", "true");
  set(frame, {
    position: "fixed", right: "20px", bottom: "88px", width: "380px", maxWidth: "calc(100vw - 40px)",
    height: "600px", maxHeight: "calc(100vh - 108px)", border: "1px solid #E2E8F0", borderRadius: "12px",
    boxShadow: SHADOW, background: "#fff", zIndex: "2147483647", colorScheme: "light", boxSizing: "border-box",
    visibility: "hidden", opacity: "0", transform: "translateY(8px)"
  });

  function layout() {
    var m = mobile.matches;
    var t = reduceMotion.matches ? "none" : "opacity .18s ease, transform .18s ease, visibility .18s";
    frame.style.transition = t;
    if (m) {
      set(frame, { top: "0", left: "0", right: "0", bottom: "0", width: "100%", maxWidth: "none", height: "100%", maxHeight: "none", border: "0", borderRadius: "0" });
    } else {
      set(frame, { top: "auto", left: "auto", right: "20px", bottom: "88px", width: "380px", maxWidth: "calc(100vw - 40px)", height: "600px", maxHeight: "calc(100vh - 108px)", border: "1px solid #E2E8F0", borderRadius: "12px" });
    }
    // On phones the panel covers the screen, so the launcher hides and the chat header shows its own close button.
    btn.style.display = m && open ? "none" : "flex";
  }

  function load() {
    if (loaded) return;
    loaded = true;
    frame.src = origin + "/chat";
  }

  function render() {
    set(frame, open
      ? { visibility: "visible", opacity: "1", transform: "translateY(0)" }
      : { visibility: "hidden", opacity: "0", transform: "translateY(8px)" });
    frame.setAttribute("aria-hidden", open ? "false" : "true");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.setAttribute("aria-label", open ? "Close chat" : "Open chat");
    btn.title = open ? "Close chat" : "Chat with us";
    btn.replaceChild(open ? closeIcon : chatIcon, open ? chatIcon : closeIcon);
    if (mobile.matches) {
      // Stop the page behind the full-screen panel from scrolling.
      if (open) { previousOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = "hidden"; }
      else { document.documentElement.style.overflow = previousOverflow; }
    }
    layout();
  }

  // Move keyboard focus into the chat so Tab and typing work straight away (the page is cross-origin, so this targets the frame window).
  function focusPanel() {
    setTimeout(function () { try { frame.contentWindow.focus(); } catch (e) {} }, 60);
  }
  frame.addEventListener("load", function () { if (open) focusPanel(); });

  function setOpen(next, restoreFocus) {
    if (next === open) return;
    open = next;
    if (open) load();
    render();
    if (open) focusPanel();
    else if (restoreFocus) btn.focus();
  }

  btn.addEventListener("click", function () { setOpen(!open, true); });
  btn.addEventListener("mouseenter", function () { load(); set(btn, { background: PRIMARY_HOVER }); });
  btn.addEventListener("mouseleave", function () { set(btn, { background: PRIMARY }); });
  btn.addEventListener("focus", function () {
    load();
    if (btn.matches(":focus-visible")) set(btn, { outline: "2px solid " + PRIMARY, outlineOffset: "3px" });
  });
  btn.addEventListener("blur", function () { set(btn, { outline: "none" }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) setOpen(false, true); });
  // The chat page posts this when its own close button or Escape key is used inside the iframe.
  window.addEventListener("message", function (e) {
    if (e.source === frame.contentWindow && e.data && e.data.type === "docschat:close") setOpen(false, true);
  });
  var onChange = function () { if (!mobile.matches) document.documentElement.style.overflow = previousOverflow; layout(); };
  if (mobile.addEventListener) { mobile.addEventListener("change", onChange); reduceMotion.addEventListener("change", layout); }
  else if (mobile.addListener) { mobile.addListener(onChange); reduceMotion.addListener(layout); }

  function mount() {
    // Button first, so Tab from the launcher continues into the open panel.
    document.body.appendChild(btn);
    document.body.appendChild(frame);
    layout();
  }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
})();
