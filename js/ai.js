/* ===========================================================
 * ai.js — 全站 AI 问答
 * 自注入：顶部导航项「AI 问答」+ 右下角悬浮按钮 + 聊天面板
 * 后端：POST /api/chat（EdgeOne 云函数，代理 AI Gateway，流式 SSE）
 * =========================================================== */
(function () {
  "use strict";

  var API = "/api/chat";
  var MAX_SEND = 12; /* 随请求携带的历史条数 */
  var HOT = [
    "5000 预算怎么配？",
    "显卡和 CPU 哪个优先？",
    "内存、固态涨价了怎么省？",
    "笔记本要配哪些外设？"
  ];
  var JUMPS = [
    ["/accessories.html", "配件与榜单"],
    ["/plans.html", "搭配计划"],
    ["/smart.html", "智能推荐"],
    ["/faq.html", "常见问题"]
  ];

  var history = [];      /* 会话上下文：{ role, content } */
  var controller = null; /* 当前流式请求 */
  var busy = false;
  var started = false;

  var panel, msgBody, input, sendBtn, fab, navBtn;

  /* ---------- 工具 ---------- */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* 站内页面白名单：可选前导斜杠、字母数字连字符、可选 .html、可带筛选参数、可选 #锚点。
     注意 md() 先转义再匹配，URL 里的 & 已变成 &amp;，所以字符集要含 ; 与中文（q=显卡）。 */
  var OK_HREF = /^\/?[a-z0-9_-]+(\.html)?(\?[A-Za-z0-9_=&%.,;:+\-\u4e00-\u9fa5]*)?(#[\w-]+)?$/i;

  /* 极简 Markdown：先整体转义再放行少量语法；链接只允许站内页面，统一归一化为绝对路径 */
  function md(text) {
    var h = esc(text);
    h = h.replace(/https?:\/\/(?:www\.)?pc-guide\.icu/gi, "");
    h = h.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, function (m, t, u) {
      if (!OK_HREF.test(u) || u.charAt(0) === "#") return t;
      var href = u.charAt(0) === "/" ? u : "/" + u;
      return '<a class="ai-link" href="' + href + '">' + t + "</a>";
    });
    h = h.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
    h = h.replace(/`([^`\n]+)`/g, "<code>$1</code>");
    h = h.replace(/^[-*]\s+(.+)$/gm, '<span class="ai-li">$1</span>');
    h = h.replace(/\n{2,}/g, "<br><br>").replace(/\n/g, "<br>");
    return h;
  }

  function scrollToEnd() {
    msgBody.scrollTop = msgBody.scrollHeight;
  }

  /* ---------- 消息 ---------- */
  function pushMsg(role, text) {
    var row = el("div", "ai-msg ai-msg-" + (role === "user" ? "user" : "bot"));
    var bubble = el("div", "ai-bubble");
    bubble.innerHTML = role === "user" ? esc(text) : md(text);
    row.appendChild(bubble);
    msgBody.appendChild(row);
    scrollToEnd();
    return bubble;
  }

  function welcome() {
    msgBody.innerHTML = "";
    started = false;
    var row = el("div", "ai-msg ai-msg-bot");
    var jumps = JUMPS.map(function (j) {
      return '<a class="ai-jump-link" href="' + j[0] + '">' + j[1] + " →</a>";
    }).join("");
    row.innerHTML =
      '<div class="ai-bubble">' +
        "<p>我是站内装机助手。说说预算和用途，我给你配机思路、对比型号、解释参数。</p>" +
        '<div class="ai-jump">' + jumps + "</div>" +
      "</div>";
    msgBody.appendChild(row);
  }

  /* ---------- 状态 ---------- */
  function setBusy(v) {
    busy = v;
    sendBtn.textContent = v ? "停止" : "发送";
    sendBtn.classList.toggle("is-stop", v);
  }

  function openPanel() {
    if (!panel) return;
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    if (fab) fab.classList.add("is-open");
    if (window.innerWidth > 760) {
      setTimeout(function () { try { input.focus(); } catch (e) {} }, 40);
    }
  }

  function closePanel() {
    if (!panel) return;
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    if (fab) fab.classList.remove("is-open");
  }

  /* ---------- SSE 读取 ---------- */
  function readStream(body, onDelta) {
    var reader = body.getReader();
    var dec = new TextDecoder();
    var buf = "";

    function frame(chunk) {
      var lines = chunk.split("\n");
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line.indexOf("data:") !== 0) continue;
        var data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          var obj = JSON.parse(data);
          var delta = obj.choices && obj.choices[0] && obj.choices[0].delta;
          if (delta && delta.content) onDelta(delta.content);
        } catch (e) { /* 半帧或心跳，忽略 */ }
      }
    }

    function pump() {
      return reader.read().then(function (r) {
        if (r.done) return;
        buf += dec.decode(r.value, { stream: true });
        var parts = buf.split("\n\n");
        buf = parts.pop();
        for (var i = 0; i < parts.length; i++) frame(parts[i]);
        return pump();
      });
    }
    return pump();
  }

  /* ---------- 提问 ---------- */
  function submit(text) {
    if (busy) return;
    openPanel();
    if (!started) { msgBody.innerHTML = ""; started = true; }

    history.push({ role: "user", content: text });
    pushMsg("user", text);

    var bubble = pushMsg("assistant", "");
    bubble.classList.add("ai-typing");
    setBusy(true);

    controller = new AbortController();
    var acc = "";

    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history.slice(-MAX_SEND) }),
      signal: controller.signal
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().catch(function () { return {}; }).then(function (j) {
            throw new Error(j.message || ("请求失败（" + res.status + "）"));
          });
        }
        return readStream(res.body, function (delta) {
          acc += delta;
          bubble.classList.remove("ai-typing");
          bubble.innerHTML = md(acc);
          scrollToEnd();
        });
      })
      .then(function () {
        if (acc) {
          history.push({ role: "assistant", content: acc });
        } else {
          bubble.classList.remove("ai-typing");
          bubble.innerHTML = '<span class="ai-err">没收到回复，请再试一次。</span>';
        }
      })
      .catch(function (err) {
        bubble.classList.remove("ai-typing");
        if (err && err.name === "AbortError") {
          if (acc) history.push({ role: "assistant", content: acc });
          else bubble.innerHTML = '<span class="ai-err">已停止。</span>';
          return;
        }
        var msg = err && err.message ? err.message : "出了点问题，请稍后重试。";
        bubble.innerHTML = '<span class="ai-err">' + esc(msg) + "</span>";
        if (/未就绪|凭据|不可用|繁忙/.test(msg)) {
          bubble.innerHTML += '<br><br>AI 服务暂时不可用，可以先从这些入口找答案：' +
            '<br>· <a class="ai-link" href="/accessories.html">配件与榜单</a>（15 类 567 款型号，可按品类/价位筛选）' +
            '<br>· <a class="ai-link" href="/smart.html">智能推荐</a>（6 题快速推荐 / 10 题深度测评）' +
            '<br>· <a class="ai-link" href="/plans.html">搭配计划</a>（6 档整机方案）' +
            '<br>· <a class="ai-link" href="/guide.html">使用指南</a> · <a class="ai-link" href="/faq.html">常见问题</a>';
        }
      })
      .then(function () {
        setBusy(false);
        controller = null;
      });
  }

  function stop() {
    if (controller) controller.abort();
  }

  function onSend() {
    if (busy) { stop(); return; }
    var v = input.value.trim();
    if (!v) return;
    input.value = "";
    autoGrow();
    submit(v);
  }

  function autoGrow() {
    if (!input) return;
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
  }

  /* ---------- 结构注入 ---------- */
  function buildPanel() {
    panel = el("div", "ai-panel");
    panel.id = "aiPanel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "AI 问答");
    panel.setAttribute("aria-hidden", "true");

    var head = el("div", "ai-head");
    var main = el("div", "ai-head-main");
    main.appendChild(el("span", "ai-head-icon", "✨"));
    var txt = el("div", "ai-head-text");
    txt.appendChild(el("strong", "", "AI 装机助手"));
    txt.appendChild(el("span", "ai-head-sub", "基于站内 567 款型号与 10 套配置单"));
    main.appendChild(txt);

    var close = el("button", "ai-close", "×");
    close.type = "button";
    close.setAttribute("aria-label", "关闭 AI 问答");
    close.addEventListener("click", closePanel);

    head.appendChild(main);
    head.appendChild(close);

    msgBody = el("div", "ai-body");
    msgBody.id = "aiBody";

    var hot = el("div", "ai-hot");
    HOT.forEach(function (q) {
      var chip = el("button", "ai-hot-chip", esc(q));
      chip.type = "button";
      chip.addEventListener("click", function () { submit(q); });
      hot.appendChild(chip);
    });

    var form = el("form", "ai-foot");
    input = el("textarea", "ai-input");
    input.rows = 1;
    input.maxLength = 500;
    input.placeholder = "问点什么，比如：6000 预算怎么配？";
    input.setAttribute("aria-label", "输入问题");

    sendBtn = el("button", "ai-send", "发送");
    sendBtn.type = "submit";

    form.appendChild(input);
    form.appendChild(sendBtn);
    form.addEventListener("submit", function (e) { e.preventDefault(); onSend(); });

    input.addEventListener("input", autoGrow);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
    });

    panel.appendChild(head);
    panel.appendChild(msgBody);
    panel.appendChild(hot);
    panel.appendChild(form);
    document.body.appendChild(panel);
  }

  function makeFab() {
    fab = el("button", "ai-fab", '<span class="ai-fab-icon">✨</span><span class="ai-fab-text">AI 问答</span>');
    fab.type = "button";
    fab.setAttribute("aria-label", "打开 AI 问答");
    fab.addEventListener("click", function () {
      if (panel.classList.contains("open")) closePanel();
      else openPanel();
    });
    document.body.appendChild(fab);
  }

  function injectNav() {
    var nav = document.getElementById("navLinks");
    if (!nav) return;
    navBtn = el("button", "nav-link nav-ai", "AI 问答");
    navBtn.type = "button";
    navBtn.addEventListener("click", function () {
      openPanel();
      if (window.innerWidth <= 760) {
        nav.classList.remove("open");
        var t = document.getElementById("navToggle");
        if (t) t.setAttribute("aria-expanded", "false");
      }
    });
    nav.appendChild(navBtn);
  }

  function init() {
    buildPanel();
    makeFab();
    injectNav();
    welcome();

    /* 页面内任意位置：[data-ai-open] 打开面板，[data-ai-ask] 带着问题直接提问 */
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var askEl = t.closest("[data-ai-ask]");
      if (askEl) {
        e.preventDefault();
        var q = askEl.getAttribute("data-ai-ask");
        if (q) { openPanel(); submit(q); }
        return;
      }
      var openEl = t.closest("[data-ai-open]");
      if (openEl) {
        e.preventDefault();
        openPanel();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("open")) closePanel();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
