/* Amazing Postnatal Care — static site behaviour. Plain browser JS, no build step. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile nav ---------- */
  function nav() {
    var burger = $('[data-nav-toggle]'), drawer = $('[data-nav-drawer]'), close = $('[data-nav-close]');
    if (!burger || !drawer) return;
    burger.addEventListener('click', function () { drawer.classList.add('is-open'); });
    if (close) close.addEventListener('click', function () { drawer.classList.remove('is-open'); });
    $$('a', drawer).forEach(function (a) {
      a.addEventListener('click', function () { drawer.classList.remove('is-open'); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') drawer.classList.remove('is-open');
    });
  }

  /* ---------- page transition veil ---------- */
  function transitions() {
    var veil = $('[data-page-veil]');
    if (!veil) return;
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || a.target === '_blank' || !/^[a-z0-9._-]+\.html(#.*)?$/i.test(href)) return;
      var here = location.pathname.split('/').pop() || 'index.html';
      if (href.split('#')[0] === here) return;
      e.preventDefault();
      veil.classList.add('is-on');
      setTimeout(function () { location.href = href; }, 380);
    });
    window.addEventListener('pageshow', function () { veil.classList.remove('is-on'); });
  }

  /* ---------- reveal on scroll ---------- */
  function reveals() {
    var items = $$('[data-reveal]');
    if (!items.length) return;
    if (reduce || !('IntersectionObserver' in window)) return;
    var vh = window.innerHeight;
    var pending = items.filter(function (el) { return el.getBoundingClientRect().top > vh * 0.9; });
    pending.forEach(function (el) { el.classList.add('reveal-pending'); });
    var showEl = function (el, delay) {
      if (!el.classList.contains('reveal-pending')) return;
      setTimeout(function () { el.classList.remove('reveal-pending'); el.classList.add('reveal-in'); }, delay || 0);
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        showEl(en.target, (parseInt(en.target.getAttribute('data-reveal'), 10) || 1) * 70);
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
    pending.forEach(function (el) { io.observe(el); });
    // backstop 1: plain scroll check, in case the observer never fires
    var sweep = function () {
      pending.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.95 && r.bottom > 0) showEl(el, 0);
      });
    };
    window.addEventListener('scroll', sweep, true);
    window.addEventListener('resize', sweep);
    sweep();
    // backstop 2: never leave content invisible
    setTimeout(function () { pending.forEach(function (el) { showEl(el, 0); }); }, 1600);
  }

  /* ---------- number counters ---------- */
  function counters() {
    var nodes = $$('[data-count]');
    if (!nodes.length) return;
    var run = function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      var suffix = el.querySelector('span') ? el.querySelector('span').outerHTML : '';
      if (reduce) { el.innerHTML = target + suffix; return; }
      var start = performance.now(), dur = 1400;
      var step = function (now) {
        var p = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.innerHTML = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    var started = [];
    var kick = function (el) { if (started.indexOf(el) > -1) return; started.push(el); run(el); };
    if (!('IntersectionObserver' in window)) { nodes.forEach(kick); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { kick(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.2 });
    nodes.forEach(function (el) { io.observe(el); });
    var sweep = function () {
      nodes.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) kick(el);
      });
    };
    window.addEventListener('scroll', sweep, true);
    sweep();
    setTimeout(function () { nodes.forEach(kick); }, 2200);
  }

  /* ---------- testimonial switcher ---------- */
  function testimonials() {
    var tabs = $$('[data-tm-tab]'), panels = $$('[data-tm-panel]');
    if (!tabs.length || !panels.length) return;
    var show = function (i) {
      tabs.forEach(function (t, n) { t.classList.toggle('is-active', n === i); });
      panels.forEach(function (p, n) { p.classList.toggle('is-active', n === i); });
    };
    tabs.forEach(function (t, i) { t.addEventListener('click', function () { show(i); }); });
    show(0);
  }

  /* ---------- video modal ---------- */
  function video() {
    var modal = $('[data-video-modal]');
    if (!modal) return;
    var frame = $('[data-video-frame]', modal);
    var open = function (id) {
      frame.innerHTML = '<iframe src="https://www.youtube.com/embed/' + id +
        '?autoplay=1&rel=0" title="\u4e13\u8bbf\u5f71\u7247" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
      modal.classList.add('is-open');
    };
    var shut = function () { modal.classList.remove('is-open'); frame.innerHTML = ''; };
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest && e.target.closest('[data-yt]');
      if (trigger) {
        var id = trigger.getAttribute('data-yt');
        if (id) { e.preventDefault(); open(id); }
        return;
      }
      if (e.target.closest && e.target.closest('[data-video-modal]')) shut();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
  }

  /* ---------- generic panel switchers (meals / rooms) ---------- */
  function panels() {
    $$('[data-switch]').forEach(function (group) {
      var name = group.getAttribute('data-switch');
      var tabs = $$('[data-switch-tab="' + name + '"]');
      var items = $$('[data-panel][data-panel-group="' + name + '"]');
      if (!items.length) return;
      var active = 0;
      var mirrors = $$('[data-switch-mirror="' + name + '"]');
      var mirrorItems = [];
      mirrors.forEach(function (m) {
        mirrorItems = mirrorItems.concat($$('[data-panel]', m));
      });
      var show = function (i) {
        active = (i + items.length) % items.length;
        items.forEach(function (p, n) { p.classList.toggle('is-active', n === active); });
        mirrorItems.forEach(function (p, n) { p.classList.toggle('is-active', n === active); });
        requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });
        tabs.forEach(function (t, n) {
          var on = n === active;
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          if (t.hasAttribute('data-tab-style-on')) {
            t.setAttribute('style', t.getAttribute(on ? 'data-tab-style-on' : 'data-tab-style-off'));
          }
        });
        var range = $('[data-switch-range="' + name + '"]');
        if (range) range.value = String(active);
      };
      tabs.forEach(function (t, i) { t.addEventListener('click', function () { show(i); }); });
      var prev = $('[data-switch-prev="' + name + '"]'), next = $('[data-switch-next="' + name + '"]');
      if (prev) prev.addEventListener('click', function () { show(active - 1); });
      if (next) next.addEventListener('click', function () { show(active + 1); });
      var range2 = $('[data-switch-range="' + name + '"]');
      if (range2) range2.addEventListener('input', function (e) { show(Number(e.target.value)); });
      show(0);
    });
  }

  /* ---------- transform-track carousels ---------- */
  function tracks() {
    $$('[data-track]').forEach(function (track) {
      var name = track.getAttribute('data-track');
      var slides = track.children.length;
      if (!slides) return;
      var dots = $$('[data-track-dot="' + name + '"]');
      var idx = 0, timer = null;
      var paint = function () {
        var w = track.parentElement ? track.parentElement.clientWidth : track.clientWidth;
        track.style.transform = 'translate3d(' + (-idx * w) + 'px,0,0)';
        dots.forEach(function (d, n) {
          var on = n === idx;
          if (d.hasAttribute('data-dot-on')) d.setAttribute('style', d.getAttribute(on ? 'data-dot-on' : 'data-dot-off'));
        });
      };
      var go = function (n) { idx = (n + slides) % slides; paint(); };
      dots.forEach(function (d, n) { d.addEventListener('click', function () { go(n); stop(); }); });
      var p = $('[data-track-prev="' + name + '"]'), nx = $('[data-track-next="' + name + '"]');
      if (p) p.addEventListener('click', function () { go(idx - 1); stop(); });
      if (nx) nx.addEventListener('click', function () { go(idx + 1); stop(); });
      function stop() { if (timer) { clearInterval(timer); timer = null; } }
      window.addEventListener('resize', paint);
      paint();
      if (!reduce && track.hasAttribute('data-track-auto')) timer = setInterval(function () { go(idx + 1); }, 2600);
    });
  }

  /* ---------- horizontal photo carousels ---------- */
  function carousels() {
    $$('[data-carousel]').forEach(function (track) {
      var name = track.getAttribute('data-carousel');
      var go = function (dir) {
        var w = track.clientWidth;
        track.scrollBy({ left: dir * w, behavior: reduce ? 'auto' : 'smooth' });
      };
      var p = $('[data-carousel-prev="' + name + '"]'), n = $('[data-carousel-next="' + name + '"]');
      if (p) p.addEventListener('click', function () { go(-1); });
      if (n) n.addEventListener('click', function () { go(1); });
    });
  }

  /* ---------- home: care illustration hotspots ---------- */
  function hotspots() {
    if (!$('[data-care]')) return;
    var set = function (key) {
      ['mama', 'baby'].forEach(function (k) {
        var card = $('[data-care="' + k + '"]');
        var line = $('[data-line="' + k + '"]');
        var on = key === k;
        if (card) {
          card.style.transform = on ? 'translateY(-6px)' : '';
          card.style.boxShadow = on ? '0 20px 44px rgba(93,80,64,.16)' : '';
        }
        if (line) line.style.transform = on ? 'scaleX(1)' : 'scaleX(0)';
      });
      var img = $('[data-care-img]');
      if (img) img.style.transform = key ? 'scale(1.035)' : 'none';
    };
    document.addEventListener('mouseover', function (e) {
      var hot = e.target.closest && e.target.closest('[data-hot]');
      var card = e.target.closest && e.target.closest('[data-care]');
      set(hot ? hot.getAttribute('data-hot') : (card ? card.getAttribute('data-care') : null));
    });
  }

  /* ---------- home: rotating meal card stack ---------- */
  function mealStack() {
    var cards = $$('[data-meal]');
    if (cards.length < 2) return;
    var n = cards.length, active = 0, timer = null;
    var dotWrap = $('[data-meal-dots]'), dots = [];
    if (dotWrap && !dotWrap.children.length) {
      cards.forEach(function (_, i) {
        var d = document.createElement('button');
        d.type = 'button';
        d.setAttribute('aria-label', '第 ' + (i + 1) + ' 张餐卡');
        d.style.cssText = 'border:none; cursor:pointer; width:7px; height:7px; border-radius:999px; padding:0; background:var(--stone); transition:all 240ms cubic-bezier(.16,1,.3,1)';
        d.addEventListener('click', function () { active = i; paint(); restart(); });
        dotWrap.appendChild(d);
      });
      dots = Array.prototype.slice.call(dotWrap.children);
    }
    function paint() {
      cards.forEach(function (c, i) {
        var d = (i - active + n) % n;
        var depth = d > 2 ? 3 : d;
        c.style.zIndex = String(n - depth);
        c.style.opacity = depth > 2 ? '0' : '1';
        c.style.transform = 'translateX(-50%) translateY(' + (depth * 26) + 'px) scale(' + (1 - depth * 0.05) + ')';
      });
      dots.forEach(function (d, i) {
        d.style.background = i === active ? 'var(--rose-deep)' : 'var(--stone)';
        d.style.width = i === active ? '18px' : '7px';
      });
    }
    function restart() {
      if (timer) clearInterval(timer);
      if (!reduce) timer = setInterval(function () { active = (active + 1) % n; paint(); }, 3200);
    }
    var go = function (step) { active = (active + step + n) % n; paint(); restart(); };
    var prev = $('[data-meal-nav="prev"]'), next = $('[data-meal-nav="next"]');
    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });
    paint();
    restart();
  }

  function init() {
    nav(); transitions(); reveals(); counters(); testimonials(); video();
    panels(); tracks(); carousels(); hotspots(); mealStack();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
