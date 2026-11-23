/* Sinermed · propuesta de sitio · ImpulsaPixel
   Movimiento con GSAP + ScrollTrigger + Lenis. Si algo falla, la clase «sin-anim» deja todo visible. */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktop = window.matchMedia('(min-width: 801px)');
  var WA = 'https://wa.me/573222662454?text=';

  /* ── La barra: transparente sobre la portada, sólida después ── */
  var nav = $('.nav'), hero = $('.hero');
  function barra() { if (nav && hero) nav.classList.toggle('is-solid', window.scrollY > hero.offsetHeight - nav.offsetHeight - 8); }
  window.addEventListener('scroll', barra, { passive: true });
  window.addEventListener('resize', barra);
  barra();

  /* ── Selector «¿Qué quieres medir?» ── */
  var nombres = { movimiento: 'movimiento', fuerza: 'fuerza', oxigeno: 'consumo de oxígeno', musculo: 'actividad muscular', mirada: 'la mirada', lactato: 'lactato', pisada: 'la pisada', corazon: 'el corazón' };
  var waFinal = $('#wa-final');
  function elegir(v) {
    $$('.item').forEach(function (it) { it.classList.toggle('is-on', it.getAttribute('data-v') === v); });
    if (waFinal && nombres[v]) waFinal.href = WA + encodeURIComponent('Hola, Sinermed. Quiero una asesoría para medir ' + nombres[v] + '.');
  }
  $$('.selector__opts input').forEach(function (inp) {
    inp.addEventListener('change', function () { if (inp.checked) elegir(inp.value); });
    if (inp.checked) elegir(inp.value);
  });

  /* ── Tienda: la foto cambia con el equipo señalado ── */
  var tImg = $('#tienda-img'), tTimer;
  function mostrar(a) {
    var src = a.getAttribute('data-img');
    if (!tImg || !src || tImg.getAttribute('src') === src) return;
    clearTimeout(tTimer);
    tImg.classList.add('is-out');
    tTimer = setTimeout(function () {
      tImg.onload = function () { tImg.classList.remove('is-out'); };
      tImg.src = src;
      tImg.alt = 'Globus ' + ($('.tienda__n', a) || a).textContent;
      if (tImg.complete) tImg.classList.remove('is-out');
    }, 180);
  }
  $$('.tienda__grupo a').forEach(function (a) {
    a.addEventListener('mouseenter', function () { mostrar(a); });
    a.addEventListener('focus', function () { mostrar(a); });
  });

  /* ── Videos: solo se reproducen a la vista ── */
  var heroVideo = $('.hero__video');
  if ('IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && !reduce) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.15 });
    $$('video').forEach(function (v) { vio.observe(v); });
  }
  if (reduce && heroVideo) { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); }

  /* Lo que está midiendo el recuadro de la portada, según el momento del video (bucle de 16,8 s) */
  var ahora = $('#hero-now');
  var tramos = [[3.7, 'consumo de oxígeno'], [7.9, 'movimiento en 3D'], [12.1, 'fuerza en la barra'], [16.3, 'la mirada'], [99, 'consumo de oxígeno']];
  if (heroVideo && ahora) {
    heroVideo.addEventListener('timeupdate', function () {
      var t = heroVideo.currentTime, txt = tramos[0][1];
      for (var i = 0; i < tramos.length; i++) { if (t < tramos[i][0]) { txt = tramos[i][1]; break; } }
      if (ahora.textContent !== txt) ahora.textContent = txt;
    });
  }

  /* ── La visita, medida ── */
  (function () {
    var elT = $('#v-tiempo'), elD = $('#v-dist'), elV = $('#v-vel'), curva = $('#v-curva polyline');
    if (!elT) return;
    var activo = 0, dist = 0, pico = 0, ventana = 0, lastY = window.scrollY, lastT = performance.now(), muestras = [];
    window.addEventListener('scroll', function () {
      var y = window.scrollY, t = performance.now(), dy = Math.abs(y - lastY), dt = (t - lastT) / 1000;
      dist += dy;
      if (dt > 0.03) { var v = Math.min(dy / dt, 20000); if (v > ventana) ventana = v; lastY = y; lastT = t; }
    }, { passive: true });
    var nf = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    var ni = new Intl.NumberFormat('es-CO');
    function pintar() {
      var s = Math.floor(activo);
      elT.textContent = Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
      elD.textContent = nf.format(dist * 0.000264583);
      elV.textContent = ni.format(Math.round(pico));
      if (curva && muestras.length > 1) {
        var max = Math.max.apply(null, muestras) || 1, n = muestras.length, pts = [];
        for (var i = 0; i < n; i++) pts.push((i / (n - 1) * 600).toFixed(1) + ',' + (116 - muestras[i] / max * 108).toFixed(1));
        curva.setAttribute('points', pts.join(' '));
      }
    }
    setInterval(function () {
      if (document.hidden) return;
      activo += 0.5;
      if (ventana > pico) pico = ventana;
      muestras.push(ventana); ventana = 0;
      if (muestras.length > 96) { var m = []; for (var i = 0; i < muestras.length; i += 2) m.push(Math.max(muestras[i], muestras[i + 1] || 0)); muestras = m; }
      pintar();
    }, 500);
  })();

  /* ── Sin GSAP o con movimiento reducido: todo visible y listo ── */
  if (reduce || !window.gsap || !window.ScrollTrigger) {
    clearTimeout(window.__sinAnim);
    root.classList.add('sin-anim');
    return;
  }

  var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
  clearTimeout(window.__sinAnim);

  /* Desplazamiento suave */
  if (window.Lenis) {
    var lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var dest = $(id); if (!dest) return;
        e.preventDefault(); lenis.scrollTo(dest, { offset: 0, duration: 1.4 });
        history.replaceState(null, '', id);
      });
    });
  }

  /* Entradas. Todo está visible por defecto: el estado inicial solo se pone cuando el bloque
     asoma por el borde inferior, y la animación corre cuando ya entró. Si nunca se llega a un
     bloque, nunca queda escondido. */
  var NATURAL = { opacity: 1, x: 0, y: 0, xPercent: 0, yPercent: 0, scale: 1, scaleX: 1, clipPath: 'inset(0% 0% 0% 0%)' };
  function entrar(targets, from, o) {
    o = o || {};
    var els = gsap.utils.toArray(targets);
    if (!els.length) return;
    var trigger = o.trigger ? $(o.trigger) : els[0];
    var to = { duration: o.duration || 1, ease: o.ease || 'expo.out', stagger: o.stagger || 0, delay: o.delay || 0, overwrite: 'auto' };
    Object.keys(from).forEach(function (k) { if (k in NATURAL) to[k] = NATURAL[k]; });
    if (from.transformOrigin) to.transformOrigin = from.transformOrigin;
    ScrollTrigger.create({ trigger: trigger, start: 'top bottom', once: true, onEnter: function () { gsap.set(els, from); } });
    ScrollTrigger.create({ trigger: trigger, start: o.start || 'top 86%', once: true, onEnter: function () { gsap.to(els, to); } });
  }

  /* ── Portada ── */
  var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.to('.hero__l1 > span', { y: 0, duration: 0.85 }, 0)
    .to('.hero__l2 > span', { y: 0, duration: 0.85 }, 0.08)
    .to('.hero__square', { scale: 1, opacity: 1, duration: 0.95 }, 0.05)
    .to('.hero__atleta', { opacity: 1, y: 0, duration: 1 }, 0.12)
    .to(['.hero__lead', '.hero__facts'], { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, 0.45);

  gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
    .to('.hero__l1', { xPercent: -9, ease: 'none' }, 0)
    .to('.hero__l2', { xPercent: 9, ease: 'none' }, 0)
    .to('.hero__atleta', { yPercent: -9, scale: 1.07, ease: 'none' }, 0)
    .to('.hero__square', { rotation: -9, yPercent: 14, ease: 'none' }, 0);

  /* Titulares por líneas y partes sueltas de cada sección */
  $$('.linea').forEach(function (l) { entrar(l.firstElementChild, { yPercent: 108 }, { trigger: null, duration: 1.1 }); });
  $$('[data-rise]').forEach(function (el) { entrar(el, { opacity: 0, y: 26 }, { duration: 0.9 }); });

  /* Qué hace */
  entrar('.intro__l1', { xPercent: -6, opacity: 0 }, { trigger: '.intro__title', duration: 1.1, start: 'top 80%' });
  entrar('.intro__l2', { xPercent: 6, opacity: 0 }, { trigger: '.intro__title', duration: 1.1, delay: 0.08, start: 'top 80%' });
  entrar('.intro__big img', { clipPath: 'inset(100% 0% 0% 0%)' }, { trigger: '.intro__big', duration: 1.3, start: 'top 80%' });
  gsap.to('.intro__small', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.intro__small', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* Medir */
  entrar('.slot', { scaleX: 0, transformOrigin: 'left center' }, { trigger: '.palabras', duration: 0.9, stagger: 0.12, start: 'top 80%' });
  entrar('.selector__panel', { opacity: 0, y: 40 }, { start: 'top 88%' });

  /* Líneas del catálogo */
  entrar('.lineas__tabla li', { opacity: 0, x: 30 }, { trigger: '.lineas__tabla', duration: 0.7, stagger: 0.045, start: 'top 84%' });

  /* ── Analizar: la misma foto a tres distancias ── */
  (function () {
    var sec = $('.analizar'), img = $('.analizar__frame img'), pasos = $$('.analizar__pasos li'), b = $('.analizar__b');
    if (!sec || !img) return;
    gsap.set(img, { transformOrigin: '0 0' });
    gsap.set(b, { opacity: 0, yPercent: 40 });
    var paso = 0;
    function poner(n) { if (n === paso) return; paso = n; pasos.forEach(function (li, i) { li.classList.toggle('is-on', i === n); }); }
    gsap.timeline({
      scrollTrigger: {
        trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.6,
        onUpdate: function (self) { var p = self.progress; poner(p < 0.3 ? 0 : p < 0.72 ? 1 : 2); }
      }
    })
      .to(img, { scale: 1.8, xPercent: -61.6, yPercent: 0, ease: 'power2.inOut', duration: 0.3 }, 0.12)
      .to(b, { opacity: 1, yPercent: 0, ease: 'power2.out', duration: 0.14 }, 0.2)
      .to(img, { scale: 3.2, xPercent: -84.5, yPercent: -180.5, ease: 'power2.inOut', duration: 0.3 }, 0.56)
      .to({}, { duration: 0.14 }, 0.86);
    entrar('.analizar__a', { yPercent: 60, opacity: 0 }, { trigger: '.analizar', start: 'top 55%' });
    entrar('.analizar__frame', { clipPath: 'inset(0% 0% 100% 0%)' }, { trigger: '.analizar', duration: 1.2, start: 'top 55%' });
  })();

  /* ── Proyectos: nombres y banda que cruza ── */
  entrar('.nombres', { opacity: 0, y: 40 }, { duration: 1.1 });
  ScrollTrigger.matchMedia({
    '(min-width: 801px)': function () {
      var pista = $('.banda__pista');
      if (!pista) return;
      gsap.to(pista, {
        x: function () { return -(pista.scrollWidth - window.innerWidth); }, ease: 'none',
        scrollTrigger: { trigger: '.banda', start: 'top 82%', end: 'bottom 12%', scrub: 0.6, invalidateOnRefresh: true }
      });
    }
  });

  /* ── Cifras que cuentan ── */
  $$('[data-count]').forEach(function (el) {
    var fin = parseInt(el.getAttribute('data-count'), 10), o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top bottom', once: true, onEnter: function () { el.textContent = '0'; } });
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: function () { gsap.to(o, { v: fin, duration: 1.8, ease: 'power3.out', onUpdate: function () { el.textContent = Math.round(o.v); } }); }
    });
  });
  entrar('.cifras__title span', { yPercent: 60, opacity: 0 }, { trigger: '.cifras__title', stagger: 0.1 });

  /* Tienda */
  entrar('.tienda__lado > *', { opacity: 0, y: 30 }, { trigger: '.tienda__lado', duration: 0.9, stagger: 0.1 });
  $$('.tienda__grupo').forEach(function (g) { entrar(g, { opacity: 0, y: 36 }, { duration: 0.9 }); });

  /* ── Transformar: la escalera ── */
  $$('.escalon').forEach(function (e) { entrar(e, { opacity: 0, x: -70 }, { start: 'top 90%' }); });

  /* ── Testimonio: las palabras se abren hasta los bordes ── */
  $$('.cita__l').forEach(function (l, i) {
    entrar(l.children[0], { x: 220, opacity: 0 }, { trigger: '.cita', duration: 1.3, delay: i * 0.1, start: 'top 80%' });
    entrar(l.children[1], { x: -220, opacity: 0 }, { trigger: '.cita', duration: 1.3, delay: i * 0.1, start: 'top 80%' });
  });
  entrar('.cita__firma span', { opacity: 0, y: 20 }, { trigger: '.cita__firma', duration: 0.8, stagger: 0.1, start: 'top 94%' });

  /* ── TechCamp ── */
  var tc = $$('.techcamp__title span');
  if (tc.length === 2) {
    gsap.timeline({ scrollTrigger: { trigger: '.techcamp', start: 'top bottom', end: 'bottom top', scrub: true } })
      .fromTo(tc[0], { xPercent: -14 }, { xPercent: 10, ease: 'none' }, 0)
      .fromTo(tc[1], { xPercent: 14 }, { xPercent: -10, ease: 'none' }, 0);
  }
  entrar('.print img', { clipPath: 'inset(0% 0% 100% 0%)' }, { trigger: '.techcamp', duration: 1.1, stagger: 0.14, start: 'top 55%' });
  entrar('.techcamp__p', { opacity: 0, y: 24 }, { trigger: '.techcamp', duration: 0.9, start: 'top 45%' });

  /* Nosotros y contacto */
  entrar('.nosotros__txt p', { opacity: 0, y: 36 }, { trigger: '.nosotros__txt', stagger: 0.12 });
  entrar('.nosotros__datos li', { opacity: 0, y: 20 }, { trigger: '.nosotros__datos', duration: 0.8, stagger: 0.08 });
  entrar(['.visita__title', '.visita__p', '.visita__datos > div', '.visita__curva'], { opacity: 0, y: 30 }, { trigger: '.visita', duration: 0.9, stagger: 0.07 });
  entrar(['.cierre__frase', '.cierre__foto', '.cierre__links > *'], { opacity: 0, y: 30 }, { trigger: '.cierre', duration: 0.9, stagger: 0.07 });

  /* ── Pie: el nombre sube ── */
  gsap.from('.pie__marca', { yPercent: 70, ease: 'none', scrollTrigger: { trigger: '.pie', start: 'top 60%', end: 'bottom bottom', scrub: 0.5 } });
  entrar(['.pie__inv', '.pie__arriba .btn', '.pie__redes li'], { opacity: 0, y: 30 }, { trigger: '.pie__arriba', duration: 0.9, stagger: 0.06 });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
