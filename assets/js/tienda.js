/* Sinermed · propuesta de tienda · ImpulsaPixel
   Carrito (se guarda en este navegador), portada, lista con el equipo viajero, ficha y pedido.
   El pago real lo hace Wompi: aquí no se pide ni se guarda ningún dato de pago. */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var RAIZ = window.TIENDA_RAIZ || '';
  var CAT = window.TIENDA || {};
  var IMG = RAIZ + 'assets/img/tienda/';
  var nf = new Intl.NumberFormat('es-CO');
  function cop(n) { return '$' + nf.format(n); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ── Carrito ── */
  var CLAVE = 'sinermed-carrito';
  var carrito = [];
  try { carrito = JSON.parse(localStorage.getItem(CLAVE) || '[]').filter(function (x) { return CAT[x.id]; }); } catch (e) { carrito = []; }
  function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(carrito)); } catch (e) {} }
  function precio(x) { var p = CAT[x.id]; return (p.v && p.v[x.v]) ? p.v[x.v].p : p.p; }
  function version(x) { var p = CAT[x.id]; return (p.v && p.v[x.v]) ? p.v[x.v].n : ''; }
  function total() { return carrito.reduce(function (t, x) { return t + precio(x) * x.c; }, 0); }
  function unidades() { return carrito.reduce(function (t, x) { return t + x.c; }, 0); }

  var dlg = $('#carrito'), aviso = $('[data-carrito-aviso]');
  function itemHTML(x, i, cls) {
    var p = CAT[x.id], v = version(x);
    return '<li class="' + cls + '">' +
      '<span class="carrito__foto"><img src="' + IMG + p.f + '" alt=""></span>' +
      '<div><strong>' + esc(p.n) + '</strong>' + (v && v !== p.n ? '<span class="carrito__ver">' + esc((p.vl || 'Versión') + ': ' + v) + '</span>' : '') +
      '<div class="cant"><button type="button" data-q="-1" data-i="' + i + '" aria-label="Una unidad menos de ' + esc(p.n) + '">−</button>' +
      '<input type="number" inputmode="numeric" min="1" max="20" value="' + x.c + '" data-qi="' + i + '" aria-label="Cantidad de ' + esc(p.n) + '">' +
      '<button type="button" data-q="1" data-i="' + i + '" aria-label="Una unidad más de ' + esc(p.n) + '">+</button></div></div>' +
      '<div class="carrito__lado"><span class="carrito__precio">' + cop(precio(x) * x.c) + '</span>' +
      '<button type="button" class="carrito__quitar" data-quitar="' + i + '" aria-label="Quitar ' + esc(p.n) + ' del carrito">Quitar</button></div></li>';
  }
  function pintar() {
    var n = unidades(), t = cop(total());
    $$('[data-carrito-n]').forEach(function (el) { el.textContent = n; });
    $$('[data-carrito-total], [data-pago-total]').forEach(function (el) { el.textContent = t; });
    $$('[data-pago-n]').forEach(function (el) { el.textContent = n; });
    var ul = $('[data-carrito-items]'); if (ul) ul.innerHTML = carrito.map(function (x, i) { return itemHTML(x, i, 'carrito__item'); }).join('');
    var pl = $('[data-pago-items]'); if (pl) pl.innerHTML = carrito.map(function (x, i) { return itemHTML(x, i, 'pago__item'); }).join('');
    var pagar = $('[data-carrito-pagar]'); if (pagar) pagar.style.display = n ? '' : 'none';
    var bp = $('[data-pagar]'); if (bp) bp.disabled = !n;
  }
  function anadir(id, v, c) {
    if (!CAT[id]) return;
    v = v || 0; c = Math.max(1, c || 1);
    var ya = carrito.filter(function (x) { return x.id === id && x.v === v; })[0];
    if (ya) ya.c = Math.min(20, ya.c + c); else carrito.push({ id: id, v: v, c: Math.min(20, c) });
    guardar(); pintar();
    if (aviso) aviso.textContent = CAT[id].n + ' añadido al carrito. ' + unidades() + ' en total.';
    $$('[data-carrito-n]').forEach(function (el) { el.classList.add('is-golpe'); setTimeout(function () { el.classList.remove('is-golpe'); }, 320); });
  }
  function abrir() { if (dlg && !dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); var t = $('#carrito-t'); if (t) t.focus(); } }
  function cerrar() { if (dlg && dlg.open) dlg.close(); }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-add], [data-carrito-abrir], [data-carrito-cerrar], [data-q], [data-quitar], [data-pagar]');
    if (!t) { if (dlg && e.target === dlg) cerrar(); return; }
    if (t.hasAttribute('data-carrito-abrir')) { abrir(); return; }
    if (t.hasAttribute('data-carrito-cerrar')) { cerrar(); return; }
    if (t.hasAttribute('data-q')) { var x = carrito[+t.getAttribute('data-i')]; if (x) { x.c = Math.max(1, Math.min(20, x.c + (+t.getAttribute('data-q')))); guardar(); pintar(); } return; }
    if (t.hasAttribute('data-quitar')) { carrito.splice(+t.getAttribute('data-quitar'), 1); guardar(); pintar(); return; }
    if (t.hasAttribute('data-pagar')) { var av = $('#aviso-demo'); if (av && unidades()) av.showModal(); return; }
    if (t.hasAttribute('data-add')) {
      var id = t.getAttribute('data-add'), v = 0, c = 1;
      if (t.hasAttribute('data-add-ficha')) {
        var r = $('input[name="version"]:checked'); v = r ? +r.value : 0;
        var q = $('[data-cant-n]'); c = q ? (parseInt(q.value, 10) || 1) : 1;
      }
      anadir(id, v, c);
      if (t.hasAttribute('data-ir')) { window.location.href = RAIZ + 'tienda/carrito/'; return; }
      abrir();
    }
  });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.hasAttribute && t.hasAttribute('data-qi')) { var x = carrito[+t.getAttribute('data-qi')]; if (x) { x.c = Math.max(1, Math.min(20, parseInt(t.value, 10) || 1)); guardar(); pintar(); } }
  });
  pintar();

  /* ── Portada: los equipos se relevan ── */
  var ops = $$('[data-hero]'), objs = $$('.th__obj'), hi = 0, hTimer;
  function hero(i, manual) {
    if (!ops.length) return;
    hi = (i + ops.length) % ops.length;
    var b = ops[hi], p = CAT[b.getAttribute('data-id')];
    ops.forEach(function (o, k) { o.classList.toggle('is-on', k === hi); o.setAttribute('aria-pressed', k === hi ? 'true' : 'false'); });
    objs.forEach(function (o, k) { o.classList.toggle('is-on', k === hi); });
    var set = function (sel, v) { var el = $(sel); if (el) el.textContent = v; };
    set('[data-hero-nombre]', p.n); set('[data-hero-nota]', b.getAttribute('data-nota')); set('[data-hero-precio]', cop(p.p));
    var l = $('[data-hero-link]'); if (l) l.setAttribute('href', b.getAttribute('data-href'));
    var a = $('[data-hero-add]'); if (a) a.setAttribute('data-add', b.getAttribute('data-id'));
    if (manual) { clearInterval(hTimer); hTimer = null; }
  }
  ops.forEach(function (b, k) { b.addEventListener('click', function () { hero(k, true); }); });
  if (ops.length && !reduce) hTimer = setInterval(function () { if (!document.hidden) hero(hi + 1); }, 5600);

  /* ── Los veinte: filtro y equipo viajero ── */
  var filas = $$('.fila'), vImg = $('#viajero-img'), plinto = $('.viajero__plinto'), activa = null, vT;
  function pares() { var k = 0; filas.forEach(function (f) { if (!f.hidden) { f.classList.toggle('par', k % 2 === 1); k++; } }); }
  function activar(f) {
    if (!f || f === activa) return;
    if (activa) activa.classList.remove('is-activa');
    activa = f; f.classList.add('is-activa');
    if (!vImg) return;
    var src = f.getAttribute('data-obj');
    if (vImg.getAttribute('src') === src) return;
    clearTimeout(vT); vImg.classList.add('is-out');
    vT = setTimeout(function () { vImg.onload = function () { vImg.classList.remove('is-out'); }; vImg.src = src; if (vImg.complete) vImg.classList.remove('is-out'); }, 170);
  }
  function seguir() {
    if (!plinto || !filas.length || window.innerWidth <= 800) return;
    var r = plinto.getBoundingClientRect(), y = r.top + r.height / 2, mejor = null, d = 1e9;
    filas.forEach(function (f) { if (f.hidden) return; var fr = f.getBoundingClientRect(), c = fr.top + fr.height / 2, dd = Math.abs(c - y); if (dd < d) { d = dd; mejor = f; } });
    activar(mejor);
  }
  var tick = false;
  if (filas.length) {
    pares();
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(function () { tick = false; seguir(); }); } }, { passive: true });
    filas.forEach(function (f) { f.addEventListener('mouseenter', function () { activar(f); }); f.addEventListener('focusin', function () { activar(f); }); });
    seguir();
  }
  function filtrar(v) {
    filas.forEach(function (f) { f.hidden = !(v === 'todos' || f.getAttribute('data-cat') === v); });
    pares(); activa = null; filas.forEach(function (f) { f.classList.remove('is-activa'); }); seguir();
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }
  $$('input[name="linea"]').forEach(function (r) { r.addEventListener('change', function () { if (r.checked) filtrar(r.value); }); });
  function elegirFiltro(v) { var r = $('input[name="linea"][value="' + v + '"]'); if (r) { r.checked = true; filtrar(v); } }
  $$('[data-filtro]').forEach(function (a) {
    a.addEventListener('click', function () { var v = a.getAttribute('data-filtro'); if ($('input[name="linea"]')) elegirFiltro(v); else { try { sessionStorage.setItem('sinermed-filtro', v); } catch (e) {} } });
  });
  try { var pend = sessionStorage.getItem('sinermed-filtro'); if (pend && $('input[name="linea"]')) { sessionStorage.removeItem('sinermed-filtro'); elegirFiltro(pend); } } catch (e) {}

  /* ── Ficha: fotos, versión y cantidad ── */
  var fImg = $('#fp-img'), fT;
  $$('.fp__thumb').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.fp__thumb').forEach(function (o) { o.classList.toggle('is-on', o === b); o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      var src = b.getAttribute('data-src'); if (!fImg || fImg.getAttribute('src') === src) return;
      clearTimeout(fT); fImg.classList.add('is-out');
      fT = setTimeout(function () { fImg.onload = function () { fImg.classList.remove('is-out'); }; fImg.width = b.getAttribute('data-w'); fImg.height = b.getAttribute('data-h'); fImg.src = src; if (fImg.complete) fImg.classList.remove('is-out'); }, 200);
    });
  });
  $$('input[name="version"]').forEach(function (r) { r.addEventListener('change', function () { var el = $('[data-precio]'); if (el && r.checked) el.textContent = cop(+r.getAttribute('data-precio')); }); });
  var cn = $('[data-cant-n]');
  if (cn) {
    var paso = function (d) { cn.value = Math.max(1, Math.min(20, (parseInt(cn.value, 10) || 1) + d)); };
    var me = $('[data-menos]'), ma = $('[data-mas]');
    if (me) me.addEventListener('click', function () { paso(-1); });
    if (ma) ma.addEventListener('click', function () { paso(1); });
  }

  /* Los videos solo corren a la vista */
  if ('IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (es) { es.forEach(function (e) { var v = e.target; if (e.isIntersecting && !reduce) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else v.pause(); }); }, { threshold: 0.1 });
    $$('video').forEach(function (v) { vio.observe(v); });
  }

  /* ── Movimiento ── */
  if (reduce || !window.gsap || !window.ScrollTrigger) { clearTimeout(window.__sinAnim); root.classList.add('sin-anim'); return; }
  var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger); clearTimeout(window.__sinAnim);

  if (window.Lenis) {
    var lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true, prevent: function (node) { return !!(node.closest && node.closest('dialog')); } });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) { var id = a.getAttribute('href'); if (id.length < 2) return; var dest = $(id); if (!dest) return; e.preventDefault(); lenis.scrollTo(dest, { offset: -40, duration: 1.3 }); });
    });
  }

  var NATURAL = { opacity: 1, x: 0, y: 0, xPercent: 0, yPercent: 0, scale: 1, scaleX: 1, clipPath: 'inset(0% 0% 0% 0%)' };
  function entrar(targets, from, o) {
    o = o || {};
    var els = gsap.utils.toArray(targets); if (!els.length) return;
    var trigger = o.trigger ? (typeof o.trigger === 'string' ? $(o.trigger) : o.trigger) : els[0];
    var to = { duration: o.duration || 0.9, ease: 'expo.out', stagger: o.stagger || 0, delay: o.delay || 0, overwrite: 'auto' };
    Object.keys(from).forEach(function (k) { if (k in NATURAL) to[k] = NATURAL[k]; });
    ScrollTrigger.create({ trigger: trigger, start: 'top bottom', once: true, onEnter: function () { gsap.set(els, from); } });
    ScrollTrigger.create({ trigger: trigger, start: o.start || 'top 88%', once: true, onEnter: function () { gsap.to(els, to); } });
  }

  /* Portada */
  if ($('.th')) {
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .to('.th__marca', { y: 0, duration: 0.9 }, 0)
      .to('.th__objetos', { opacity: 1, y: 0, duration: 1 }, 0.08)
      .to(['.th__lead', '.th__ficha', '.th__cambio'], { opacity: 1, y: 0, duration: 0.6, stagger: 0.07 }, 0.4);
    gsap.timeline({ scrollTrigger: { trigger: '.th', start: 'top top', end: 'bottom top', scrub: true } })
      .to('.th__objetos', { yPercent: 7, scale: 1.04, transformOrigin: '50% 100%', ease: 'none' }, 0)
      .to('.th__marca', { yPercent: -10, ease: 'none' }, 0);
    /* el equipo gira un poco hacia el cursor */
    var stage = $('.th__stage'), ob = $('.th__objetos');
    if (stage && ob && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      var rx = gsap.quickTo(ob, 'rotationY', { duration: 0.8, ease: 'power3.out' }), ry = gsap.quickTo(ob, 'rotationX', { duration: 0.8, ease: 'power3.out' });
      $('.th').addEventListener('pointermove', function (e) { var r = stage.getBoundingClientRect(); rx(((e.clientX - r.left) / r.width - 0.5) * 14); ry(-((e.clientY - r.top) / r.height - 0.5) * 8); });
      $('.th').addEventListener('pointerleave', function () { rx(0); ry(0); });
    }
  }

  /* Portada de la tienda: secciones */
  entrar('.deporte__txt > *', { opacity: 0, y: 30 }, { trigger: '.deporte__txt', stagger: 0.1 });
  $$('.deporte .tiles > li, .frel .tiles > li').forEach(function (li, i) { entrar(li, { opacity: 0, y: 44 }, { delay: (i % 4) * 0.07 }); });
  entrar('.equipos__title span', { yPercent: 70, opacity: 0 }, { trigger: '.equipos__title', stagger: 0.1 });
  entrar('.filtros label', { opacity: 0, y: 18 }, { trigger: '.filtros', stagger: 0.04, duration: 0.6 });
  entrar('.viajero__plinto', { scale: 0.7, opacity: 0 }, { trigger: '.equipos__cuerpo', duration: 1 });
  $$('.duo__panel').forEach(function (p) {
    gsap.fromTo($('.duo__obj', p), { yPercent: 8 }, { yPercent: -8, ease: 'none', scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true } });
    entrar($$('.duo__pie > *', p), { opacity: 0, y: 24 }, { trigger: null, stagger: 0.08 });
  });
  entrar('.duo h2', { opacity: 0, y: 30 }, { trigger: '.duo', start: 'top 70%' });
  $$('.uso').forEach(function (u) {
    gsap.fromTo($('.uso__media', u), { scale: 1.14 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: u, start: 'top bottom', end: 'bottom top', scrub: true } });
    entrar([$('.uso__txt', u), $('.uso__ir', u)], { opacity: 0, y: 24 }, { trigger: $('.uso__txt', u), stagger: 0.08, start: 'top 96%' });
  });
  entrar(['.ayuda h2', '.ayuda__datos li'], { opacity: 0, y: 26 }, { trigger: '.ayuda__txt', stagger: 0.07, start: 'top 80%' });
  entrar('.ayuda details', { opacity: 0, y: 22 }, { trigger: '.ayuda__preguntas', stagger: 0.06 });
  entrar('.ayuda__alta', { clipPath: 'inset(0% 0% 100% 0%)' }, { trigger: '.ayuda__fotos', duration: 1.2, start: 'top 80%' });
  entrar('.ayuda__cuadro', { opacity: 0, y: 40 }, { trigger: '.ayuda__cuadro', start: 'top 92%' });

  /* Ficha y pedido: la primera pantalla entra al cargar; el resto, al llegar */
  if ($('.fp')) {
    gsap.from('.fp__plinto', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1, ease: 'expo.out' });
    gsap.from('#fp-img', { yPercent: 10, scale: 0.92, duration: 1.1, ease: 'expo.out', delay: 0.1 });
    gsap.from('.fp__thumbs li', { opacity: 0, x: -14, duration: 0.6, stagger: 0.05, ease: 'expo.out', delay: 0.2 });
    gsap.from('.fp__compra > *', { opacity: 0, y: 22, duration: 0.7, stagger: 0.05, ease: 'expo.out', delay: 0.1 });
    entrar('.fb h2', { opacity: 0, y: 30 }, {});
    entrar('.fb__lista li', { opacity: 0, x: 40 }, { trigger: '.fb__lista', stagger: 0.1 });
    entrar('.fbanda__f', { clipPath: 'inset(0% 0% 100% 0%)' }, { trigger: '.fbanda', stagger: 0.1, duration: 1.1 });
    entrar('.fi__inc > *, .fi__inc li', { opacity: 0, y: 20 }, { trigger: '.fi__inc', stagger: 0.04 });
    entrar('.fi__specs tr', { opacity: 0, y: 16 }, { trigger: '.fi__specs', stagger: 0.04 });
    entrar('.frel h2', { opacity: 0, y: 30 }, {});
  }
  if ($('.pago')) {
    gsap.from('.pago h1', { yPercent: 40, opacity: 0, duration: 0.9, ease: 'expo.out' });
    gsap.from(['.pago__lead', '.pago__lista', '.pago__resumen'], { opacity: 0, y: 26, duration: 0.8, stagger: 0.1, ease: 'expo.out', delay: 0.1 });
    entrar('.pago__sug h2', { opacity: 0, y: 30 }, {});
    $$('.pago__sug .tiles > li').forEach(function (li, i) { entrar(li, { opacity: 0, y: 44 }, { delay: i * 0.07 }); });
  }
  entrar(['.pie__inv', '.pie__arriba .btn', '.pie__redes li'], { opacity: 0, y: 30 }, { trigger: '.pie__arriba', stagger: 0.06 });
  gsap.from('.pie__marca', { yPercent: 70, ease: 'none', scrollTrigger: { trigger: '.pie', start: 'top 60%', end: 'bottom bottom', scrub: 0.5 } });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); seguir(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
