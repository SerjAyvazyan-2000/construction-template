/* =========================================================================
   ОСНОВА — логика и анимации. Весь контент — в assets/js/config.js
   ========================================================================= */
(function () {
  "use strict";

  const C = window.SITE_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const get = (p) => p.split(".").reduce((o, k) => (o == null ? o : o[k]), C);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n, l = 2) => String(n).padStart(l, "0");
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const money = (n) => Math.round(n).toLocaleString("ru-RU");
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const NS = "http://www.w3.org/2000/svg";
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* недоступно */ } }
  };

  /* единый цикл скролла */
  const onScroll = [];
  let ticking = false;
  const run = () => { onScroll.forEach((f) => f()); ticking = false; };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
  addEventListener("resize", () => requestAnimationFrame(run));

  /* ===================== 1. Тема, SEO, привязки ===================== */
  function setup() {
    const t = C.theme || {}, st = document.documentElement.style;
    if (t.accent) st.setProperty("--accent", t.accent);
    if (t.paper) st.setProperty("--paper", t.paper);
    if (t.ink) st.setProperty("--ink", t.ink);
    if (C.seo?.title) document.title = C.seo.title;
    if (C.seo?.description) $('meta[name="description"]').setAttribute("content", C.seo.description);
    $$("[data-bind]").forEach((el) => { const v = get(el.dataset.bind); if (v != null) el.textContent = v; });
    $$("[data-href-bind]").forEach((el) => { const v = get(el.dataset.hrefBind); if (v) el.href = v; });
    $$('[data-href="tel"]').forEach((el) => { el.href = "tel:" + String(get("contacts.phone") || "").replace(/[^\d+]/g, ""); });
    $$('[data-href="mailto"]').forEach((el) => { el.href = "mailto:" + (get("contacts.email") || ""); });
    $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
  }

  /* ===================== 2. Рендер блоков ===================== */
  const ICONS = {
    house: '<path pathLength="1" d="M8 48 L50 12 L92 48"/><rect pathLength="1" x="20" y="42" width="60" height="48"/><rect pathLength="1" x="42" y="64" width="16" height="26"/><rect pathLength="1" x="27" y="52" width="10" height="10"/><rect pathLength="1" x="63" y="52" width="10" height="10"/>',
    design: '<rect pathLength="1" x="12" y="12" width="76" height="76"/><path pathLength="1" d="M12 38 H88 M38 12 V88"/><path pathLength="1" d="M50 50 L80 80 M80 80 V66 M80 80 H66"/><circle pathLength="1" cx="64" cy="26" r="7"/>',
    foundation: '<path pathLength="1" d="M8 64 H92 M18 64 V84 H82 V64"/><path pathLength="1" d="M30 64 V34 H70 V64 M30 46 H70"/><path pathLength="1" d="M22 84 L30 76 M38 84 L46 76 M54 84 L62 76 M70 84 L78 76"/>',
    office: '<rect pathLength="1" x="22" y="10" width="56" height="80"/><path pathLength="1" d="M33 24 H45 M55 24 H67 M33 38 H45 M55 38 H67 M33 52 H45 M55 52 H67 M44 90 V72 H56 V90"/>',
    repair: '<path pathLength="1" d="M16 86 L58 44"/><path pathLength="1" d="M50 26 L74 50 L64 60 L40 36 Z"/><path pathLength="1" d="M60 18 C68 12 80 14 86 22 L80 28"/><circle pathLength="1" cx="22" cy="80" r="4"/>',
    cottage: '<path pathLength="1" d="M6 54 L36 28 L66 54 M44 40 L70 18 L94 40"/><rect pathLength="1" x="14" y="50" width="44" height="38"/><rect pathLength="1" x="62" y="36" width="26" height="52"/>'
  };

  const R = {
    heroTitle: () => (get("hero.title") || []).map((w, i) => `<span class="hw"><span style="--i:${i}">${esc(w)}</span></span>`).join(""),
    tapes: () => { const s = (C.tapes || []).map((t) => `<span>${esc(t)}</span>`).join(""); return s + s + s; },
    stats: () => (C.stats || []).map((s, i) =>
      `<div class="stat reveal" style="--d:${i * .08}s"><b><span data-count="${+s.value || 0}">0</span>${s.suffix ? `<sup>${esc(s.suffix)}</sup>` : ""}</b><p>${esc(s.label)}</p></div>`).join(""),
    services: () => (C.services || []).map((s, i) =>
      `<article class="svc reveal${s.big ? " svc--big" : ""}${s.wide ? " svc--wide" : ""}" style="--d:${i * .06}s">
        <div class="svc__top"><svg class="svc__ic" viewBox="0 0 100 100" aria-hidden="true">${ICONS[s.icon] || ICONS.house}</svg><span class="svc__n">${pad(i + 1)}</span></div>
        <div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>
          <div class="svc__foot"><span class="svc__price">${esc(s.price)}</span><a href="#request" class="svc__arrow" aria-label="Заявка: ${esc(s.title)}">→</a></div></div>
      </article>`).join(""),
    projectList: () => (C.projects || []).map((p, i) =>
      `<li class="pitem" data-i="${i}"><span class="pitem__n">${pad(i + 1)} / ${pad(C.projects.length)} · ${esc(p.type)}</span>
        <h3>${esc(p.name)}</h3>
        <dl><div><dt>Площадь</dt><dd>${esc(p.area)}</dd></div><div><dt>Срок</dt><dd>${esc(p.time)}</dd></div><div><dt>Место</dt><dd>${esc(p.place)}</dd></div></dl>
        <img class="pitem__img" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy"></li>`).join(""),
    projectImages: () => (C.projects || []).map((p, i) => `<img src="${esc(p.image)}" alt="${esc(p.name)}" data-i="${i}"${i === 0 ? ' class="on"' : ""}>`).join(""),
    stages: () => (C.stages || []).map((s, i) =>
      `<li class="st reveal" data-mark="${esc(s.mark)}"><span class="st__mark">${esc(s.mark)}</span><span class="st__n">Этап ${pad(i + 1)}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join(""),
    materials: () => (get("calculator.materials") || []).map((m, i) =>
      `<button type="button" class="chip" role="radio" aria-checked="${i === 0}" data-mat="${i}">${esc(m.name)}<small>${money(m.price)} ₽/м²</small></button>`).join(""),
    extras: () => (get("calculator.extras") || []).map((x, i) =>
      `<label class="tg"><input type="checkbox" data-extra="${i}"${i < 2 ? " checked" : ""}><span class="tg__name">${esc(x.name)}</span>
        <span class="tg__price">${x.fixed ? money(x.fixed) + " ₽" : "+" + money(x.perM2) + " ₽/м²"}</span><span class="tg__ui" aria-hidden="true"></span></label>`).join(""),
    stamps: () => (C.stamps || []).map((s, i) =>
      `<div class="stamp" style="--i:${i}"><span class="stamp__top">${esc(s.top)}</span><span class="stamp__big">${esc(s.big)}</span><span class="stamp__bot">${esc(s.bottom)}</span></div>`).join(""),
    reviews: () => (C.reviews || []).map((r, i) =>
      `<figure class="note reveal" style="--d:${i * .1}s"><div class="note__stars" aria-label="5 из 5">★★★★★</div><blockquote class="note__text" style="margin:0 0 20px">«${esc(r.text)}»</blockquote>
        <figcaption class="note__who"><b>${esc(r.name)}</b><span>${esc(r.obj)}</span></figcaption></figure>`).join(""),
    faq: () => (C.faq || []).map((f, i) =>
      `<div class="qa${i === 0 ? " open" : ""}"><button type="button" class="qa__btn" aria-expanded="${i === 0}" aria-controls="qa${i}">${esc(f.q)}<span class="qa__ic" aria-hidden="true">+</span></button>
        <div class="qa__body" id="qa${i}" role="region"><div><p>${esc(f.a)}</p></div></div></div>`).join(""),
    socials: () => (C.socials || []).map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>`).join(""),
    map: () => {
      const src = get("contacts.mapEmbed");
      if (src) return `<iframe src="${esc(src)}" loading="lazy" title="Карта" allowfullscreen></iframe>`;
      return `<svg viewBox="0 0 600 480" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs><pattern id="mg" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="rgba(23,23,21,.08)"/></pattern>
        <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V8" stroke="rgba(23,23,21,.25)" stroke-width="2"/></pattern></defs>
        <rect width="600" height="480" fill="#e1ddd3"/><rect width="600" height="480" fill="url(#mg)"/>
        <path d="M-10 330 C140 300 260 380 400 340 S560 280 620 300" stroke="#c9d3e6" stroke-width="44" fill="none"/>
        <g stroke="#ebe8e1" stroke-width="16"><path d="M-10 120 H620"/><path d="M-10 240 L620 210"/><path d="M160 -10 V490"/><path d="M420 -10 L460 490"/></g>
        <g fill="url(#hatch)" stroke="#171715" stroke-width="1.5"><rect x="190" y="140" width="90" height="60"/><rect x="320" y="40" width="80" height="60"/><rect x="480" y="130" width="90" height="70"/><rect x="40" y="150" width="90" height="70"/><rect x="190" y="380" width="120" height="70"/></g>
        <rect x="320" y="140" width="80" height="58" fill="#ffc400" stroke="#171715" stroke-width="2"/>
      </svg>
      <div class="map__pin"><b>${esc(get("brand.name"))} · ${esc(get("contacts.address"))}</b><i></i></div>
      <a class="btn btn--dark btn--sm" href="${esc(get("contacts.mapLink") || "#")}" target="_blank" rel="noopener"><span>Маршрут</span></a>`;
    }
  };
  const renderAll = () => $$("[data-render]").forEach((el) => { const f = R[el.dataset.render]; if (f) el.innerHTML = f(); });

  /* ===================== 3. Прелоадер ===================== */
  function loader() {
    const l = $(".loader"), t = $(".loader__t b");
    if (REDUCED) { l.remove(); document.body.classList.add("ready"); return; }
    const t0 = performance.now();
    const step = (now) => {
      const p = clamp((now - t0) / 1200);
      t.textContent = Math.round(ease(p) * 100) + "%";
      if (p < 1) return requestAnimationFrame(step);
      l.classList.add("done");
      setTimeout(() => document.body.classList.add("ready"), 300);
      setTimeout(() => l.remove(), 1200);
    };
    requestAnimationFrame(step);
  }

  /* ===================== 4. Заголовки по словам ===================== */
  function splitHeadings() {
    $$(".split").forEach((el) => {
      let i = 0;
      const walk = (node) => [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(" "));
            const w = document.createElement("span"); w.className = "w";
            const s = document.createElement("span"); s.textContent = part; s.style.setProperty("--i", i++);
            w.appendChild(s); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
      walk(el);
      $$("mark .w", el).forEach((w, k) => w.style.setProperty("--k", k));
    });
  }

  /* ===================== 5. HERO: стройка при прокрутке ===================== */
  function hero() {
    const sec = $(".hero"), svg = $(".scene"), bld = $(".building", svg);
    const N = Math.max(3, Math.min(14, +get("hero.floors") || 9));
    const months = +get("hero.months") || 12;
    const GROUND = 646, BASE = 20, X0 = 175, X1 = 425;
    const FH = Math.min(58, 450 / N);
    const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };

    // кран: мачта и решётка стрелы
    const mast = $(".crane__mast", svg);
    let d = "M556 82 V646 M580 82 V646";
    for (let y = 82; y < 646; y += 24) d += ` M556 ${y} L580 ${y + 24} M580 ${y} L556 ${y + 24}`;
    el("path", { d }, mast);
    const lat = $(".crane__lattice", svg);
    let dl = "";
    for (let x = 90; x < 690; x += 20) dl += ` M${x} 84 L${x + 10} 70 L${x + 20} 84`;
    el("path", { d: dl }, lat);
    // забор
    const fence = $(".scene__fence", svg);
    for (let x = 20; x < 160; x += 46) { el("rect", { x, y: 618, width: 40, height: 28 }, fence); el("path", { d: `M${x} 618 h40 v28 h-40 Z M${x} 632 h40` }, fence); }

    // фундамент
    const base = el("g", { class: "base floor" }, bld);
    el("rect", { x: X0 - 15, y: GROUND - BASE, width: X1 - X0 + 30, height: BASE }, base);
    el("path", { class: "base__hatch", d: Array.from({ length: 14 }, (_, i) => `M${X0 - 10 + i * 20} ${GROUND + 2} l-10 12`).join(" ") }, base);
    // этажи
    const floors = [], wins = [];
    for (let k = 0; k < N; k++) {
      const top = GROUND - BASE - (k + 1) * FH;
      const g = el("g", { class: "floor" }, bld);
      el("rect", { class: "floor__wall", x: X0, y: top + 6, width: X1 - X0, height: FH - 6 }, g);
      el("rect", { class: "floor__slab", x: X0 - 12, y: top, width: X1 - X0 + 24, height: 6 }, g);
      const cols = 4, ww = 34, gap = (X1 - X0 - cols * ww) / (cols + 1);
      for (let c = 0; c < cols; c++) {
        const isDoor = k === 0 && c === 1;
        const w = el("rect", { class: "floor__win", x: X0 + gap + c * (ww + gap), y: top + (isDoor ? 14 : 16), width: ww, height: isDoor ? FH - 14 : FH - 28 }, g);
        if (!isDoor) wins.push(w);
      }
      floors.push({ g, top });
    }
    const roof = el("g", { class: "roof" }, bld);
    const rTop = GROUND - BASE - N * FH;
    el("path", { d: `M${X0 - 12} ${rTop} V${rTop - 14} H${X1 + 12} V${rTop} Z M${X0 + 60} ${rTop - 14} V${rTop - 48} H${X1 - 60} V${rTop - 14} Z` }, roof);
    const tx = el("text", { x: 300, y: rTop - 24, "text-anchor": "middle" }, roof);
    tx.textContent = get("brand.name") || "";
    // порядок окон для подсветки — вперемешку
    const lightOrder = wins.map((w, i) => ({ w, r: Math.sin(i * 12.9898) * 43758.5453 % 1 })).sort((a, b) => a.r - b.r).map((o) => o.w);

    const trolley = $(".crane__trolley", svg), hook = $(".crane__hook", svg), cable = $(".crane__cable", svg), load = $(".crane__load", svg), jib = $(".crane__jib", svg);
    const words = $$(".hero__title .hw");
    const hudF = $(".hud__floor"), hudP = $(".hud__pct"), hudM = $(".hud__month"), hint = $(".hero__hint");
    $(".hud__total").textContent = pad(N);

    const BUILD_START = .06, BUILD_END = .78;
    function update() {
      const r = sec.getBoundingClientRect();
      const p = REDUCED ? 1 : clamp(-r.top / (r.height - innerHeight));
      base.classList.toggle("on", p > .01 || REDUCED);
      const span = (BUILD_END - BUILD_START) / N;
      let built = 0;
      floors.forEach((f, k) => { const on = p >= BUILD_START + (k + 1) * span; f.g.classList.toggle("on", on); if (on) built++; });
      roof.classList.toggle("on", p > BUILD_END + .03);
      const litN = Math.round(clamp((p - .84) / .14) * lightOrder.length);
      lightOrder.forEach((w, i) => w.classList.toggle("lit", i < litN));

      // кран несёт следующую плиту
      let tX = 480, hY = 150, loadOn = 0;
      if (built < N && p >= BUILD_START) {
        const local = clamp((p - BUILD_START - built * span) / span);
        const target = floors[built].top;
        tX = lerp(500, 300, ease(clamp(local * 2)));
        hY = lerp(150, target - 80, ease(clamp(local * 2 - 1)));
        loadOn = 1;
      } else if (p < BUILD_START) { tX = 500; hY = 150; loadOn = 1; }
      trolley.setAttribute("transform", `translate(${tX} 0)`);
      hook.setAttribute("transform", `translate(0 ${hY})`);
      cable.setAttribute("y2", hY);
      load.style.setProperty("--load", loadOn);
      jib.style.setProperty("--jib", Math.sin(p * Math.PI * 3) * 1.2 + "deg");
      svg.style.setProperty("--sun", p * 80 + "px");

      const pct = Math.round(clamp((p - BUILD_START) / (1 - BUILD_START - .02)) * 100);
      hudF.textContent = pad(built); hudP.textContent = pct; hudM.textContent = Math.round(pct / 100 * months);
      words.forEach((w, i) => w.classList.toggle("built", pct >= (i + 1) / words.length * 100 - 1));
      if (hint) hint.style.opacity = p > .05 ? 0 : 1;
    }
    onScroll.push(update);
    update();
  }

  /* ===================== 6. Шапка, меню ===================== */
  function header() {
    const h = $(".header"), fab = $(".fab"), req = $("#request");
    let last = scrollY;
    onScroll.push(() => {
      const y = scrollY;
      h.classList.toggle("scrolled", y > 30);
      h.classList.toggle("hide", y > 500 && y > last && !document.body.classList.contains("locked"));
      last = y;
      const b = req.getBoundingClientRect();
      fab.classList.toggle("on", y > $(".hero").offsetHeight - innerHeight * .5 && (b.top > innerHeight || b.bottom < 0));
    });
    const links = $$(".nav a");
    const io = new IntersectionObserver((en) => en.forEach((e) => {
      if (e.isIntersecting) links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
    }), { rootMargin: "-45% 0px -50% 0px" });
    links.forEach((a) => { const t = $(a.getAttribute("href")); if (t) io.observe(t); });

    const btn = $(".burger"), menu = $("#menu");
    const set = (o) => {
      btn.setAttribute("aria-expanded", o); btn.setAttribute("aria-label", o ? "Закрыть меню" : "Открыть меню");
      menu.classList.toggle("open", o); menu.setAttribute("aria-hidden", !o); document.body.classList.toggle("locked", o);
    };
    btn.addEventListener("click", () => set(btn.getAttribute("aria-expanded") !== "true"));
    $$("a", menu).forEach((a) => a.addEventListener("click", () => set(false)));
    addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
  }

  /* ===================== 7. Курсор-перекрестье, магнитные кнопки ===================== */
  function cursor() {
    if (!FINE || REDUCED) return;
    const c = $(".cross"), h = $(".cross__h"), v = $(".cross__v"), xy = $(".cross__xy");
    addEventListener("mousemove", (e) => {
      const x = e.clientX, y = e.clientY;
      h.style.transform = `translateY(${y}px)`; v.style.transform = `translateX(${x}px)`;
      xy.style.transform = `translate(${x + 14}px, ${y + 14}px)`;
      xy.textContent = `X ${pad(Math.round(x * 2), 4)} · Y ${pad(Math.round((y + scrollY) * 2), 5)} мм`;
      c.classList.toggle("dark", !!e.target.closest(".sec--dark, .sec--blue, .menu"));
    });
    $$(".magnetic").forEach((b) => {
      b.addEventListener("mousemove", (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .2}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`; });
      b.addEventListener("mouseleave", () => { b.style.transform = ""; });
    });
    // заливка карточек услуг от точки входа курсора
    $$(".svc").forEach((s) => s.addEventListener("pointerenter", (e) => {
      const r = s.getBoundingClientRect();
      s.style.setProperty("--mx", (e.clientX - r.left) + "px"); s.style.setProperty("--my", (e.clientY - r.top) + "px");
    }));
  }

  /* ===================== 8. Появление, счётчики, печати ===================== */
  function reveals() {
    const count = (el) => {
      const to = +el.dataset.count;
      if (REDUCED || !to) { el.textContent = to; return; }
      const t0 = performance.now();
      const step = (t) => { const p = clamp((t - t0) / 2000); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4))); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    const targets = $$(".reveal, .split, .stamp, .svc, .footer__big");
    const show = (el) => { el.classList.add("in"); $$("[data-count]", el).forEach(count); };
    if (REDUCED || !("IntersectionObserver" in window)) return targets.forEach(show);
    const io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }), { threshold: .2 });
    targets.forEach((t) => io.observe(t));
  }

  /* ===================== 9. Сигнальные ленты ===================== */
  function tapes() {
    const tracks = $$(".tape__track"); if (!tracks.length) return;
    let x = 0, vel = 0, lastY = scrollY;
    (function loop() {
      const dy = scrollY - lastY; lastY = scrollY;
      vel += (dy - vel) * .12;
      x += (REDUCED ? 0 : .5) + Math.abs(vel) * .6;
      tracks.forEach((t, i) => {
        const third = t.scrollWidth / 3 || 1;
        const off = x % third;
        t.style.transform = `translate3d(${i === 0 ? -off : off - third}px,0,0)`;
      });
      requestAnimationFrame(loop);
    })();
  }

  /* ===================== 10. Проекты: витрина ===================== */
  function projects() {
    const items = $$(".pitem"), imgs = $$(".pview__imgs img");
    const type = $(".pview__type"), place = $(".pview__place");
    let cur = -1;
    const set = (i) => {
      if (i === cur) return;
      imgs.forEach((im) => im.classList.remove("was"));
      if (imgs[cur]) { imgs[cur].classList.remove("on"); imgs[cur].classList.add("was"); }
      cur = i;
      if (imgs[i]) { imgs[i].classList.remove("was"); void imgs[i].offsetWidth; imgs[i].classList.add("on"); }
      items.forEach((it, k) => it.classList.toggle("on", k === i));
      const p = C.projects[i];
      type.textContent = p.type + " · " + p.area; place.textContent = p.place;
    };
    const io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) set(+e.target.dataset.i); }), { rootMargin: "-45% 0px -45% 0px" });
    items.forEach((it) => io.observe(it));
    set(0);
  }

  /* ===================== 11. Этапы: рулетка ===================== */
  function stages() {
    const ruler = $(".ruler"), sts = $$(".st"), val = $(".depth__val");
    onScroll.push(() => {
      const r = ruler.getBoundingClientRect(), mid = innerHeight * .55;
      ruler.style.setProperty("--rp", clamp((mid - r.top) / r.height));
      let active = -1;
      sts.forEach((s, i) => { const on = s.getBoundingClientRect().top < mid; s.classList.toggle("on", on); if (on) active = i; });
      if (val) val.textContent = active < 0 ? "0.0 м" : sts[active].dataset.mark;
    });
  }

  /* ===================== 12. Калькулятор с превью дома ===================== */
  function calculator() {
    const cfg = C.calculator || {}; if (!cfg.materials) return;
    const range = $("#c-area"), areaOut = $(".c-area-val"), body = $(".house__body"), dims = $(".house__dims");
    range.min = cfg.areaMin; range.max = cfg.areaMax; range.step = 5; range.value = cfg.areaDefault;
    let floors = 2, mat = 0;
    const shown = { sum: 0, term: 0, m2: 0 };
    const out = { sum: $(".c-sum"), term: $(".c-term"), m2: $(".c-m2") };
    let raf;
    const tween = (target) => {
      cancelAnimationFrame(raf);
      const from = { ...shown }, t0 = performance.now();
      const step = (t) => {
        const p = clamp((t - t0) / 600), e = 1 - Math.pow(1 - p, 3);
        for (const k in target) { shown[k] = lerp(from[k], target[k], e); out[k].textContent = money(shown[k]); }
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    const draw = (area) => {
      const m = cfg.materials[mat];
      const w = 140 + (area - cfg.areaMin) / (cfg.areaMax - cfg.areaMin) * 170, x0 = 200 - w / 2, G = 250, FH = 46;
      const top = G - floors * FH;
      let s = `<path class="h-ground" d="M10 ${G} H390"/>`;
      s += Array.from({ length: 19 }, (_, i) => `<path class="h-hatch" d="M${20 + i * 20} ${G + 2} l-10 10"/>`).join("");
      for (let f = 0; f < floors; f++) {
        const y = G - (f + 1) * FH;
        s += `<rect class="h-wall" x="${x0}" y="${y}" width="${w}" height="${FH}" fill="${m.color}"/>`;
        const n = Math.max(2, Math.round(w / 56));
        for (let i = 0; i < n; i++) {
          const wx = x0 + (i + .5) * (w / n) - 11;
          if (f === 0 && i === Math.floor(n / 2)) s += `<rect class="h-door" x="${wx + 2}" y="${y + 12}" width="18" height="${FH - 12}"/>`;
          else s += `<rect class="h-win" x="${wx}" y="${y + 11}" width="22" height="22"/>`;
        }
      }
      s += `<path class="h-roof" d="M${x0 - 14} ${top} L200 ${top - 50 - w * .05} L${x0 + w + 14} ${top} Z" fill="${mat === 1 ? "#5a2a1c" : "#2b2b28"}"/>`;
      body.innerHTML = s;
      const side = Math.sqrt(area / floors).toFixed(1);
      dims.innerHTML = `<path class="h-dim" d="M${x0} ${G + 22} H${x0 + w} M${x0} ${G + 16} v12 M${x0 + w} ${G + 16} v12"/><text class="h-dimt" x="200" y="${G + 40}">≈ ${side} м · ${area} м²</text>
        <path class="h-dim" d="M${x0 + w + 26} ${G} V${top} M${x0 + w + 20} ${G} h12 M${x0 + w + 20} ${top} h12"/><text class="h-dimt" x="${x0 + w + 46}" y="${(G + top) / 2}" transform="rotate(-90 ${x0 + w + 46} ${(G + top) / 2})">${floors * 3} м</text>`;
    };

    const calc = () => {
      const area = +range.value;
      areaOut.textContent = area;
      range.style.setProperty("--fill", ((area - cfg.areaMin) / (cfg.areaMax - cfg.areaMin) * 100) + "%");
      const k = floors === 1 ? 1.08 : floors === 3 ? 1.05 : 1;
      let sum = area * cfg.materials[mat].price * k, extrasOn = 0;
      $$("[data-extra]").forEach((x) => {
        if (!x.checked) return;
        const e = cfg.extras[+x.dataset.extra]; extrasOn++;
        sum += e.fixed ? e.fixed : e.perM2 * area;
      });
      const term = Math.round(3 + area / 45 + floors * 1.2 + extrasOn * .8);
      tween({ sum, term, m2: sum / area });
      draw(area);
      return { area, sum, term };
    };
    range.addEventListener("input", calc);
    $$("[data-floors]").forEach((b) => b.addEventListener("click", () => { $$("[data-floors]").forEach((x) => x.setAttribute("aria-checked", x === b)); floors = +b.dataset.floors; calc(); }));
    $$("[data-mat]").forEach((b) => b.addEventListener("click", () => { $$("[data-mat]").forEach((x) => x.setAttribute("aria-checked", x === b)); mat = +b.dataset.mat; calc(); }));
    $$("[data-extra]").forEach((x) => x.addEventListener("change", calc));
    calc();

    $("[data-calc-cta]").addEventListener("click", () => {
      const r = calc();
      $("#r-area").value = r.area;
      const extras = $$("[data-extra]:checked").map((x) => cfg.extras[+x.dataset.extra].name);
      $("#r-msg").value = `Расчёт с сайта: ${r.area} м², ${floors} эт., ${cfg.materials[mat].name}${extras.length ? ", " + extras.join(", ") : ""}. Ориентир ≈ ${money(r.sum)} ₽, срок ≈ ${r.term} мес.`;
    });
  }

  /* ===================== 13. FAQ ===================== */
  function faq() {
    $$(".qa").forEach((q) => {
      const b = $(".qa__btn", q);
      b.addEventListener("click", () => {
        const open = !q.classList.contains("open");
        $$(".qa").forEach((x) => { x.classList.remove("open"); $(".qa__btn", x).setAttribute("aria-expanded", "false"); });
        q.classList.toggle("open", open); b.setAttribute("aria-expanded", open);
      });
    });
  }

  /* ===================== 14. Модалки ===================== */
  let lastFocus;
  const openModal = (m) => { lastFocus = document.activeElement; m.hidden = false; document.body.classList.add("locked"); setTimeout(() => { const f = $("button, input", m); if (f) f.focus(); }, 60); };
  const closeModal = (m) => { m.hidden = true; if (!$$(".modal").some((x) => !x.hidden)) document.body.classList.remove("locked"); if (lastFocus) lastFocus.focus(); };
  function modals() {
    $$(".modal").forEach((m) => $$("[data-close]", m).forEach((b) => b.addEventListener("click", () => closeModal(m))));
    addEventListener("keydown", (e) => { if (e.key === "Escape") $$(".modal").filter((m) => !m.hidden).forEach(closeModal); });
  }

  /* ===================== 15. Заявка ===================== */
  function request() {
    const form = $(".form"); if (!form) return;
    const name = $("#r-name"), phone = $("#r-phone"), file = $('input[type="file"]', form), drop = $(".drop"), dropT = $(".drop__t small");
    let type = "Частный дом";
    $$("[data-type]", form).forEach((b) => b.addEventListener("click", () => { $$("[data-type]", form).forEach((x) => x.setAttribute("aria-checked", x === b)); type = b.dataset.type; }));

    phone.addEventListener("input", () => {
      let v = phone.value.replace(/\D/g, "");
      if (!v) { phone.value = ""; return; }
      if (v[0] === "8") v = "7" + v.slice(1);
      if (v[0] !== "7") v = "7" + v;
      v = v.slice(0, 11);
      let o = "+7";
      if (v.length > 1) o += " (" + v.slice(1, 4);
      if (v.length >= 4) o += ")";
      if (v.length > 4) o += " " + v.slice(4, 7);
      if (v.length > 7) o += "-" + v.slice(7, 9);
      if (v.length > 9) o += "-" + v.slice(9, 11);
      phone.value = o;
    });
    const dropDefault = dropT.textContent;
    file.addEventListener("change", () => { dropT.textContent = file.files.length ? [...file.files].map((f) => f.name).join(", ") : dropDefault; });
    ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, () => drop.classList.add("over")));
    ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove("over")));

    const err = (i, bad) => i.closest(".f").classList.toggle("err", bad);
    [name, phone].forEach((i) => i.addEventListener("input", () => err(i, false)));

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const bn = name.value.trim().length < 2, bp = phone.value.replace(/\D/g, "").length < 11;
      err(name, bn); err(phone, bp);
      if (bn || bp) { (bn ? name : phone).focus(); return; }
      const data = { type, name: name.value.trim(), phone: phone.value, area: $("#r-area").value, place: $("#r-place").value, msg: $("#r-msg").value };
      const text = `Заявка на смету\nОбъект: ${data.type}\nИмя: ${data.name}\nТелефон: ${data.phone}\nПлощадь: ${data.area || "—"} м²\nУчасток: ${data.place || "—"}\n${data.msg}`;
      const b = C.booking || {}; let link = "";
      form.classList.add("sending");
      try {
        if (b.mode === "endpoint" && b.endpoint) {
          const fd = new FormData(form); fd.set("type", type);
          await fetch(b.endpoint, { method: "POST", body: fd });
        } else if (b.mode === "whatsapp" && b.whatsapp) link = `https://wa.me/${b.whatsapp}?text=${encodeURIComponent(text)}`;
        else if (b.mode === "telegram" && b.telegram) link = `https://t.me/${b.telegram}?text=${encodeURIComponent(text)}`;
      } catch (ex) { /* сеть недоступна — показываем подтверждение */ }
      form.classList.remove("sending");
      $(".ok-text").innerHTML = `${esc(data.name)}, инженер позвонит на ${esc(data.phone)} и подготовит смету по объекту «${esc(data.type)}» в течение 24 часов.` +
        (link ? `<br><br><a href="${esc(link)}" target="_blank" rel="noopener">Продублировать в мессенджер →</a>` : "");
      if (link) { try { window.open(link, "_blank", "noopener"); } catch (ex) { /* ссылка в окне */ } }
      openModal($("#okModal"));
      form.reset(); dropT.textContent = dropDefault;
    });
  }

  /* ===================== 16. Cookie ===================== */
  function cookies() {
    const KEY = "osnova_cookie_v1", bar = $(".cookie"), modal = $("#cookieModal");
    const read = () => { try { return JSON.parse(store.get(KEY)) || null; } catch (e) { return null; } };
    const hide = () => { bar.classList.remove("on"); setTimeout(() => { bar.hidden = true; }, 600); };
    const save = (p) => {
      store.set(KEY, JSON.stringify({ necessary: true, ...p, date: new Date().toISOString() }));
      hide(); if (!modal.hidden) closeModal(modal);
      // if (p.analytics) { /* подключите здесь Яндекс Метрику */ }
    };
    const settings = () => { const c = read() || {}; $$("[data-cookie-type]", modal).forEach((i) => { i.checked = !!c[i.dataset.cookieType]; }); openModal(modal); };
    $$('[data-cookie="accept"]').forEach((b) => b.addEventListener("click", () => save({ analytics: true, marketing: true })));
    $$('[data-cookie="settings"], [data-open-cookies]').forEach((b) => b.addEventListener("click", settings));
    $$('[data-cookie="save"]').forEach((b) => b.addEventListener("click", () => {
      const p = {}; $$("[data-cookie-type]", modal).forEach((i) => { p[i.dataset.cookieType] = i.checked; }); save(p);
    }));
    if (!read()) setTimeout(() => { bar.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => bar.classList.add("on"))); }, REDUCED ? 0 : 3000);
  }

  document.addEventListener("DOMContentLoaded", () => {
    setup();
    renderAll();
    splitHeadings();
    loader();
    hero();
    header();
    cursor();
    reveals();
    tapes();
    projects();
    stages();
    calculator();
    faq();
    modals();
    request();
    cookies();
    run();
  });
})();
