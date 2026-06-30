/* Bandaged Dove — home page controller.
   Framework-free re-implementation of the original Base44 (x-dc/React) design.
   No external dependencies. Drives: direction switch (A Broadsheet / B Gallery),
   IV-line scroll progress, reveal-on-scroll, caption toggle, Four-Worlds skin takeover. */
(function () {
  'use strict';

  // ---- Content data (ported verbatim from the design) ----
  var recent = [
    { img: '/art/p-economy.png',   kicker: 'U.S. Consumer Sentiment', title: 'Best Economy Ever',                       tag: 'Explainer · Main World', egg: 'The line only goes up if you crop it there.' },
    { img: '/art/p-polling.png',   kicker: 'Actual Quote · Speaker',  title: 'The People Decide',                      tag: 'Reality · Main World',   egg: 'Count the men guarding the box. Now count the box.' },
    { img: '/art/p-bills.png',     kicker: 'Follow the Money',        title: 'Bills In, Bills Out',                    tag: 'Explainer · Main World', egg: '$457.3M in, one orphan-drug exemption out. Sourced.' },
    { img: '/art/p-socdem.png',    kicker: 'Communism, Explained',    title: 'It Was Social Democracy The Whole Time', tag: 'Explainer · Main World', egg: 'Rent freeze, free buses, child care. Read the fine print.' },
    { img: '/art/p-gop-false.png', kicker: 'Dovebrain Foundation',    title: '86.7% Proven Completely False',          tag: 'Reality · Main World',   egg: '*these numbers are totally made up (so were theirs).' },
    { img: '/art/p-home-week.png', kicker: 'At Home, Off Duty',       title: 'This Week On The Bandaged Dove',         tag: "A Dove’s Life",     egg: "Sunday’s chore is rest. It rarely gets done." },
    { img: '/art/p-reflecting.png',kicker: 'The Story So Far',        title: 'The Reflecting Pool',                    tag: 'Realm of Triumph',       egg: 'Overpromised. Underdelivered. It reflects someone.' },
    { img: '/art/p-demsoc.png',    kicker: 'Communism, Explained',    title: 'Democratic Socialism, Defined',          tag: 'Explainer · Main World', egg: 'The horizon, not the legislation.' }
  ];

  var skins = {
    main:     { kicker: 'Reality / Editorial', name: 'The Main World', sub: 'Fact-checked. Both-sides armor on.', body: 'The default reality — ink black, gauze off-white, peace blue. The serene official shell against which the other three worlds read as departures. The Dove on the real news, sourced before it bleeds. The explainer series lives here too.', img: '/art/p-gop-false.png', bg: '#ECE5D6', ink: '#1c1814', accent: '#3f5a70', font: "'Saira Condensed',sans-serif" },
    rot:      { kicker: "Engraving · The regime’s dream", name: 'Realm of Triumph', sub: "Where he imagines he’s the Hierophant.", body: 'A rendered 19th-century engraving — ornate, ceremonial, period serif. The Dove drops in as a tourist: Hawaiian shirt, neck-strap camera, a REALM OF REALITY passport, IV pole still attached. Reality as the regime would paint it.', img: '/art/p-reflecting.png', bg: '#d8c8a6', ink: '#3a2c16', accent: '#8a6a32', font: "'Playfair Display',serif" },
    domestic: { kicker: "A Dove’s Life · Disability, up close", name: "A Dove’s Life", sub: 'Two people, one disabled, getting through the day.', body: "The warmest, most intimate register. The bandage and the IV aren’t a wound that heals — they’re the permanent condition. The comedy is the coping kind: you laugh because you have to. Never pity, never a lesson.", img: '/art/p-home-sunday.png', bg: '#e8ddca', ink: '#3a2f24', accent: '#8a6f52', font: "'Saira Condensed',sans-serif" },
    scored:   { kicker: 'Scored Pieces · Music', name: 'The Scored Pieces', sub: 'Original score. Picture cut to the track.', body: 'Short scored films, not static panels. An original score is generated, then the visuals are cut and synced to it. The buried-irony rule applies hardest here: the surface of the track must collide with the subtext of the images — never confirm it.', img: '/art/dove-standing.png', bg: '#15130f', ink: '#f1e9d8', accent: '#c8a24a', font: "'Bricolage Grotesque',sans-serif" }
  };

  var heroCaptions = {
    deadpan: 'A clarification was issued regarding the terminology.',
    sharp: "It’s in the dictionary. He’s the one who hasn’t read it."
  };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var shown = (typeof WeakSet !== 'undefined') ? new WeakSet() : null;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // ---- Direction switch ----
  function setDirection(dir) {
    $all('[data-dir]').forEach(function (el) {
      el.style.display = (el.getAttribute('data-dir') === dir) ? '' : 'none';
    });
    $all('[data-dir-btn]').forEach(function (btn) {
      var on = btn.getAttribute('data-dir-btn') === dir;
      var u = btn.querySelector('[data-underline]');
      if (u) u.style.display = on ? '' : 'none';
    });
    window.scrollTo(0, 0);
    requestAnimationFrame(function () { setupReveals(); updateProgress(); });
  }

  // ---- Recent grids ----
  function cardA(r) {
    return '<div class="bd-card" tabindex="0" style="display:flex;flex-direction:column;border:1.5px solid #1c1814;background:#E7DFCD;cursor:pointer;transition:transform .3s,box-shadow .3s;">'
      + '<div style="position:relative;overflow:hidden;border-bottom:1.5px solid #1c1814;aspect-ratio:1024/1500;background:#000;">'
      + '<img src="' + r.img + '" alt="' + esc(r.title) + '" style="width:100%;height:100%;object-fit:cover;object-position:top center;display:block;">'
      + '<div class="bd-egg" style="position:absolute;left:0;right:0;bottom:0;background:linear-gradient(180deg,rgba(28,24,20,0),rgba(28,24,20,.94));color:#ECE5D6;padding:30px 13px 13px;opacity:0;transition:opacity .35s;font-family:\'IBM Plex Mono\',monospace;font-size:10px;line-height:1.45;letter-spacing:.02em;"><span style="color:#e7a99c;">↳ </span>' + esc(r.egg) + '</div>'
      + '</div>'
      + '<div style="padding:12px 13px 15px;">'
      + '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:#A23B2E;">' + esc(r.kicker) + '</div>'
      + '<div style="font-family:\'Saira Condensed\',sans-serif;font-weight:600;text-transform:uppercase;font-size:18px;line-height:1.0;margin-top:7px;color:#1c1814;">' + esc(r.title) + '</div>'
      + '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;color:#9a8d75;margin-top:9px;">' + esc(r.tag) + '</div>'
      + '</div></div>';
  }
  function cardB(r) {
    return '<div class="bd-card" tabindex="0" style="cursor:pointer;">'
      + '<div class="bd-cardB-frame" style="position:relative;overflow:hidden;border:1.5px solid #1c1814;aspect-ratio:1024/1480;background:#000;box-shadow:8px 8px 0 rgba(28,24,20,.08);transition:box-shadow .3s,transform .3s;">'
      + '<img src="' + r.img + '" alt="' + esc(r.title) + '" style="width:100%;height:100%;object-fit:cover;object-position:top center;display:block;">'
      + '<div class="bd-egg" style="position:absolute;left:0;right:0;bottom:0;background:linear-gradient(180deg,rgba(28,24,20,0),rgba(28,24,20,.94));color:#ECE5D6;padding:34px 14px 14px;opacity:0;transition:opacity .35s;font-family:\'IBM Plex Mono\',monospace;font-size:10px;line-height:1.45;"><span style="color:#e7a99c;">↳ </span>' + esc(r.egg) + '</div>'
      + '</div>'
      + '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:#A23B2E;margin-top:11px;">' + esc(r.kicker) + '</div>'
      + '<div style="font-family:\'Bricolage Grotesque\',sans-serif;font-weight:700;font-size:19px;line-height:1.04;margin-top:5px;color:#1c1814;">' + esc(r.title) + '</div>'
      + '</div>';
  }
  function renderGrids() {
    var ga = $('#recent-grid-a'); if (ga) ga.innerHTML = recent.map(cardA).join('');
    var gb = $('#recent-grid-b'); if (gb) gb.innerHTML = recent.slice(0, 4).map(cardB).join('');
    bindEggs();
  }
  function bindEggs() {
    $all('.bd-card').forEach(function (card) {
      var egg = card.querySelector('.bd-egg');
      var frame = card.querySelector('.bd-cardB-frame');
      function on() {
        if (egg) egg.style.opacity = '1';
        card.style.transform = 'translateY(-5px)';
        if (!frame) card.style.boxShadow = '7px 9px 0 rgba(28,24,20,.12)';
        else { frame.style.transform = 'translateY(-4px)'; frame.style.boxShadow = '12px 12px 0 rgba(28,24,20,.12)'; }
      }
      function off() {
        if (egg) egg.style.opacity = '0';
        card.style.transform = '';
        card.style.boxShadow = '';
        if (frame) { frame.style.transform = ''; frame.style.boxShadow = '8px 8px 0 rgba(28,24,20,.08)'; }
      }
      card.addEventListener('mouseenter', on);
      card.addEventListener('mouseleave', off);
      card.addEventListener('focus', on);
      card.addEventListener('blur', off);
    });
  }

  // ---- Caption toggle ----
  function setHero(sharp) {
    $all('[data-hero-text]').forEach(function (el) { el.textContent = sharp ? heroCaptions.sharp : heroCaptions.deadpan; });
    $all('[data-hero-toggle]').forEach(function (wrap) {
      var dp = wrap.querySelector('[data-dot="deadpan"]');
      var sp = wrap.querySelector('[data-dot="sharp"]');
      if (dp) dp.style.cssText = sharp ? dotOff() : dotOn();
      if (sp) sp.style.cssText = sharp ? dotOn() : dotOff();
    });
  }
  function dotOn() { return 'width:7px;height:7px;background:#A23B2E;display:inline-block;'; }
  function dotOff() { return 'width:7px;height:7px;border:1px solid #9a8d75;display:inline-block;'; }

  // ---- IV-line scroll progress + reveal ----
  var raf = null;
  function onScroll() { if (raf) return; raf = requestAnimationFrame(function () { raf = null; updateProgress(); }); }
  function updateProgress() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, (window.scrollY || doc.scrollTop) / max)) : 0;
    var track = $('#iv-track'), fill = $('#iv-fill'), drop = $('#iv-drop');
    if (track && fill) {
      var h = track.clientHeight;
      fill.style.height = (p * h) + 'px';
      if (drop) drop.style.top = (p * h) + 'px';
    }
    revealInView();
  }
  function setupReveals() {
    var els = $all('[data-reveal]');
    if (reduced) { els.forEach(function (e) { e.style.opacity = '1'; e.style.transform = 'none'; }); return; }
    els.forEach(function (e) {
      if (e.offsetParent === null) return; // hidden (other direction)
      if (shown && shown.has(e)) { e.style.opacity = '1'; e.style.transform = 'none'; return; }
      if (!e.__init) {
        e.__init = true;
        e.style.opacity = '0';
        e.style.transform = 'translateY(22px)';
        e.style.transition = 'opacity .7s cubic-bezier(.22,.61,.36,1), transform .7s cubic-bezier(.22,.61,.36,1)';
      }
    });
    revealInView();
  }
  function revealInView() {
    if (reduced) return;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    $all('[data-reveal]').forEach(function (e) {
      if (shown && shown.has(e)) { e.style.opacity = '1'; e.style.transform = 'none'; return; }
      var r = e.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > -40) {
        e.style.opacity = '1';
        e.style.transform = 'none';
        if (shown) shown.add(e);
      }
    });
  }

  // ---- Four-Worlds skin takeover ----
  function openSkin(id) {
    var s = skins[id]; if (!s) return;
    var isRot = id === 'rot', isScored = id === 'scored';
    var bars = '';
    if (isScored) {
      var heights = [38,72,50,92,64,100,46,80,34,70,54,88];
      bars = '<div style="display:flex;align-items:flex-end;gap:4px;height:46px;margin-top:24px;">'
        + heights.map(function (h) { return '<div style="width:5px;height:' + h + '%;background:' + s.accent + ';"></div>'; }).join('')
        + '</div>'
        + '<div style="display:inline-flex;align-items:center;gap:10px;margin-top:20px;border:1.5px solid ' + s.accent + ';color:' + s.accent + ';padding:11px 20px;font-family:\'IBM Plex Mono\',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;">▶ Play · Sound on</div>';
    }
    var imgBlock = isRot
      ? '<div style="position:relative;padding:14px;border:2px double ' + s.accent + ';background:rgba(0,0,0,.06);box-shadow:0 18px 40px rgba(0,0,0,.28);">'
        + '<div style="position:absolute;top:5px;left:7px;font-family:\'Playfair Display\',serif;color:' + s.accent + ';">❧</div>'
        + '<div style="position:absolute;top:5px;right:7px;font-family:\'Playfair Display\',serif;color:' + s.accent + ';transform:scaleX(-1);">❧</div>'
        + '<img src="' + s.img + '" alt="' + esc(s.name) + '" style="width:100%;display:block;">'
        + '<div style="position:absolute;right:-6px;bottom:18px;background:' + s.accent + ';color:#fff;font-family:\'Playfair Display\',serif;font-style:italic;font-weight:700;font-size:15px;padding:7px 16px 7px 13px;box-shadow:0 4px 12px rgba(0,0,0,.3);clip-path:polygon(0 0,100% 0,90% 50%,100% 100%,0 100%);animation:ribbonNudge 1.8s ease-in-out infinite;">Swipe →</div>'
        + '</div>'
      : '<div style="border:1.5px solid ' + s.accent + ';background:rgba(0,0,0,.12);padding:12px;box-shadow:0 18px 40px rgba(0,0,0,.3);"><img src="' + s.img + '" alt="' + esc(s.name) + '" style="width:100%;display:block;"></div>';

    var overlay = document.createElement('div');
    overlay.id = 'bd-skin';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:100;overflow:auto;animation:stepThrough .5s cubic-bezier(.22,.61,.36,1);background:' + s.bg + ';color:' + s.ink + ';';
    overlay.innerHTML =
      '<div data-stop style="min-height:100vh;display:flex;flex-direction:column;">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;padding:18px clamp(20px,4vw,52px);border-bottom:1px solid ' + s.accent + ';">'
      + '<button data-close style="appearance:none;background:transparent;border:1.5px solid ' + s.accent + ';color:' + s.ink + ';font-family:\'IBM Plex Mono\',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;padding:9px 16px;cursor:pointer;">← Back to reality</button>'
      + '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:' + s.accent + ';">World-skin · ' + esc(s.kicker) + '</div>'
      + '</div>'
      + '<div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:clamp(28px,5vw,72px);align-items:center;padding:clamp(28px,5vw,64px) clamp(20px,4vw,52px);">'
      + '<div style="position:relative;justify-self:center;max-width:460px;width:100%;">' + imgBlock + '</div>'
      + '<div style="max-width:520px;">'
      + '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:' + s.accent + ';">Entering</div>'
      + '<h2 style="font-family:' + s.font + ';font-weight:800;font-size:clamp(38px,6vw,82px);line-height:.9;margin:10px 0 0;color:' + s.ink + ';">' + esc(s.name) + '</h2>'
      + '<div style="font-family:\'Newsreader\',serif;font-style:italic;font-size:clamp(17px,1.8vw,22px);color:' + s.ink + ';opacity:.82;margin-top:12px;">' + esc(s.sub) + '</div>'
      + '<p style="font-family:\'Newsreader\',serif;font-size:clamp(15px,1.5vw,18px);line-height:1.55;color:' + s.ink + ';opacity:.9;margin-top:18px;max-width:46ch;">' + esc(s.body) + '</p>'
      + '<a href="/world/' + id + '/" style="display:inline-block;margin-top:22px;text-decoration:none;border:1.5px solid ' + s.accent + ';color:' + s.ink + ';font-family:\'IBM Plex Mono\',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;padding:12px 20px;">Enter the full ' + esc(s.name) + ' →</a>'
      + bars
      + '<div style="margin-top:26px;display:flex;align-items:center;gap:11px;">'
      + '<div style="width:24px;height:32px;background:rgba(0,0,0,.08);border:1.4px solid ' + s.accent + ';border-radius:3px 3px 6px 6px;display:flex;align-items:center;justify-content:center;"><span style="font-family:\'IBM Plex Mono\',monospace;font-size:4.6px;line-height:1.05;text-align:center;color:' + s.ink + ';">PEACE<br>ON<br>EARTH</span></div>'
      + '<span style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:' + s.accent + ';">IV pole always present · always connected</span>'
      + '</div>'
      + '</div>'
      + '</div>'
      + '</div>';

    overlay.addEventListener('click', closeSkin);
    overlay.querySelector('[data-stop]').addEventListener('click', function (e) { e.stopPropagation(); });
    overlay.querySelector('[data-close]').addEventListener('click', closeSkin);
    document.body.appendChild(overlay);
    try { document.body.style.overflow = 'hidden'; } catch (e) {}
  }
  function closeSkin() {
    var o = $('#bd-skin'); if (o) o.parentNode.removeChild(o);
    try { document.body.style.overflow = ''; } catch (e) {}
  }

  // ---- Wire up ----
  function init() {
    renderGrids();
    setHero(false);
    setDirection('A');

    $all('[data-dir-btn]').forEach(function (b) {
      b.addEventListener('click', function () { setDirection(b.getAttribute('data-dir-btn')); });
    });
    $all('[data-set-hero]').forEach(function (b) {
      b.addEventListener('click', function () { setHero(b.getAttribute('data-set-hero') === 'sharp'); });
    });
    $all('[data-skin]').forEach(function (b) {
      b.addEventListener('click', function () { openSkin(b.getAttribute('data-skin')); });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSkin(); });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    setupReveals();
    updateProgress();
    [80, 260, 600].forEach(function (t) { setTimeout(revealInView, t); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
