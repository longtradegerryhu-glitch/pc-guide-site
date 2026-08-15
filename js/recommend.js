/* ===========================================================
 * recommend.js — 配件筛选 + 搭配计划渲染 + 个性化测评
 * 依赖：data.js（window.PC_DATA）
 * =========================================================== */
(function () {
  "use strict";

  var D = window.PC_DATA;
  if (!D) return;

  var useLabels = { office: "办公学习", game: "游戏电竞", create: "内容创作", portable: "移动便携" };
  var useIcons = { office: "💼", game: "🎮", create: "🎬", portable: "💻" };
  var budgetOrder = { b1: 3000, b2: 6000, b3: 10000, b4: 20000 };

  function fmtPrice(p) {
    if (!p) return "随行情";
    if (p[0] === 0 && p[1] === 0) return "随主板";
    return "¥" + p[0] + " - " + p[1];
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* =========================================================
   * 一、配件价格库（#accessories）：品类/场景/预算 筛选 + 卡片
   * ========================================================= */
  function initAccessories() {
    var wrap = document.getElementById("accWrap");
    var catRow = document.getElementById("accCats");
    var sceneRow = document.getElementById("accScenes");
    var budgetRow = document.getElementById("accBudget");
    var countEl = document.getElementById("accCount");
    if (!wrap || !catRow || !sceneRow || !budgetRow) return;

    var state = { cat: "all", scene: "all", budget: "all" };

    function matchesBudget(item, budget) {
      if (budget === "all") return true;
      var mid = (item.price[0] + item.price[1]) / 2;
      if (budget === "cheap") return mid <= 200;
      if (budget === "mid") return mid > 200 && mid <= 600;
      if (budget === "high") return mid > 600;
      return true;
    }

    function renderChips(row, items, key, onClick) {
      row.innerHTML = items.map(function (it) {
        var active = state[key] === it.id ? " active" : "";
        return '<button class="chip' + active + '" data-id="' + it.id + '">' + it.label + "</button>";
      }).join("");
      row.querySelectorAll(".chip").forEach(function (b) {
        b.addEventListener("click", function () {
          state[key] = b.getAttribute("data-id");
          renderChips(row, items, key, onClick);
          renderCards();
        });
      });
    }

    function renderCards() {
      var list = [];
      D.categories.forEach(function (cat) {
        if (state.cat !== "all" && cat.id !== state.cat) return;
        cat.items.forEach(function (item) {
          if (state.scene !== "all" && item.use.indexOf(state.scene) === -1) return;
          if (!matchesBudget(item, state.budget)) return;
          list.push({ cat: cat, item: item });
        });
      });

      countEl.textContent = "共 " + list.length + " 款（" + D.updated + " 行情）";

      if (!list.length) {
        wrap.innerHTML = '<div class="empty-box">没有匹配项，换个筛选条件试试。</div>';
        return;
      }

      wrap.innerHTML = list.map(function (o) {
        var it = o.item;
        var tags = (it.tags || []).map(function (t) {
          return '<span class="tag-pill">' + t + "</span>";
        }).join("");
        var uses = (it.use || []).map(function (u) {
          return '<span class="use-dot" title="' + useLabels[u] + '">' + useIcons[u] + "</span>";
        }).join("");
        var stars = "★★★★★".slice(0, it.rating) + "☆☆☆☆☆".slice(0, 5 - it.rating);
        return (
          '<article class="acc-card reveal in">' +
            '<div class="acc-head">' +
              '<div><span class="acc-cat">' + o.cat.icon + " " + esc(o.cat.name) + "</span>" +
              "<h4 class=\"acc-name\">" + esc(it.name) + "</h4></div>" +
              '<span class="acc-price">' + fmtPrice(it.price) + "</span>" +
            "</div>" +
            '<div class="acc-specs">' + esc(it.specs) + "</div>" +
            '<div class="acc-meta">' +
              '<span class="acc-style">' + esc(it.style) + "</span>" +
              '<span class="acc-rating" title="推荐度 ' + it.rating + "/5\">" + stars + "</span>" +
              uses +
            "</div>" +
            '<div class="acc-tags">' + tags + "</div>" +
            '<div class="acc-compat">搭配：' + esc(it.compat) + "</div>" +
          "</article>"
        );
      }).join("");
    }

    renderChips(catRow,
      [{ id: "all", label: "全部品类" }].concat(D.categories.map(function (c) {
        return { id: c.id, label: c.icon + " " + c.name };
      })),
      "cat");
    renderChips(sceneRow,
      [{ id: "all", label: "全部场景" }].concat(Object.keys(useLabels).map(function (k) {
        return { id: k, label: useLabels[k] };
      })),
      "scene");
    renderChips(budgetRow,
      [
        { id: "all", label: "全部预算" },
        { id: "cheap", label: "≤200 元" },
        { id: "mid", label: "200-600 元" },
        { id: "high", label: "600 元+" }
      ],
      "budget");
    renderCards();
  }

  /* =========================================================
   * 二、搭配计划（#plans）
   * ========================================================= */
  function initPlans() {
    var wrap = document.getElementById("plansWrap");
    if (!wrap) return;

    // 人群画像速览
    var pWrap = document.getElementById("personasWrap");
    if (pWrap) {
      pWrap.innerHTML = D.personas.map(function (p) {
        return (
          '<article class="card persona-card reveal">' +
            '<div class="card-icon">' + p.icon + "</div>" +
            '<h3 class="card-title">' + esc(p.name) + "</h3>" +
            "<p class=\"card-text\">" + esc(p.desc) + "</p>" +
          "</article>"
        );
      }).join("");
    }

    wrap.innerHTML = D.plans.map(function (pl) {
      var personas = (pl.personas || []).map(function (pid) {
        var p = D.personas.filter(function (x) { return x.id === pid; })[0];
        return p ? '<span class="tag-pill">' + p.icon + " " + p.name + "</span>" : "";
      }).join("");
      var rows = (pl.parts || []).map(function (r) {
        return "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td><td class=\"plan-price\">" + esc(r[2]) + "</td></tr>";
      }).join("");
      return (
        '<article class="plan-card reveal in">' +
          '<div class="plan-head">' +
            '<span class="plan-icon">' + pl.icon + "</span>" +
            '<div><h3 class="plan-name">' + esc(pl.name) + "</h3>" +
            '<span class="plan-budget">参考预算 ' + fmtPrice(pl.price) + "</span></div>" +
          "</div>" +
          "<p class=\"plan-summary\">" + esc(pl.summary) + "</p>" +
          '<div class="plan-personas">' + personas + "</div>" +
          '<table class="plan-table"><thead><tr><th>部件</th><th>推荐</th><th>参考价</th></tr></thead><tbody>' + rows + "</tbody></table>" +
          '<p class="plan-tip">💡 ' + esc(pl.tip) + "</p>" +
        "</article>"
      );
    }).join("");
  }

  /* =========================================================
   * 三、个性化测评（#quiz）：问答 → 生成方案
   * ========================================================= */
  function initQuiz() {
    var box = document.getElementById("quizBox");
    if (!box) return;

    var answers = {}; // { qid: [optionIds] }
    var steps = D.quiz;

    function render() {
      box.innerHTML = steps.map(function (q, qi) {
        var opts = q.options.map(function (o) {
          var sel = answers[q.id] && answers[q.id].indexOf(o.id) > -1 ? " selected" : "";
          return (
            '<button class="q-opt' + sel + '" data-q="' + q.id + '" data-o="' + o.id + '">' +
              '<span class="q-opt-label">' + o.label + "</span>" +
              '<span class="q-opt-desc">' + esc(o.desc) + "</span>" +
            "</button>"
          );
        }).join("");
        var stepBadge = '<span class="q-step">' + (qi + 1) + "/" + steps.length + "</span>";
        return (
          '<div class="quiz-step" data-step="' + q.id + '">' +
            '<div class="q-title">' + stepBadge + " " + esc(q.title) + "</div>" +
            '<div class="q-opts" data-multi="' + (q.multi ? "1" : "0") + '">' + opts + "</div>" +
          "</div>"
        );
      }).join("") +
      '<button class="btn btn-primary q-submit" id="quizSubmit">生成我的方案</button>';

      box.querySelectorAll(".q-opt").forEach(function (b) {
        b.addEventListener("click", function () {
          var qid = b.getAttribute("data-q");
          var oid = b.getAttribute("data-o");
          var multi = b.parentNode.getAttribute("data-multi") === "1";
          if (!answers[qid]) answers[qid] = [];
          if (multi) {
            var i = answers[qid].indexOf(oid);
            if (i > -1) answers[qid].splice(i, 1); else answers[qid].push(oid);
          } else {
            answers[qid] = [oid];
          }
          render();
        });
      });

      var submit = document.getElementById("quizSubmit");
      if (submit) submit.addEventListener("click", generate);
    }

    function answerOf(qid) {
      return answers[qid] || [];
    }

    function generate() {
      var use = answerOf("use");
      var budget = answerOf("budget")[0] || "b2";
      var form = answerOf("form")[0] || "desktop";
      var pref = answerOf("pref")[0] || "value";
      var focus = answerOf("focus");

      if (!use.length) {
        box.innerHTML = '<div class="empty-box">请至少选择一项「主要用途」再生成方案。</div>';
        render(); // 恢复可交互
        return;
      }
      if (!focus.length) {
        // 未选升级重点时按用途推断默认
        if (use.indexOf("portable") > -1) focus = ["stand", "dock", "cooler"];
        else if (use.indexOf("game") > -1) focus = ["monitor", "input", "cooler"];
        else if (use.indexOf("create") > -1) focus = ["monitor", "input", "audio"];
        else focus = ["monitor", "stand", "input"];
      }

      var budgetCap = budgetOrder[budget];

      // 1) 基础整机方案
      var plan = pickPlan(use, form, budgetCap);

      // 2) 个性化配件推荐
      var picks = focus.map(function (catId) {
        return pickItems(catId, use, pref, budgetCap, plan);
      }).filter(Boolean);

      var totalLow = plan ? plan.price[0] : 0;
      var totalHigh = plan ? plan.price[1] : 0;
      picks.forEach(function (p) {
        totalLow += p.item.price[0];
        totalHigh += p.item.price[1];
      });

      // 3) 人群画像
      var personaIds = use.map(function (u) {
        if (u === "office") return "office";
        if (u === "game") return "gamer";
        if (u === "create") return "creator";
        if (u === "portable") return "mobile";
      });
      var personas = personaIds.map(function (pid) {
        var p = D.personas.filter(function (x) { return x.id === pid; })[0];
        return p ? '<span class="tag-pill big">' + p.icon + " " + esc(p.name) + "</span>" : "";
      }).join("");

      var picksHtml = picks.map(function (p) {
        var item = p.item;
        var cat = p.cat;
        return (
          '<div class="pick-item">' +
            '<span class="pick-icon">' + cat.icon + "</span>" +
            '<div class="pick-main"><span class="pick-name">' + esc(item.name) + "</span>" +
            '<span class="pick-why">' + esc(p.why) + "</span></div>" +
            '<span class="pick-price">' + fmtPrice(item.price) + "</span>" +
          "</div>"
        );
      }).join("");

      var planHtml = plan
        ? '<div class="res-plan">' + plan.icon + " <b>" + esc(plan.name) + "</b> —— " + esc(plan.summary) +
          ' <span class="res-budget">参考 ' + fmtPrice(plan.price) + "</span></div>"
        : '<div class="res-plan">未匹配到整机方案，请参考「搭配计划」板块。</div>';

      box.innerHTML =
        '<div class="result-box reveal in">' +
          '<h3 class="result-title">🎯 你的个性化方案</h3>' +
          '<div class="result-persona"><span class="res-label">适合人群</span>' + personas + "</div>" +
          planHtml +
          '<div class="res-section"><span class="res-label">外设/配件推荐（按你的升级重点）</span>' +
            (picksHtml || '<div class="empty-box">暂无匹配配件。</div>') +
          "</div>" +
          '<div class="res-total">整体投入参考：<b>' + fmtPrice([totalLow, totalHigh]) + "</b>（整机 + 所选配件）</div>" +
          '<div class="res-note">' + esc(D.note) + "。方案为规则推荐，购机前请复核接口兼容性与电商实时价。</div>" +
          '<button class="btn btn-ghost q-reset">重新测评</button>' +
        "</div>";

      var reset = box.querySelector(".q-reset");
      if (reset) reset.addEventListener("click", function () {
        answers = {};
        render();
      });
    }

    function pickPlan(use, form, budgetCap) {
      var candidates = D.plans.filter(function (pl) {
        if (form === "laptop" && pl.form.indexOf("laptop") === -1 && pl.form.indexOf("both") === -1) return false;
        if (form === "desktop" && pl.form.indexOf("desktop") === -1) return false;
        var hit = pl.uses.some(function (u) { return use.indexOf(u) > -1; });
        return hit;
      });
      if (!candidates.length) return null;
      // 预算匹配优先，其次取第一个
      var exact = candidates.filter(function (pl) { return pl.price[1] <= budgetCap * 1.15; });
      var pool = exact.length ? exact : candidates;
      return pool.reduce(function (best, pl) {
        var score = pl.uses.filter(function (u) { return use.indexOf(u) > -1; }).length;
        var bestScore = best ? best.uses.filter(function (u) { return use.indexOf(u) > -1; }).length : -1;
        return score > bestScore ? pl : best;
      }, pool[0]);
    }

    function pickItems(catId, use, pref, budgetCap, plan) {
      var cat = D.categories.filter(function (c) { return c.id === catId; })[0];
      if (!cat) return null;
      var allowance = catId === "monitor" ? budgetCap * 0.4 : budgetCap * 0.22;
      if (catId === "cooler" && use.indexOf("portable") === -1) allowance = Math.max(allowance, 600);

      var scored = cat.items.map(function (it) {
        var s = 0;
        // 场景匹配
        it.use.forEach(function (u) { if (use.indexOf(u) > -1) s += 3; });
        // 人群匹配
        it.audience.forEach(function (a) {
          var pids = use.map(function (u) {
            return u === "office" ? "office" : u === "game" ? "gamer" : u === "create" ? "creator" : "mobile";
          });
          if (pids.indexOf(a) > -1) s += 2;
        });
        // 预算匹配
        var mid = (it.price[0] + it.price[1]) / 2;
        if (mid <= allowance) s += 2; else if (mid <= allowance * 1.8) s += 1; else s -= 1;
        // 偏好加成
        if (pref === "quiet" && it.tags.indexOf("静音") > -1) s += 2;
        if (pref === "rgb" && it.tags.indexOf("RGB") > -1) s += 2;
        if (pref === "ergo" && it.tags.indexOf("人体工学") > -1) s += 2;
        if (pref === "value" && it.tags.indexOf("高性价比") > -1) s += 1;
        s += it.rating * 0.5;
        return { item: it, score: s };
      }).sort(function (a, b) { return b.score - a.score; });

      var top = scored[0];
      if (!top || top.score <= 0) return null;

      var why = "推荐理由：";
      var reasons = [];
      var hitUse = top.item.use.filter(function (u) { return use.indexOf(u) > -1; });
      if (hitUse.length) reasons.push("契合" + hitUse.map(function (u) { return useLabels[u]; }).join("/") + "场景");
      var mid = (top.item.price[0] + top.item.price[1]) / 2;
      if (mid <= (catId === "monitor" ? budgetCap * 0.4 : budgetCap * 0.22)) reasons.push("在预算内");
      if (pref === "quiet" && top.item.tags.indexOf("静音") > -1) reasons.push("静音调校好");
      if (pref === "rgb" && top.item.tags.indexOf("RGB") > -1) reasons.push("RGB 灯效");
      if (pref === "ergo" && top.item.tags.indexOf("人体工学") > -1) reasons.push("符合人体工学");
      if (top.item.rating >= 5) reasons.push("推荐度满分");
      if (!reasons.length) reasons.push("综合性价比高");
      why += reasons.join("，") + "。" + top.item.specs;

      return { cat: cat, item: top.item, why: why };
    }

    render();
  }

  /* ---- 启动 ---- */
  function boot() {
    initAccessories();
    initPlans();
    initQuiz();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
