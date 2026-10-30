/* DocsChat embed widget - add <script src="https://YOUR-DOMAIN/widget.js" defer></script> to any page. */
(function () {
  var s = document.currentScript, origin = new URL(s.src).origin;
  var btn = document.createElement("button");
  btn.textContent = "\u{1F4AC}";
  btn.setAttribute("aria-label", "Open chat");
  btn.style.cssText = "position:fixed;right:20px;bottom:20px;width:58px;height:58px;border-radius:50%;border:0;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;font-size:26px;cursor:pointer;box-shadow:0 6px 18px rgba(79,70,229,.45);z-index:2147483646";
  var frame = document.createElement("iframe");
  frame.src = origin + "/chat";
  frame.title = "Chat assistant";
  frame.style.cssText = "position:fixed;right:20px;bottom:90px;width:380px;max-width:calc(100vw - 40px);height:560px;max-height:calc(100vh - 110px);border:0;border-radius:16px;box-shadow:0 12px 40px rgba(15,23,42,.3);display:none;z-index:2147483647;background:#fff";
  btn.onclick = function () {
    var open = frame.style.display === "none";
    frame.style.display = open ? "block" : "none";
    btn.setAttribute("aria-label", open ? "Close chat" : "Open chat");
  };
  document.body.appendChild(frame);
  document.body.appendChild(btn);
})();
