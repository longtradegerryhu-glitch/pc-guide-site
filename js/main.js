/* ===========================================================
   电脑使用指南与配套硬件总结 · 交互脚本
   功能：移动端菜单、FAQ 折叠、滚动高亮、进场动画
   =========================================================== */
(function () {
  "use strict";

  /* ---- 深色模式切换 ---- */
  var themeToggle = document.getElementById("themeToggle");
  var htmlEl = document.documentElement;

  function applyTheme(theme) {
    htmlEl.setAttribute("data-theme", theme);
    if (themeToggle) {
      themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
    }
  }

  if (themeToggle) {
    // 初始：本地存储 > 系统偏好
    var saved = null;
    try { saved = localStorage.getItem("theme"); } catch (e) {}
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved || (prefersDark ? "dark" : "light"));

    themeToggle.addEventListener("click", function () {
      var next = htmlEl.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  /* ---- 滚动进度条 ---- */
  var progress = document.getElementById("scrollProgress");
  function updateProgress() {
    if (!progress) return;
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    progress.style.width = pct + "%";
  }
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();

  /* ---- 移动端导航菜单 ---- */
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // 点击导航链接后自动收起菜单（移动端）
    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.innerWidth <= 760) {
          navLinks.classList.remove("open");
          navToggle.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  /* ---- FAQ 折叠 ---- */
  var faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(function (item) {
    var q = item.querySelector(".faq-q");
    var a = item.querySelector(".faq-a");
    if (!q || !a) return;

    q.addEventListener("click", function () {
      var isOpen = item.classList.toggle("open");
      q.setAttribute("aria-expanded", isOpen ? "true" : "false");
      a.style.maxHeight = isOpen ? a.scrollHeight + "px" : "0";
    });
  });

  /* ---- 滚动高亮当前 section 的导航项 ---- */
  var sections = document.querySelectorAll("main section[id], section[id]");
  var navAnchors = navLinks ? navLinks.querySelectorAll(".nav-link") : [];

  function setActive(id) {
    navAnchors.forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + id);
    });
  }

  if ("IntersectionObserver" in window && sections.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(function (s) { observer.observe(s); });
  }

  /* ---- 进场动画（reveal） ---- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var revealObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            obs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );
    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    // 不支持时直接显示
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- 回到顶部悬浮按钮 ---- */
  var backToTop = document.getElementById("backToTop");
  if (backToTop) {
    var toggleBackToTop = function () {
      backToTop.classList.toggle("show", window.scrollY > 400);
    };
    window.addEventListener("scroll", toggleBackToTop, { passive: true });
    toggleBackToTop();
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---- 面包屑导航（多页站，JS 按当前页面生成，免 9 页重复维护） ---- */
  var crumbPages = {
    "guide.html": "使用指南",
    "accessories.html": "配件与榜单",
    "plans.html": "搭配计划",
    "looks.html": "颜值外观",
    "smart.html": "智能推荐",
    "faq.html": "常见问题"
  };
  var curPage = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  var curLabel = crumbPages[curPage];
  var mainEl = document.querySelector("main");
  if (curLabel && mainEl) {
    var crumb = document.createElement("nav");
    crumb.className = "breadcrumb";
    crumb.setAttribute("aria-label", "面包屑");
    crumb.innerHTML =
      '<a href="index.html">首页</a>' +
      '<span class="crumb-sep" aria-hidden="true">›</span>' +
      '<span class="crumb-cur" aria-current="page">' + curLabel + "</span>";
    mainEl.parentNode.insertBefore(crumb, mainEl);
  }
})();
