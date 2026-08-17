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
  var audLabels = { student: "学生党", office: "办公族", gamer: "游戏党", creator: "创作者", mobile: "移动办公" };
  var audIcons = { student: "🎓", office: "💼", gamer: "🎮", creator: "🎬", mobile: "💻" };
  var gradeOrder = { S: 4, A: 3, B: 1, C: -1 };
  var budgetOrder = { b3000: 3000, b4500: 4500, b6000: 6000, b8500: 8500, b12000: 12000, b20000: 20000 };

  /* ---- 颜值风格（Aesthetics） ---- */
  var STYLES = window.PC_STYLES || [];
  var LOOKS = window.PC_LOOKS || {};
  var PRINCIPLES = window.PC_LOOK_PRINCIPLES || [];
  var PITFALLS = window.PC_LOOK_PITFALLS || [];
  var DETAILS = window.PC_LOOK_DETAILS || [];
  var TOP_IMG = window.PC_TOP_IMG || {};
  var styleById = {};
  STYLES.forEach(function (s) { styleById[s.id] = s; });
  function lookOf(item) { return (item && LOOKS[item.id]) || null; }

  /* 每个具体型号 → 跳转到真实产品图（百度图片 / 京东搜索该型号，不下载、不侵权） */
  function productImageLink(item) {
    if (!item || !item.name) return "";
    var n = item.name;
    var img = "https://image.baidu.com/search/index?tn=baiduimage&word=" + encodeURIComponent(n);
    var shop = "https://search.jd.com/Search?keyword=" + encodeURIComponent(n);
    return '<div class="prod-link">' +
      '<a class="prod-img-btn" href="' + img + '" target="_blank" rel="noopener noreferrer">' +
        '<span class="prod-ico">🔎</span>查看 ' + esc(n) + ' 真实产品图</a>' +
      '<a class="prod-shop" href="' + shop + '" target="_blank" rel="noopener noreferrer">京东 ›</a>' +
    '</div>';
  }
  function styleOf(id) { return styleById[id] || null; }
  function countByStyle(sid) {
    var n = 0;
    Object.keys(LOOKS).forEach(function (id) { if (LOOKS[id] === sid) n++; });
    return n;
  }

  /* ---- 合并真实型号数据（models.js） ---- */
  function mergeModels() {
    if (!window.PC_MODELS) return;
    D.categories.forEach(function (cat) {
      cat.items = window.PC_MODELS[cat.id] || [];
    });
  }

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

    var state = { cat: "all", scene: "all", look: "all", budget: "all", audience: "all", sort: "default" };

    // 跨页跳转：从颜值/测评页带 ?look=xxx 进来时，自动按该风格预筛选
    try {
      var _sp = new URLSearchParams(window.location.search);
      var _lp = _sp.get("look");
      if (_lp && styleById[_lp]) state.look = _lp;
    } catch (e) {}

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
          if (state.look !== "all" && lookOf(item) !== state.look) return;
          if (!matchesBudget(item, state.budget)) return;
          var aud = item.audience || [];
          if (state.audience !== "all" && aud.length && aud.indexOf(state.audience) === -1) return;
          list.push({ cat: cat, item: item });
        });
      });

      // 排序：默认按品类顺序；可选 价格升/降、评分降
      if (state.sort === "priceAsc") {
        list.sort(function (a, b) { return (a.item.price[0] + a.item.price[1]) - (b.item.price[0] + b.item.price[1]); });
      } else if (state.sort === "priceDesc") {
        list.sort(function (a, b) { return (b.item.price[0] + b.item.price[1]) - (a.item.price[0] + a.item.price[1]); });
      } else if (state.sort === "ratingDesc") {
        list.sort(function (a, b) { return b.item.rating - a.item.rating; });
      }

      countEl.textContent = "共 " + list.length + " 款（" + D.updated + " 行情）";

      if (!list.length) {
        wrap.innerHTML = '<div class="empty-box">没有匹配项，换个筛选条件试试。</div>';
        return;
      }

      wrap.innerHTML = list.map(function (o) {
        var it = o.item;
        var look = lookOf(it);
        var style = look ? styleOf(look) : null;
        var banner = style
          ? '<div class="acc-look" style="background:linear-gradient(120deg,' + style.palette[0] + ',' + style.palette[1] + ');">' +
              '<span class="acc-look-icon">' + style.icon + '</span>' +
              '<span class="acc-look-name">' + esc(style.name) + '</span></div>'
          : '';
        var tags = (it.tags || []).map(function (t) {
          return '<span class="tag-pill">' + t + "</span>";
        }).join("");
        var uses = (it.use || []).map(function (u) {
          return '<span class="use-dot" title="' + useLabels[u] + '">' + useIcons[u] + "</span>";
        }).join("");
        var stars = "★★★★★".slice(0, it.rating) + "☆☆☆☆☆".slice(0, 5 - it.rating);
        var grade = it.valueGrade ? '<span class="grade grade-' + it.valueGrade + '">' + it.valueGrade + "</span>" : "";
        return (
          '<article class="acc-card reveal in">' +
            banner +
            '<div class="acc-head">' +
              '<div><span class="acc-cat">' + o.cat.icon + " " + esc(o.cat.name) + "</span>" +
              "<h4 class=\"acc-name\">" + esc(it.name) + "</h4>" +
              (it.brand && it.model ? '<span class="acc-model">' + esc(it.brand + " " + it.model) + "</span>" : "") +
              "</div>" +
              '<span class="acc-price">' + fmtPrice(it.price) + "</span>" +
            "</div>" +
            '<div class="acc-meta">' +
              '<span class="acc-style">' + esc(it.style) + "</span>" +
              '<span class="acc-rating" title="推荐度 ' + it.rating + "/5\">" + stars + "</span>" +
              grade +
              uses +
            "</div>" +
            (it.valueNote ? '<div class="acc-note">' + esc(it.valueNote) + "</div>" : "") +
            '<div class="acc-specs">' + esc(it.specs) + "</div>" +
            '<div class="acc-tags">' + tags + "</div>" +
            '<div class="acc-compat">搭配：' + esc(it.compat) + "</div>" +
            productImageLink(it) +
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

    // 颜值风格筛选
    var looksRow = document.getElementById("accLooks");
    if (looksRow) {
      renderChips(looksRow,
        [{ id: "all", label: "全部风格" }].concat(STYLES.map(function (s) {
          return { id: s.id, label: s.icon + " " + s.name };
        })),
        "look");
    }

    // 人群筛选
    var audienceRow = document.getElementById("accAudience");
    if (audienceRow) {
      renderChips(audienceRow,
        [{ id: "all", label: "全部人群" }].concat(Object.keys(audLabels).map(function (k) {
          return { id: k, label: audIcons[k] + " " + audLabels[k] };
        })),
        "audience");
    }

    // 排序
    var sortSel = document.getElementById("accSort");
    if (sortSel) {
      sortSel.value = state.sort;
      sortSel.addEventListener("change", function () {
        state.sort = sortSel.value;
        renderCards();
      });
    }

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
        var detail = r[3] ? '<span class="plan-detail">' + esc(r[3]) + "</span>" : "";
        return "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + detail + "</td><td class=\"plan-price\">" + esc(r[2]) + "</td></tr>";
      }).join("");
      return (
        '<article class="plan-card reveal in">' +
          '<div class="plan-head">' +
            '<span class="plan-icon">' + pl.icon + "</span>" +
            '<div><h3 class="plan-name">' + esc(pl.name) + "</h3>" +
            '<span class="plan-budget">参考预算 ' + fmtPrice(pl.price) + "</span>" +
            (pl.budgetLabel ? '<span class="plan-tier">' + esc(pl.budgetLabel) + "</span>" : "") +
            "</div>" +
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
   * 三、性价比 TOP 榜单（#toplist）
   * ========================================================= */
  function initTopList() {
    var tabs = document.getElementById("topTabs");
    var wrap = document.getElementById("topWrap");
    if (!tabs || !wrap || !D.topList) return;

    var byCat = {};
    D.categories.forEach(function (c) { byCat[c.id] = c; });

    function lookup(entry) {
      var cat = byCat[entry.catId];
      if (!cat) return null;
      var item = cat.items.filter(function (x) { return x.id === entry.itemId; })[0];
      return item ? { cat: cat, item: item, entry: entry } : null;
    }

    function rankSort(a, b) {
      return gradeOrder[b.entry.grade] - gradeOrder[a.entry.grade] ||
        (a.item.price[0] + a.item.price[1]) / 2 - (b.item.price[0] + b.item.price[1]) / 2;
    }

    function cardHtml(o, rankLabel) {
      return (
        '<article class="top-card reveal in">' +
          '<span class="top-rank">' + rankLabel + "</span>" +
          '<div class="top-main">' +
            '<span class="top-cat">' + esc(o.cat.name) + "</span>" +
            '<h4 class="top-name">' + esc(o.item.name) + "</h4>" +
            '<p class="top-reason">' + esc(o.entry.reason) + "</p>" +
            productImageLink(o.item) +
          "</div>" +
          '<div class="top-side">' +
            '<span class="grade grade-' + o.entry.grade + '">' + o.entry.grade + "</span>" +
            '<span class="top-price">' + fmtPrice(o.item.price) + "</span>" +
          "</div>" +
        "</article>"
      );
    }

    function render(mode) {
      var rows = D.topList.map(lookup).filter(Boolean);
      if (mode === "cat") {
        // 按品类分组，组内按等级+价格排行
        var html = D.categories.map(function (cat) {
          var group = rows.filter(function (o) { return o.cat.id === cat.id; }).sort(rankSort);
          if (!group.length) return "";
          var cards = group.map(function (o, i) {
            return cardHtml(o, '<span class="group-rank r' + (i + 1) + '">#' + (i + 1) + "</span>");
          }).join("");
          return (
            '<div class="top-group reveal in">' +
              '<div class="top-group-head"><span class="top-group-icon">' + cat.icon + "</span>" +
              "<h3 class=\"top-group-name\">" + esc(cat.name) + "</h3>" +
              '<span class="top-group-count">' + group.length + " 款上榜</span></div>" +
              '<div class="top-group-grid">' + cards + "</div>" +
            "</div>"
          );
        }).join("");
        wrap.innerHTML = html;
      } else {
        // 全站总榜
        rows.sort(rankSort);
        wrap.innerHTML = rows.map(function (o, i) {
          return cardHtml(o, "#" + (i + 1));
        }).join("");
      }
    }

    tabs.innerHTML = [
      '<button class="chip active" data-mode="cat">按品类排行</button>',
      '<button class="chip" data-mode="all">全站总榜</button>'
    ].join("");
    tabs.querySelectorAll(".chip").forEach(function (b) {
      b.addEventListener("click", function () {
        tabs.querySelectorAll(".chip").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        render(b.getAttribute("data-mode"));
      });
    });
    render("cat");
  }

  /* =========================================================
   * 四、个性化测评（#quiz）：问答 → 生成方案
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
      var budget = answerOf("budget")[0] || "b6000";
      var form = answerOf("form")[0] || "desktop";
      var pref = answerOf("pref")[0] || "value";
      var look = answerOf("look")[0] || "any";
      var style = (look && look !== "any") ? styleOf(look) : null;
      var intensity = answerOf("intensity")[0] || "mid";
      var lifespan = answerOf("lifespan")[0] || "y3";
      var exp = answerOf("exp")[0] || "some";
      var existing = answerOf("existing");
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
      // 智能跳过已拥有的外设（选了"都没有"除外）
      if (existing.indexOf("none") === -1 && existing.length) {
        focus = focus.filter(function (c) { return existing.indexOf(c) === -1; });
      }

      var budgetCap = budgetOrder[budget];

      // 1) 基础整机方案（年限/强度参与匹配）
      var plan = pickPlan(use, form, budgetCap, lifespan, intensity);

      // 2) 个性化配件推荐（强度/已有外设参与评分）
      var picks = focus.map(function (catId) {
        return pickItems(catId, use, pref, budgetCap, plan, intensity, look);
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

      // 4) 需求画像（强度/年限/经验/已有外设）
      var intLabel = { light: "☕ 轻度使用", mid: "🖥️ 中度使用", heavy: "🔥 重度使用" }[intensity] || "";
      var lifeLabel = { y1: "短期过渡", y3: "主流 3 年", y5: "战未来 5 年+" }[lifespan] || "";
      var expLabel = { new: "纯新手", some: "会折腾", pro: "老玩家" }[exp] || "";
      var existLabels = { monitor: "🖥️", input: "⌨️", audio: "🎧", stand: "🛠️", cooler: "❄️" };
      var existTxt = existing.indexOf("none") > -1 || !existing.length
        ? "外设从零开始"
        : "已有" + existing.map(function (c) { return existLabels[c] || c; }).join(" ");
      var profile =
        '<span class="tag-pill">' + esc(intLabel) + "</span>" +
        '<span class="tag-pill">' + esc(lifeLabel) + "</span>" +
        '<span class="tag-pill">' + esc(expLabel) + "</span>" +
        '<span class="tag-pill">' + esc(existTxt) + "</span>";
      if (look && look !== "any" && styleOf(look)) {
        profile += '<span class="tag-pill">' + esc(styleOf(look).icon + " " + styleOf(look).name) + "</span>";
      }

      var picksHtml = picks.map(function (p) {
        var item = p.item;
        var cat = p.cat;
        return (
          '<div class="pick-item">' +
            '<span class="pick-icon">' + cat.icon + "</span>" +
            '<div class="pick-main"><span class="pick-name">' + esc(item.name) + "</span>" +
            '<span class="pick-why">' + esc(p.why) + "</span>" +
            productImageLink(item) +
            "</div>" +
            '<span class="pick-price">' + fmtPrice(item.price) + "</span>" +
          "</div>"
        );
      }).join("");

      var planHtml = plan
        ? '<div class="res-plan">' + plan.icon + " <b>" + esc(plan.name) + "</b> —— " + esc(plan.summary) +
          ' <span class="res-budget">参考 ' + fmtPrice(plan.price) + "</span></div>"
        : '<div class="res-plan">未匹配到整机方案，请参考「搭配计划」板块。</div>';

      var lookHtml = "";
      if (style) {
        var sw = (style.palette || []).map(function (c) {
          return '<span class="look-swatch sm" style="background:' + c + '"></span>';
        }).join("");
        lookHtml =
          '<div class="res-section res-look">' +
            '<span class="res-label">你偏好的颜值风格</span>' +
            '<div class="res-look-card">' +
              '<img class="res-look-img" src="' + style.img + '" alt="' + esc(style.name) + '" loading="lazy" />' +
              '<div class="res-look-body">' +
                '<div class="res-look-head">' + style.icon + " " + esc(style.name) +
                  '<span class="res-look-pal">' + sw + "</span></div>" +
                '<p class="res-look-desc">' + esc(style.desc) + "</p>" +
                '<p class="res-look-tip">💡 ' + esc((style.tips && style.tips[0]) || "") + "</p>" +
                '<button class="btn btn-ghost res-look-jump" data-look="' + style.id + '">看这类风格配件 →</button>' +
              "</div>" +
            "</div>" +
          "</div>";
      }

      box.innerHTML =
        '<div class="result-box reveal in">' +
          '<h3 class="result-title">🎯 你的个性化方案</h3>' +
          '<div class="result-persona"><span class="res-label">需求画像</span>' + profile + "</div>" +
          '<div class="result-persona"><span class="res-label">适合人群</span>' + personas + "</div>" +
          lookHtml +
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

      var lookJump = box.querySelector(".res-look-jump");
      if (lookJump) lookJump.addEventListener("click", function () {
        var id = lookJump.getAttribute("data-look");
        window.location.href = "accessories.html?look=" + encodeURIComponent(id);
      });
    }

    function pickPlan(use, form, budgetCap, lifespan, intensity) {
      var candidates = D.plans.filter(function (pl) {
        if (form === "laptop" && pl.form.indexOf("laptop") === -1 && pl.form.indexOf("both") === -1) return false;
        if (form === "desktop" && pl.form.indexOf("desktop") === -1) return false;
        var hit = pl.uses.some(function (u) { return use.indexOf(u) > -1; });
        return hit;
      });
      if (!candidates.length) return null;
      // 预算匹配优先（战未来放宽上浮）；其次取第一个
      var cap = (lifespan === "y5" ? budgetCap * 1.35 : budgetCap * 1.15);
      var exact = candidates.filter(function (pl) { return pl.price[1] <= cap; });
      var pool = exact.length ? exact : candidates;
      return pool.reduce(function (best, pl) {
        var score = pl.uses.filter(function (u) { return use.indexOf(u) > -1; }).length;
        var bestScore = best ? best.uses.filter(function (u) { return use.indexOf(u) > -1; }).length : -1;
        if (score === bestScore && lifespan === "y5" && intensity === "heavy") {
          // 战未来 + 重度使用：同匹配度下优先配置更足的高一档
          var m = (pl.price[0] + pl.price[1]) / 2;
          var bm = (best.price[0] + best.price[1]) / 2;
          if (m > bm) return pl;
        }
        return score > bestScore ? pl : best;
      }, pool[0]);
    }

    function pickItems(catId, use, pref, budgetCap, plan, intensity, look) {
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
        if (look && look !== "any" && lookOf(it) === look) s += 3;
        s += it.rating * 0.5;
        // 性价比等级加权
        if (it.valueGrade && gradeOrder[it.valueGrade] !== undefined) s += gradeOrder[it.valueGrade];
        // 重度使用：静音/散热优先
        if (intensity === "heavy" && (it.tags.indexOf("静音") > -1 || it.tags.indexOf("散热") > -1)) s += 2;
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
      if (look && look !== "any" && lookOf(top.item) === look) {
        var _st = styleOf(look);
        if (_st) reasons.push("契合" + _st.name + "风格");
      }
      if (top.item.valueGrade) reasons.push("性价比等级 " + top.item.valueGrade);
      if (top.item.rating >= 5) reasons.push("推荐度满分");
      if (!reasons.length) reasons.push("综合性价比高");
      why += reasons.join("，") + "。" + (top.item.valueNote || top.item.specs);

      return { cat: cat, item: top.item, why: why };
    }

    render();
  }

  /* =========================================================
   * 五、预算适配器（#budget）：输入预算 → 自动匹配方案
   * ========================================================= */
  function initBudgetTool() {
    var input = document.getElementById("budgetInput");
    var chips = document.getElementById("budgetChips");
    var useRow = document.getElementById("budgetUse");
    var result = document.getElementById("budgetResult");
    if (!input || !chips || !useRow || !result) return;

    var state = { budget: 6000, use: "all", plan: null, rows: [], total: 0 };
    var presets = [3000, 4500, 6000, 8500, 12000, 20000];

    function renderChips() {
      chips.innerHTML = presets.map(function (b) {
        var active = state.budget === b ? " active" : "";
        return '<button class="chip' + active + '" data-b="' + b + '">¥' + b + "</button>";
      }).join("");
      chips.querySelectorAll(".chip").forEach(function (b) {
        b.addEventListener("click", function () {
          state.budget = parseInt(b.getAttribute("data-b"), 10);
          input.value = state.budget;
          renderChips();
          renderResult();
        });
      });

      useRow.innerHTML = [{ id: "all", label: "全部用途" }, { id: "office", label: "💼 办公学习" }, { id: "game", label: "🎮 游戏" }, { id: "create", label: "🎬 创作" }, { id: "portable", label: "💻 便携" }].map(function (u) {
        var active = state.use === u.id ? " active" : "";
        return '<button class="chip' + active + '" data-u="' + u.id + '">' + u.label + "</button>";
      }).join("");
      useRow.querySelectorAll(".chip").forEach(function (b) {
        b.addEventListener("click", function () {
          state.use = b.getAttribute("data-u");
          renderChips();
          renderResult();
        });
      });
    }

    input.addEventListener("input", function () {
      var v = parseInt(input.value, 10);
      if (!isNaN(v) && v >= 1000) {
        state.budget = v;
        renderChips();
        renderResult();
      }
    });

    function matchPlan(budget) {
      var pool = D.plans.filter(function (pl) {
        if (pl.id === "mobile") return false; // 台式整机预算，不含便携补强包
        if (state.use !== "all" && pl.uses.indexOf(state.use) === -1) return false;
        return true;
      });
      if (!pool.length) pool = D.plans.filter(function (pl) { return pl.id !== "mobile"; });

      // 预算区间包含该预算 → 直接命中；否则取中值最接近的档位
      var hit = pool.filter(function (pl) { return budget >= pl.price[0] * 0.85 && budget <= pl.price[1] * 1.15; });
      if (hit.length) {
        return hit.reduce(function (best, pl) {
          var dBest = Math.abs((best.price[0] + best.price[1]) / 2 - budget);
          var dPl = Math.abs((pl.price[0] + pl.price[1]) / 2 - budget);
          return dPl < dBest ? pl : best;
        });
      }
      return pool.reduce(function (best, pl) {
        var dBest = Math.abs((best.price[0] + best.price[1]) / 2 - budget);
        var dPl = Math.abs((pl.price[0] + pl.price[1]) / 2 - budget);
        return dPl < dBest ? pl : best;
      });
    }

    function catalogOf(key) {
      return (D.partCatalog || []).filter(function (c) { return c.key === key; })[0] || null;
    }

    function defaultOpt(part) {
      var cat = catalogOf(part[0]);
      if (!cat) return -1;
      var refPrice = parseInt(String(part[2]).replace(/[^0-9]/g, ""), 10) || 0;
      var best = 0, bd = Infinity;
      cat.options.forEach(function (o, i) {
        var d = Math.abs(o.p - refPrice);
        if (d < bd) { bd = d; best = i; }
      });
      return best;
    }

    function buildRows(plan) {
      state.plan = plan;
      state.rows = plan.parts.map(function (part) {
        var opt = defaultOpt(part);
        var cat = catalogOf(part[0]);
        var price = opt >= 0
          ? cat.options[opt].p
          : (parseInt(String(part[2]).replace(/[^0-9]/g, ""), 10) || 0);
        var name = opt >= 0 ? cat.options[opt].n : part[1];
        return { part: part, opt: opt, price: price, name: name };
      });
    }

    function updateTotal() {
      var t = 0;
      state.rows.forEach(function (r) { t += r.price || 0; });
      state.total = t;
    }

    function renderResult() {
      var b = state.budget;
      var plan = matchPlan(b);
      if (!plan) { result.innerHTML = '<div class="empty-box">暂无匹配方案。</div>'; return; }
      if (state.plan !== plan) buildRows(plan);
      updateTotal();
      renderTable(plan, b);
    }

    function renderTable(plan, b) {
      var trs = state.rows.map(function (r, i) {
        var part = r.part;
        var cat = catalogOf(part[0]);
        var detail = part[3] ? '<span class="plan-detail">' + esc(part[3]) + "</span>" : "";
        var ctrl;
        if (cat) {
          var opts = cat.options.map(function (o, oi) {
            return '<option value="' + oi + '"' + (oi === r.opt ? " selected" : "") + ">" + esc(o.n) + "（¥" + o.p + "）</option>";
          }).join("");
          ctrl =
            '<div class="part-ctrl">' +
              '<select class="part-select" data-i="' + i + '" aria-label="' + esc(part[0]) + ' 型号">' + opts + "</select>" +
              '<span class="part-price-box"><span class="part-currency">¥</span>' +
              '<input type="number" class="part-price" data-i="' + i + '" min="0" step="50" value="' + r.price + '" aria-label="' + esc(part[0]) + ' 价格" /></span>' +
            "</div>" + detail;
        } else {
          ctrl = '<span class="part-static">' + esc(part[1]) + "</span>" + detail;
        }
        return "<tr><td>" + esc(part[0]) + "</td><td>" + ctrl + "</td><td class=\"plan-price\">" + (cat ? "¥" + r.price : esc(part[2])) + "</td></tr>";
      }).join("");

      var personas = (plan.personas || []).map(function (pid) {
        var p = D.personas.filter(function (x) { return x.id === pid; })[0];
        return p ? '<span class="tag-pill">' + p.icon + " " + p.name + "</span>" : "";
      }).join("");

      var diff = b - state.total;
      var tipHtml;
      if (diff >= 0 && diff <= b * 0.05) {
        tipHtml = '<div class="budget-tip">✅ 当前配置总价 <b>¥' + state.total + '</b>，预算 ¥' + b + '，<b>刚好达标</b>，可直接照单购买。</div>';
      } else if (diff > b * 0.05) {
        tipHtml = '<div class="budget-tip">🎉 当前配置总价 ¥' + state.total + '，比预算省 <b>¥' + diff + '</b>。富余可：升级显示器 4K / 加 2TB 硬盘 / 升键鼠。</div>';
      } else if (diff >= -b * 0.1) {
        tipHtml = '<div class="budget-tip warn">⚠️ 当前配置总价 ¥' + state.total + '，超预算 <b>¥' + (-diff) + '</b>（约 ' + Math.round(-diff / b * 100) + '%）。建议：最贵的部件降一档，或去掉可后补的外设。</div>';
      } else {
        tipHtml = '<div class="budget-tip warn">🚨 超预算较多（¥' + (-diff) + '，' + Math.round(-diff / b * 100) + '%）。建议：切换更低档方案，或逐件下调——优先动显卡/显示器，体验影响最可控。</div>';
      }

      result.innerHTML =
        '<div class="budget-result reveal in">' +
          '<div class="budget-head">' +
            '<span class="plan-icon">' + plan.icon + "</span>" +
            '<div><h3 class="plan-name">' + esc(plan.name) + '<span class="plan-tier">' + esc(plan.budgetLabel) + "</span></h3>" +
            '<span class="plan-budget">适合人群 ' + personas + " ｜ 每个部件都可换型号、改价格</span></div>" +
            '<button type="button" class="budget-copy" title="复制当前配置单为文本">📋 复制配置单</button>' +
          "</div>" +
          '<table class="plan-table part-table"><thead><tr><th>部件</th><th>型号 / 档位（下拉可换）＋ 价格（可改）</th><th>小计</th></tr></thead><tbody>' + trs + "</tbody></table>" +
          '<div class="res-total">当前配置合计：<b>¥' + state.total + '</b> ｜ 你的预算 <b>¥' + b + '</b> ｜ ' +
            (diff >= 0 ? "结余 <b style=\"color:#16a34a\">¥" + diff + "</b>" : "超支 <b style=\"color:#dc2626\">¥" + (-diff) + "</b>") +
          "</div>" +
          tipHtml +
          '<div class="res-note">' + esc(D.note) + "。改动价格仅用于预算试算，购机请以电商实时价为准。</div>" +
        "</div>";

      // 绑定交互：换型号
      result.querySelectorAll(".part-select").forEach(function (sel) {
        sel.addEventListener("change", function () {
          var i = parseInt(sel.getAttribute("data-i"), 10);
          var opt = parseInt(sel.value, 10);
          var o = catalogOf(state.rows[i].part[0]).options[opt];
          state.rows[i].opt = opt;
          state.rows[i].price = o.p;
          state.rows[i].name = o.n;
          updateTotal();
          renderTable(plan, b);
        });
      });
      // 绑定交互：改价格（仅更新合计与提示，避免整表重渲染丢焦点）
      result.querySelectorAll(".part-price").forEach(function (inp) {
        inp.addEventListener("input", function () {
          var i = parseInt(inp.getAttribute("data-i"), 10);
          var v = parseInt(inp.value, 10);
          state.rows[i].price = isNaN(v) ? 0 : Math.max(0, v);
          updateTotal();
          var t = state.total, d = b - t;
          var totalEl = result.querySelector(".res-total");
          if (totalEl) {
            totalEl.innerHTML = '当前配置合计：<b>¥' + t + '</b> ｜ 你的预算 <b>¥' + b + '</b> ｜ ' +
              (d >= 0 ? "结余 <b style=\"color:#16a34a\">¥" + d + "</b>" : "超支 <b style=\"color:#dc2626\">¥" + (-d) + "</b>");
          }
          var tipEl = result.querySelector(".budget-tip");
          if (tipEl) tipEl.className = "budget-tip" + (d < 0 ? " warn" : "");
        });
      });
      // 绑定交互：复制配置单
      var copyBtn = result.querySelector(".budget-copy");
      if (copyBtn) copyBtn.addEventListener("click", copyPlan);
    }

    function copyPlan() {
      var plan = state.plan;
      if (!plan || !state.rows.length) return;
      var lines = [];
      lines.push("【" + plan.icon + " " + plan.name + "】 " + plan.budgetLabel);
      lines.push("预算：¥" + state.budget + " ｜ 当前配置合计：¥" + state.total);
      lines.push(new Array(30).join("—"));
      state.rows.forEach(function (r) {
        lines.push("· " + r.part[0] + "：" + r.name + "（¥" + r.price + "）");
        if (r.part[3]) lines.push("　  " + r.part[3]);
      });
      lines.push(new Array(30).join("—"));
      lines.push(D.note);
      var text = lines.join("\n");
      function flash() {
        var btn = result.querySelector(".budget-copy");
        if (!btn) return;
        var old = btn.textContent;
        btn.textContent = "✅ 已复制";
        setTimeout(function () { btn.textContent = old; }, 1600);
      }
      function fallback() {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(ta);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(flash, function () { fallback(); flash(); });
      } else { fallback(); flash(); }
    }

    renderChips();
    renderResult();
  }

  /* =========================================================
   * 颜值外观画廊（#looks）
   * ========================================================= */
  function initLooks() {
    var wrap = document.getElementById("lookGallery");
    if (!wrap || !STYLES.length) return;

    wrap.innerHTML = STYLES.map(function (s) {
      var sw = (s.palette || []).map(function (c) {
        return '<span class="look-swatch" style="background:' + c + '"></span>';
      }).join("");
      var cnt = countByStyle(s.id);
      return (
        '<article class="look-card reveal in">' +
          '<div class="look-cover">' +
            '<img src="' + s.img + '" alt="' + esc(s.name) + ' 风格参考图" loading="lazy" />' +
            '<span class="look-badge">' + s.icon + " " + esc(s.name) + "</span>" +
          "</div>" +
          '<div class="look-body">' +
            "<h3 class=\"look-name\">" + s.icon + " " + esc(s.name) + "</h3>" +
            '<p class="look-desc">' + esc(s.desc) + "</p>" +
            '<div class="look-pal"><span class="look-pal-name">配色 · ' + esc(s.paletteName || "") + "</span>" +
              '<div class="look-swatches">' + sw + "</div></div>" +
            '<ul class="look-meta">' +
              '<li><span class="lm-k">适合</span><span class="lm-v">' + esc(s.suits || "") + "</span></li>" +
              '<li><span class="lm-k">机箱</span><span class="lm-v">' + esc(s.caseType || "") + " — " + esc(s.caseTip || "") + "</span></li>" +
              '<li><span class="lm-k">灯光</span><span class="lm-v">' + esc(s.lighting || "") + "</span></li>" +
              '<li><span class="lm-k">点缀</span><span class="lm-v">' + esc(s.accents || "") + "</span></li>" +
              '<li class="lm-avoid"><span class="lm-k">避坑</span><span class="lm-v">' + esc(s.avoid || "") + "</span></li>" +
            "</ul>" +
            '<div class="look-foot">' +
              '<span class="look-count">' + cnt + " 款配件适配</span>" +
              '<button class="btn btn-ghost look-jump" data-look="' + s.id + '">查看该风格配件 →</button>' +
            "</div>" +
          "</div>" +
        "</article>"
      );
    }).join("");

    wrap.querySelectorAll(".look-jump").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-look");
        window.location.href = "accessories.html?look=" + encodeURIComponent(id);
      });
    });
  }

  /* 颜值搭配 6 大原则 */
  function initLookPrinciples() {
    var wrap = document.getElementById("lookPrinciples");
    if (!wrap || !PRINCIPLES.length) return;
    wrap.innerHTML = PRINCIPLES.map(function (p) {
      return (
        '<article class="card reveal in">' +
          '<div class="card-icon">' + p.icon + "</div>" +
          '<h3 class="card-title">' + esc(p.title) + "</h3>" +
          '<p class="card-text">' + esc(p.text) + "</p>" +
        "</article>"
      );
    }).join("");
  }

  /* 机箱 × 风格 速查 */
  function initLookCases() {
    var wrap = document.getElementById("lookCases");
    if (!wrap || !STYLES.length) return;
    wrap.innerHTML = STYLES.map(function (s) {
      var sw = (s.palette || []).slice(0, 3).map(function (c) {
        return '<span class="look-swatch sm" style="background:' + c + '"></span>';
      }).join("");
      return (
        '<div class="case-row reveal in">' +
          '<div class="case-head">' +
            '<span class="case-icon">' + s.icon + "</span>" +
            '<div class="case-titles"><span class="case-name">' + esc(s.name) + "</span>" +
              '<span class="case-type">' + esc(s.caseType || "") + "</span></div>" +
            '<div class="look-swatches">' + sw + "</div>" +
          "</div>" +
          '<p class="case-tip">' + esc(s.caseTip || "") + "</p>" +
        "</div>"
      );
    }).join("");
  }

  /* 细节赏析图廊 */
  function initLookDetails() {
    var wrap = document.getElementById("lookDetails");
    if (!wrap || !DETAILS.length) return;
    wrap.innerHTML = DETAILS.map(function (d) {
      return (
        '<figure class="detail-fig reveal in">' +
          '<div class="detail-cover"><img src="' + d.img + '" alt="' + esc(d.tag) + '" loading="lazy" />' +
            '<span class="detail-tag">' + esc(d.tag) + "</span></div>" +
          '<figcaption class="detail-cap">' + esc(d.text) + "</figcaption>" +
        "</figure>"
      );
    }).join("");
  }

  /* 颜值避坑指南 */
  function initLookPitfalls() {
    var wrap = document.getElementById("lookPitfalls");
    if (!wrap || !PITFALLS.length) return;
    wrap.innerHTML = PITFALLS.map(function (p) {
      return (
        '<div class="pitfall reveal in">' +
          '<span class="pf-badge">✕ ' + esc(p.bad) + "</span>" +
          '<p class="pf-text">' + esc(p.text) + "</p>" +
        "</div>"
      );
    }).join("");
  }

  /* =========================================================
   * 智能推荐（#smart）：3 个关键问题 → 方案 + 核心配件
   * ========================================================= */
  function initSmart() {
    var wrap = document.getElementById("smartResult");
    var qBudget = document.getElementById("smartBudget");
    var qUse = document.getElementById("smartUse");
    var qForm = document.getElementById("smartForm");
    var qIntensity = document.getElementById("smartIntensity");
    var qMonitor = document.getElementById("smartMonitor");
    var qLook = document.getElementById("smartLook");
    var btn = document.getElementById("smartGo");
    if (!wrap || !qBudget || !qUse || !qForm || !btn) return;

    var state = { budget: null, use: null, form: null, look: null, intensity: "mid", monitor: "need" };
    var budgetOpts = [
      { id: "3000", label: "≤3000 元" },
      { id: "4500", label: "3000-4500 元" },
      { id: "6000", label: "4500-6000 元" },
      { id: "8500", label: "6000-8500 元" },
      { id: "12000", label: "8500-12000 元" },
      { id: "20000", label: "12000 元+" }
    ];
    var useOpts = [
      { id: "office", label: "💼 办公学习" },
      { id: "game", label: "🎮 游戏电竞" },
      { id: "create", label: "🎬 内容创作" },
      { id: "portable", label: "💻 移动便携" }
    ];
    var formOpts = [
      { id: "desktop", label: "🖥️ 台式整机" },
      { id: "laptop", label: "💻 笔记本 + 外设" },
      { id: "both", label: "🖥️ 两台都有" }
    ];
    var intensityOpts = [
      { id: "light", label: "🪶 轻量够用" },
      { id: "mid", label: "⚖️ 主流均衡" },
      { id: "heavy", label: "💪 性能拉满" }
    ];
    var monitorOpts = [
      { id: "need", label: "🖥️ 需要一起配" },
      { id: "have", label: "✅ 已有显示器" }
    ];

    function renderRow(row, items, key) {
      row.innerHTML = items.map(function (it) {
        var active = state[key] === it.id ? " active" : "";
        return '<button type="button" class="chip' + active + '" data-v="' + it.id + '">' + it.label + "</button>";
      }).join("");
      row.querySelectorAll(".chip").forEach(function (b) {
        b.addEventListener("click", function () {
          var v = b.getAttribute("data-v");
          state[key] = state[key] === v ? null : v;
          renderRow(row, items, key);
        });
      });
    }

    renderRow(qBudget, budgetOpts, "budget");
    renderRow(qUse, useOpts, "use");
    renderRow(qForm, formOpts, "form");
    if (qIntensity) renderRow(qIntensity, intensityOpts, "intensity");
    if (qMonitor) renderRow(qMonitor, monitorOpts, "monitor");
    if (qLook) {
      renderRow(qLook, [{ id: "all", label: "不限定" }].concat(STYLES.map(function (s) {
        return { id: s.id, label: s.icon + " " + s.name };
      })), "look");
    }

    function mid(p) { return (p[0] + p[1]) / 2; }

    function matchPlan() {
      var b = parseInt(state.budget, 10) || 6000;
      var pool = D.plans.filter(function (pl) {
        if (pl.id === "mobile") return state.form === "laptop" || state.form === "both";
        if (state.use && pl.uses.indexOf(state.use) === -1) return false;
        return true;
      });
      if (!pool.length) pool = D.plans.filter(function (pl) { return pl.id !== "mobile"; });
      var hit = pool.filter(function (pl) { return b >= pl.price[0] * 0.85 && b <= pl.price[1] * 1.15; });
      if (hit.length) {
        return hit.reduce(function (best, pl) {
          return Math.abs(mid(pl.price) - b) < Math.abs(mid(best.price) - b) ? pl : best;
        });
      }
      return pool.reduce(function (best, pl) {
        return Math.abs(mid(pl.price) - b) < Math.abs(mid(best.price) - b) ? pl : best;
      });
    }

    // 推荐理由：基于用途与强度
    function pickWhy(item, use, intensity) {
      var parts = [];
      if (use && item.use.indexOf(use) !== -1) parts.push("适配" + (useLabels[use] || use) + "场景");
      if (intensity === "heavy" && (item.valueGrade === "S" || item.valueGrade === "A")) parts.push("高强度下性价比高");
      if (intensity === "light" && (item.valueGrade === "S" || item.valueGrade === "A")) parts.push("预算内最优解");
      return parts.length ? "推荐理由：" + parts.join("、") : "";
    }

    function recommendItems(plan, use, intensity, needMonitor) {
      var cats = needMonitor
        ? ["cpu", "gpu", "cooler", "monitor", "input", "audio", "psu"]
        : ["cpu", "gpu", "cooler", "input", "audio", "psu"];
      var out = [];
      var capBase = plan.price[1];
      var cap = intensity === "light" ? capBase * 0.72
              : intensity === "heavy" ? capBase * 1.08
              : capBase * 0.92;
      cats.forEach(function (cid) {
        var cat = null;
        D.categories.forEach(function (c) { if (c.id === cid) cat = c; });
        if (!cat || !cat.items.length) return;
        var items = cat.items.filter(function (it) {
          if (!use) return true;
          return it.use.indexOf(use) !== -1 || it.use.indexOf("portable") !== -1;
        });
        if (!items.length) items = cat.items.slice();
        var inBudget = items.filter(function (it) { return mid(it.price) <= cap; });
        var pool2;
        if (inBudget.length) {
          pool2 = inBudget.slice().sort(function (a, b) {
            var d = (gradeOrder[b.valueGrade] || 0) - (gradeOrder[a.valueGrade] || 0);
            return d !== 0 ? d : b.rating - a.rating;
          });
        } else {
          pool2 = items.slice().sort(function (a, b) {
            return Math.abs(mid(a.price) - cap) - Math.abs(mid(b.price) - cap);
          });
        }
        var pick = pool2[0];
        if (pick) out.push({ cat: cat, item: pick, why: pickWhy(pick, use, intensity) });
      });
      return out;
    }

    btn.addEventListener("click", function () {
      if (!state.budget || !state.use) {
        wrap.innerHTML = '<div class="empty-box">请先选择「预算」和「用途」，再点击生成推荐。</div>';
        return;
      }
      var plan = matchPlan();
      var use = state.use === "portable" ? null : state.use;
      var intensity = state.intensity || "mid";
      var needMonitor = state.monitor !== "have";
      var picks = recommendItems(plan, use, intensity, needMonitor);
      var personas = (plan.personas || []).map(function (pid) {
        var p = D.personas.filter(function (x) { return x.id === pid; })[0];
        return p ? '<span class="tag-pill">' + p.icon + " " + p.name + "</span>" : "";
      }).join("");
      var planHtml =
        '<div class="smart-plan reveal in">' +
          '<div class="budget-head">' +
            '<span class="plan-icon">' + plan.icon + "</span>" +
            '<div><h3 class="plan-name">推荐方案：' + esc(plan.name) + '<span class="plan-tier">' + esc(plan.budgetLabel) + "</span></h3>" +
            '<span class="plan-budget">参考预算 ' + fmtPrice(plan.price) + " ｜ 适合人群 " + personas + "</span></div>" +
          "</div>" +
          '<p class="smart-summary">' + esc(plan.summary) + "</p>" +
          '<a class="btn-primary smart-plan-link" href="plans.html">查看完整配置单 ›</a>' +
        "</div>";
      var itemsHtml = picks.map(function (o) {
        var it = o.item;
        var grade = it.valueGrade ? '<span class="grade grade-' + it.valueGrade + '">' + it.valueGrade + "</span>" : "";
        return (
          '<article class="acc-card reveal in">' +
            '<div class="acc-head"><div><span class="acc-cat">' + o.cat.icon + " " + esc(o.cat.name) + "</span>" +
            '<h4 class="acc-name">' + esc(it.name) + "</h4>" +
            (it.brand && it.model ? '<span class="acc-model">' + esc(it.brand + " " + it.model) + "</span>" : "") + "</div>" +
            '<span class="acc-price">' + fmtPrice(it.price) + "</span></div>" +
            '<div class="acc-meta"><span class="acc-style">' + esc(it.style) + "</span>" +
            '<span class="acc-rating">' + "★★★★★".slice(0, it.rating) + "</span>" + grade + "</div>" +
            (o.why ? '<div class="smart-why">🎯 ' + esc(o.why) + "</div>" : "") +
            (it.valueNote ? '<div class="acc-note">' + esc(it.valueNote) + "</div>" : "") +
            productImageLink(it) +
          "</article>"
        );
      }).join("");
      wrap.innerHTML =
        '<div class="smart-res-head reveal in">为你匹配的方案与核心配件</div>' +
        planHtml +
        '<div class="acc-grid smart-grid">' + itemsHtml + "</div>" +
        '<p class="smart-note">' + esc(D.note) + "。配件按「预算 × 性能强度上限内评分最高」挑选；选「已有显示器」则不再推荐显示器。</p>";
      wrap.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* ---- 启动 ---- */
  function boot() {
    mergeModels();
    initAccessories();
    initPlans();
    initTopList();
    initLooks();
    initLookPrinciples();
    initLookCases();
    initLookDetails();
    initLookPitfalls();
    initSmart();
    initQuiz();
    initBudgetTool();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
