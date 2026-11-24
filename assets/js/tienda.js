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
  var REN = RAIZ + 'assets/3d/r/';
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
      '<span class="carrito__foto"><img src="' + REN + p.s + '.webp" alt=""></span>' +
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

  /* ── Visores 3D: se descargan al acercarse; mientras tanto, la imagen fija ── */
  var V3 = '2', cargador = null;
  function motor() {
    if (!cargador) cargador = new Promise(function (ok, mal) {
      var sc = document.createElement('script');
      sc.src = RAIZ + 'assets/js/tienda3d.js?v=7'; sc.async = true;
      sc.onload = function () { if (window.Tienda3D) ok(window.Tienda3D); else mal(); }; sc.onerror = mal;
      document.head.appendChild(sc);
    });
    return cargador;
  }
  var MARCOS = {
    hero: function (w, h) { var an = w > 800 ? 3.1 : 1.75, al = Math.max(2.5, an * h / w); return { alto: 2.5, ancho: an, y: w > 800 ? 0.58 - 1 / al : 0.19 }; },
    lista: function () { return { alto: 2.26, ancho: 1.98 }; },
    ficha: function () { return { alto: 2.36, ancho: 2.0 }; },
    baldosa: function () { return { alto: 2.62, ancho: 1.9 }; },
    duo: function (w) { return w > 560 ? { alto: 2.1, ancho: 1.4, x: 0.2, y: 0.05 } : { alto: 2.6, ancho: 1.75, x: 0.13, y: 0.01 }; }
  };
  var visores = {};
  $$('[data-visor]').forEach(function (caja) {
    var tipo = caja.getAttribute('data-visor'), fija = $('.v3d__fija', caja);
    var v = {
      k: caja.getAttribute('data-m'), motor: null, orden: null,
      mostrar: function (k, nombre) {
        v.k = k;
        if (nombre) caja.setAttribute('aria-label', 'Modelo 3D del equipo ' + nombre);
        if (v.motor) { v.motor.mostrar(k); return; }
        var src = REN + k + '.webp'; if (fija && fija.getAttribute('src') !== src) fija.src = src;
      },
      precargar: function (k) { if (v.motor && k) v.motor.precargar(k); }
    };
    (visores[tipo] = visores[tipo] || []).push(v);
    function arrancar() {
      motor().then(function (T) {
        v.motor = T.montar(caja, { base: RAIZ + 'assets/3d/', v: V3, modo: tipo, muro: tipo === 'lista' ? 'cuadro' : 'sombra', marco: MARCOS[tipo], orden: v.orden, pose: tipo === 'duo' ? { x: 0.16, y: -0.5 } : tipo === 'hero' ? { x: 0.06, y: -0.3 } : undefined });
        if (v.motor) { v.motor.mostrar(v.k); if (v.alArrancar) v.alArrancar(); }
      }, function () {});
    }
    if (!('IntersectionObserver' in window)) { arrancar(); return; }
    var io = new IntersectionObserver(function (es) {
      if (!es.some(function (e) { return e.isIntersecting; })) return;
      io.disconnect();
      if (document.readyState === 'complete') arrancar(); else window.addEventListener('load', arrancar);
    }, { rootMargin: '900px 0px' });
    io.observe(caja);
  });
  var vHero = (visores.hero || [])[0], vLista = (visores.lista || [])[0];

  /* ── Portada: los equipos se relevan ── */
  var ops = $$('[data-hero]'), hi = 0, hTimer;
  if (vHero) vHero.alArrancar = function () { ops.forEach(function (o) { vHero.precargar(o.getAttribute('data-m')); }); };
  function hero(i, manual) {
    if (!ops.length) return;
    hi = (i + ops.length) % ops.length;
    var b = ops[hi], p = CAT[b.getAttribute('data-id')];
    ops.forEach(function (o, k) { o.classList.toggle('is-on', k === hi); o.setAttribute('aria-pressed', k === hi ? 'true' : 'false'); });
    if (vHero) vHero.mostrar(b.getAttribute('data-m'), p.n);
    var set = function (sel, v) { var el = $(sel); if (el) el.textContent = v; };
    set('[data-hero-nombre]', p.n); set('[data-hero-nota]', b.getAttribute('data-nota')); set('[data-hero-precio]', cop(p.p));
    var l = $('[data-hero-link]'); if (l) l.setAttribute('href', b.getAttribute('data-href'));
    var a = $('[data-hero-add]'); if (a) a.setAttribute('data-add', b.getAttribute('data-id'));
    if (manual) { clearInterval(hTimer); hTimer = null; }
  }
  ops.forEach(function (b, k) { b.addEventListener('click', function () { hero(k, true); }); });
  if (ops.length && !reduce) hTimer = setInterval(function () { if (!document.hidden) hero(hi + 1); }, 5600);

  /* ── Los veinte: filtro y el equipo en 3D que acompaña la lista ── */
  var filas = $$('.fila'), lista = $('.equipos__lista'), vCaja = $('.viajero__caja'), vNom = $('[data-viajero-n]'), vPre = $('[data-viajero-p]'), barraNav = $('.nav'), activa = null, encima = false;
  if (vLista) vLista.orden = filas.map(function (f) { return f.getAttribute('data-m'); });
  function pares() { var k = 0; filas.forEach(function (f) { if (!f.hidden) { f.classList.toggle('par', k % 2 === 1); k++; } }); }
  function activar(f) {
    if (!f || f === activa) return;
    if (activa) activa.classList.remove('is-activa');
    activa = f; f.classList.add('is-activa');
    var p = CAT[f.getAttribute('data-id')];
    if (!vLista || !p) return;
    vLista.mostrar(p.s, p.n);
    if (vNom) vNom.textContent = p.n;
    if (vPre) vPre.textContent = cop(p.p);
    var i = vLista.orden.indexOf(p.s); [i + 1, i - 1, i + 2].forEach(function (j) { vLista.precargar(vLista.orden[j]); });
  }
  function seguir() {
    if (!lista || !filas.length || encima) return;
    var r = lista.getBoundingClientRect(), vh = window.innerHeight;
    if (r.bottom < 0 || r.top > vh) { if (!activa) activar(filas.filter(function (f) { return !f.hidden; })[0]); return; }
    /* La marca baja con el recorrido: primera fila al entrar, última al llegar al final */
    var techo = barraNav.offsetHeight + (window.innerWidth <= 800 ? $('.viajero').offsetHeight : 0), alto = vh - techo;
    var av = Math.min(1, Math.max(0, (techo - r.top) / Math.max(1, r.height - alto)));
    var y = techo + alto * (0.05 + 0.92 * av), mejor = null, d = 1e9;
    filas.forEach(function (f) { if (f.hidden) return; var fr = f.getBoundingClientRect(), dd = Math.abs(fr.top + fr.height / 2 - y); if (dd < d) { d = dd; mejor = f; } });
    activar(mejor);
  }
  var tick = false;
  if (filas.length) {
    pares();
    /* manda lo último que hizo el visitante: mover el cursor sobre una fila o desplazarse */
    window.addEventListener('scroll', function () { encima = false; if (!tick) { tick = true; requestAnimationFrame(function () { tick = false; seguir(); }); } }, { passive: true });
    filas.forEach(function (f) {
      f.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse' && (e.movementX || e.movementY)) { encima = true; activar(f); } });
      f.addEventListener('focusin', function () { activar(f); });
    });
    lista.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') encima = false; });
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

  /* ── Ficha: modelo 3D, fotos, versión y cantidad ── */
  var fImg = $('#fp-img'), fPl = $('.fp__plinto'), fT;
  $$('.fp__thumb').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.fp__thumb').forEach(function (o) { o.classList.toggle('is-on', o === b); o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      if (!fImg || !fPl) return;
      clearTimeout(fT);
      if (b.hasAttribute('data-3d')) { fImg.hidden = true; fPl.classList.remove('es-foto', 'es-foto-estudio'); return; }
      var src = b.getAttribute('data-src'), est = b.classList.contains('es-estudio');
      fImg.classList.add('is-out');
      fT = setTimeout(function () {
        fImg.onload = function () { fImg.classList.remove('is-out'); };
        fImg.width = b.getAttribute('data-w'); fImg.height = b.getAttribute('data-h'); fImg.src = src; fImg.alt = b.getAttribute('aria-label').replace(/^Ver foto \d+: /, '');
        fImg.hidden = false; fImg.classList.toggle('es-estudio', est);
        fPl.classList.add('es-foto'); fPl.classList.toggle('es-foto-estudio', est);
        if (fImg.complete) fImg.classList.remove('is-out');
      }, 140);
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
      .to('.v3d--hero', { opacity: 1, y: 0, duration: 1 }, 0.08)
      .to(['.th__lead', '.th__ficha', '.th__cambio'], { opacity: 1, y: 0, duration: 0.6, stagger: 0.07 }, 0.4);
    gsap.timeline({ scrollTrigger: { trigger: '.th', start: 'top top', end: 'bottom top', scrub: true } })
      .to('.th__stage .v3d--hero', { yPercent: 7, ease: 'none' }, 0)
      .to('.th__marca', { yPercent: -10, ease: 'none' }, 0);
  }

  /* Portada de la tienda: secciones */
  entrar('.deporte__txt > *', { opacity: 0, y: 30 }, { trigger: '.deporte__txt', stagger: 0.1 });
  $$('.deporte .tiles > li, .frel .tiles > li').forEach(function (li, i) { entrar(li, { opacity: 0, y: 44 }, { delay: (i % 4) * 0.07 }); });
  entrar('.equipos__title span', { yPercent: 70, opacity: 0 }, { trigger: '.equipos__title', stagger: 0.1 });
  entrar('.filtros label', { opacity: 0, y: 18 }, { trigger: '.filtros', stagger: 0.04, duration: 0.6 });
  entrar('.viajero .v3d', { opacity: 0 }, { trigger: '.equipos__cuerpo', duration: 1 });
  $$('.duo__panel').forEach(function (p) {
    gsap.fromTo($('.v3d', p), { yPercent: 7 }, { yPercent: -5, ease: 'none', scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true } });
    entrar($$('.duo__pie > *', p), { opacity: 0, y: 24 }, { trigger: null, stagger: 0.08 });
  });
  entrar('.duo h2', { opacity: 0, y: 30 }, { trigger: '.duo', start: 'top 70%' });
  $$('.uso').forEach(function (u) {
    if (u.classList.contains('uso--foto')) entrar($('.uso__media', u), { opacity: 0, y: 50 }, { trigger: u, duration: 1.1, start: 'top 70%' });
    else gsap.fromTo($('.uso__media', u), { scale: 1.14 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: u, start: 'top bottom', end: 'bottom top', scrub: true } });
    if ($('.uso__txt', u)) entrar([$('.uso__txt', u), $('.uso__ir', u)], { opacity: 0, y: 24 }, { trigger: $('.uso__txt', u), stagger: 0.08, start: 'top 96%' });
    if ($('.uso__cab', u)) entrar($$('.uso__cab > *', u), { opacity: 0, y: 40 }, { trigger: $('.uso__cab', u), stagger: 0.1, duration: 1 });
  });
  entrar(['.ayuda h2', '.ayuda__datos li'], { opacity: 0, y: 26 }, { trigger: '.ayuda__txt', stagger: 0.07, start: 'top 80%' });
  entrar('.ayuda details', { opacity: 0, y: 22 }, { trigger: '.ayuda__preguntas', stagger: 0.06 });
  entrar('.ayuda__fotos', { clipPath: 'inset(0% 0% 100% 0%)' }, { trigger: '.ayuda__fotos', duration: 1.2, start: 'top 80%' });

  /* Ficha y pedido: la primera pantalla entra al cargar; el resto, al llegar */
  if ($('.fp')) {
    gsap.from('.fp__plinto', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1, ease: 'expo.out' });
    gsap.from('.fp__plinto .v3d', { yPercent: 8, duration: 1.1, ease: 'expo.out', delay: 0.1 });
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

  window.addEventListener('load', function () { ScrollTrigger.refresh(); seguir(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
