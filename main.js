/* Prompt Engineering — shared interactions
   Typing effect, copy buttons, category filters, FAQ accordion,
   scroll reveal, reader navigation. No external libraries. */

(function () {
  "use strict";

  /* ---------- Hero typing effect ---------- */
  var typeEl = document.getElementById("typewriter");
  if (typeEl) {
    var lines = JSON.parse(typeEl.getAttribute("data-lines") || "[]");
    var li = 0, ci = 0, deleting = false;
    function tick() {
      var full = lines[li];
      if (!deleting) {
        ci++;
        if (ci === full.length) { deleting = true; setTimeout(tick, 2200); typeEl.textContent = full; return; }
      } else {
        ci--;
        if (ci === 0) { deleting = false; li = (li + 1) % lines.length; }
      }
      typeEl.textContent = full.slice(0, ci);
      setTimeout(tick, deleting ? 22 : 42);
    }
    if (lines.length) tick();
  }

  /* ---------- Hero headline blur-in (staggered word entrance) ----------
     Words start blurred + lifted and sharpen one by one, like the reference
     headline that "blurs in over those streaks". Splitting happens in JS so the
     headline stays plain readable text without JS. Skipped under reduced motion. */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var heroH1 = document.querySelector("header h1");
  if (heroH1 && !reduceMotion) {
    (function splitWords(node, state) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (w) {
            if (w === "" || /^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
            var s = document.createElement("span");
            s.className = "hero-word";
            s.style.setProperty("--d", (state.i * 0.09).toFixed(2) + "s");
            s.textContent = w;
            frag.appendChild(s);
            state.i++;
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          splitWords(child, state);
        }
      });
    })(heroH1, { i: 0 });
    heroH1.classList.add("hero-animated");
    document.documentElement.classList.add("hero-ready");
  }

  /* ---------- Animated stat counters ---------- */
  var counters = document.querySelectorAll(".stat b[data-count]");
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) { el.textContent = prefix + target + suffix; return; }
    var start = null, dur = 1100;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (counters.length) {
    if ("IntersectionObserver" in window) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); }
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { cio.observe(el); });
    } else {
      counters.forEach(animateCount);
    }
  }

  /* ---------- Copy buttons ---------- */
  function copyText(text, btn) {
    function done() {
      var old = btn.textContent;
      btn.classList.add("copied");
      btn.textContent = "Copied ✓";
      setTimeout(function () { btn.classList.remove("copied"); btn.textContent = old; }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  }
  function fallbackCopy(text, done) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); } catch (e) { /* clipboard unavailable */ }
    document.body.removeChild(ta);
  }
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = document.getElementById(btn.getAttribute("data-copy"));
      if (target) copyText(target.textContent.trim(), btn);
    });
  });
  document.querySelectorAll("[data-copy-text]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      copyText(btn.getAttribute("data-copy-text"), btn);
    });
  });

  /* ---------- Category filters (free prompts) ---------- */
  var filterBtns = document.querySelectorAll(".filter-btn");
  var cards = document.querySelectorAll("[data-category]");
  if (filterBtns.length && cards.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        var cat = btn.getAttribute("data-filter");
        var shown = 0;
        cards.forEach(function (card) {
          var show = cat === "all" || card.getAttribute("data-category") === cat;
          card.style.display = show ? "" : "none";
          if (show) shown++;
        });
        var count = document.getElementById("prompt-count");
        if (count) count.textContent = shown + " prompt" + (shown === 1 ? "" : "s");
      });
    });
  }

  /* ---------- Module accordion (home page "Course at a glance") ----------
     Tap a module card to expand its lesson list; tap again or another card
     to close it — single-open, touch friendly. */
  var modHeads = document.querySelectorAll(".module-card-head");
  if (modHeads.length) {
    modHeads.forEach(function (head) {
      head.addEventListener("click", function () {
        var card = head.closest(".module-card");
        if (!card) return;
        var wasOpen = card.classList.contains("open");
        document.querySelectorAll(".module-card.open").forEach(function (c) {
          c.classList.remove("open");
          var h = c.querySelector(".module-card-head");
          if (h) h.setAttribute("aria-expanded", "false");
        });
        if (!wasOpen) {
          card.classList.add("open");
          head.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-q").forEach(function (q) {
    q.addEventListener("click", function () {
      var item = q.parentElement;
      var wasOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(function (i) { i.classList.remove("open"); });
      if (!wasOpen) item.classList.add("open");
    });
  });

  /* ---------- Scroll reveal (with per-parent stagger) ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  var staggerMap = new Map();
  revealEls.forEach(function (el) {
    var p = el.parentElement;
    var n = staggerMap.get(p) || 0;
    staggerMap.set(p, n + 1);
    el.style.setProperty("--i", Math.min(n, 8));
  });
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- Reader navigation ---------- */
  var lessons = Array.prototype.slice.call(document.querySelectorAll(".lesson"));
  if (lessons.length) {
    var sideLinks = Array.prototype.slice.call(document.querySelectorAll(".reader-side a[data-lesson]"));
    var prevBtn = document.getElementById("reader-prev");
    var nextBtn = document.getElementById("reader-next");

    function showLesson(id, push) {
      var idx = -1;
      lessons.forEach(function (l, i) {
        var on = l.id === id;
        l.classList.toggle("active", on);
        if (on) idx = i;
      });
      sideLinks.forEach(function (a) {
        a.classList.toggle("active", a.getAttribute("data-lesson") === id);
      });
      if (prevBtn) prevBtn.style.visibility = idx > 0 ? "visible" : "hidden";
      if (nextBtn) nextBtn.style.visibility = idx < lessons.length - 1 ? "visible" : "hidden";
      if (push) {
        try { history.replaceState(null, "", "#" + id); } catch (e) { /* ignore */ }
      }
      var active = document.querySelector(".lesson.active");
      if (active) {
        var top = active.getBoundingClientRect().top + window.scrollY - 84;
        window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
      }
    }
    function go(delta) {
      var cur = lessons.findIndex(function (l) { return l.classList.contains("active"); });
      var next = lessons[Math.min(Math.max(cur + delta, 0), lessons.length - 1)];
      if (next) showLesson(next.id, true);
    }
    sideLinks.forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        showLesson(a.getAttribute("data-lesson"), true);
      });
    });
    if (prevBtn) prevBtn.addEventListener("click", function () { go(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { go(1); });

    var start = (location.hash || "").replace("#", "");
    var exists = lessons.some(function (l) { return l.id === start; });
    showLesson(exists ? start : lessons[0].id, false);

    /* Reader protection: block right-click and printing keys.
       Copy buttons keep working — copying prompts is the product. */
    document.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) e.preventDefault();
    });
  }
})();
