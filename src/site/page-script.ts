/**
 * The front page's only script: copy buttons, and "Run it live", which sends the recorded call to this server's own
 * /mcp and says whether the answer matches the recording. Same origin, no other request. The page works without it:
 * the recorded answer is plain HTML and the console motion is CSS.
 *
 * __RECORDED__ and __ARGUMENTS__ are replaced with JSON from RECORDED_CALL in front-page.ts, so the call exists once.
 */

export const PAGE_SCRIPT_TEMPLATE = String.raw`(function () {
  "use strict";
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The copy buttons and "Run it live" need this script: shown only once it runs.
  Array.prototype.forEach.call(document.querySelectorAll("[data-copy], #run-live"), function (button) {
    button.hidden = false;
  });

  // Copy buttons: the clipboard API on a secure page, a hidden textarea elsewhere.
  var copyStatus = document.getElementById("copy-status");
  function copyText(text, done, fail) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { legacy(text, done, fail); });
    } else {
      legacy(text, done, fail);
    }
  }
  function legacy(text, done, fail) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    var copied = false;
    try { copied = document.execCommand("copy"); } catch (e) { copied = false; }
    document.body.removeChild(area);
    if (copied) done(); else fail();
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-copy]"), function (button) {
    button.addEventListener("click", function () {
      copyText(button.getAttribute("data-copy"), function () {
        window.clearTimeout(button._reset);
        button.setAttribute("data-state", "done");
        if (copyStatus) copyStatus.textContent = button.getAttribute("data-copied") || "Copied";
        button._reset = window.setTimeout(function () { button.removeAttribute("data-state"); }, 1600);
      }, function () {
        if (copyStatus) copyStatus.textContent = "Copy failed. Select the text and copy it by hand.";
      });
    });
  });

  // The console resolves the call on load (CSS); a live run plays it again.
  var consoleModule = document.getElementById("console");
  function replay() {
    if (calm || !consoleModule) return;
    consoleModule.classList.remove("run");
    void consoleModule.offsetWidth;
    consoleModule.classList.add("run");
  }

  // Run it live: the recorded call against this server, compared field by field with the recording.
  var RECORDED = __RECORDED__;
  var ARGS = __ARGUMENTS__;
  var runButton = document.getElementById("run-live");
  var liveStatus = document.getElementById("live-status");
  function say(message, tone) {
    if (!liveStatus) return;
    liveStatus.textContent = message;
    if (tone) liveStatus.setAttribute("data-tone", tone); else liveStatus.removeAttribute("data-tone");
  }
  // The first JSON-RPC message of an SSE stream (data lines joined per event) or of a plain JSON body.
  function firstMessage(text) {
    var events = text.split(/\r?\n\r?\n/);
    for (var i = 0; i < events.length; i++) {
      var data = events[i].split(/\r?\n/).filter(function (line) { return line.indexOf("data:") === 0; })
        .map(function (line) { return line.slice(5).replace(/^ /, ""); }).join("\n");
      var candidate = (data || events[i]).trim();
      if (candidate.charAt(0) !== "{") continue;
      try { return JSON.parse(candidate); } catch (e) { /* try the next event */ }
    }
    return null;
  }
  if (runButton) {
    runButton.addEventListener("click", function () {
      // aria-disabled, not disabled: a disabled button would drop the keyboard focus to the page.
      if (runButton.getAttribute("aria-disabled") === "true") return;
      runButton.setAttribute("aria-disabled", "true");
      say("Calling " + RECORDED.tool + " on this server.");
      var stop = "AbortController" in window ? new AbortController() : null;
      var timer = window.setTimeout(function () { if (stop) stop.abort(); }, 15000);
      fetch("/mcp", {
        method: "POST",
        signal: stop ? stop.signal : undefined,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "MCP-Protocol-Version": "2025-06-18"
        },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call",
          params: { name: RECORDED.tool, arguments: ARGS } })
      }).then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.text();
      }).then(function (text) {
        var message = firstMessage(text);
        var result = message && message.result;
        var answer = result && result.structuredContent;
        var first = result && result.content && result.content[0];
        if (!answer && first && first.type === "text") { try { answer = JSON.parse(first.text); } catch (e) { answer = null; } }
        if (!answer) throw new Error("no result");
        var differs = [];
        ["risk_classification", "confidence", "basis"].forEach(function (field) {
          if (answer[field] !== RECORDED.response[field]) differs.push(field);
        });
        if (JSON.stringify(answer.relevant_articles) !== JSON.stringify(RECORDED.response.relevant_articles)) differs.push("relevant_articles");
        var category = answer.annex_iii_category;
        var number = category && typeof category === "object" ? category.number : parseInt(category, 10);
        if (Number(number) !== RECORDED.response.annex_iii_category.number) differs.push("annex_iii_category");
        replay();
        if (differs.length === 0) say("Live answer from this server: identical to the recording.", "good");
        else say("Live answer differs from the recording in " + differs.join(", ") + ".", "bad");
      }).catch(function (error) {
        var reason = error && error.name === "AbortError" ? "no answer within 15 seconds" : error.message;
        say("The live call did not complete (" + reason + "). The recorded answer stays as shown.", "bad");
      }).then(function () {
        window.clearTimeout(timer);
        runButton.removeAttribute("aria-disabled");
      });
    });
  }
})();`;
