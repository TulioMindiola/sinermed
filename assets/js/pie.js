/* Sinermed · titulares a todo el ancho y pie de página animado · ImpulsaPixel
   [data-ajustar]: el texto se parte en letras y crece hasta ocupar exactamente el ancho de su caja.
   .pie__marca: las letras suben una por una, el cuadrado azul del logo entra detrás de la S y un pulso recorre el nombre. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var todos = Array.prototype.slice.call(document.querySelectorAll('[data-ajustar]'));
  if (!todos.length) return;

  todos.forEach(function (el) {
    var txt = el.textContent.trim(), caja = document.createElement('span');
    caja.className = 'letras'; caja.setAttribute('aria-hidden', 'true');
    if (el.getAttribute('aria-hidden') !== 'true') el.setAttribute('aria-label', txt);
    txt.split('').forEach(function (c) { var s = document.createElement('span'); s.className = 'letra'; s.textContent = c; caja.appendChild(s); });
    el.textContent = ''; el.appendChild(caja);
  });

  function ajustar() {
    todos.forEach(function (el) {
      var caja = el.firstChild, est = getComputedStyle(el);
      var libre = el.clientWidth - parseFloat(est.paddingLeft) - parseFloat(est.paddingRight);
      if (libre <= 0) return;
      caja.style.fontSize = '100px';
      var w = caja.getBoundingClientRect().width;
      if (w) caja.style.fontSize = (100 * libre / w).toFixed(2) + 'px';
    });
  }
  ajustar();
  var pend;
  window.addEventListener('resize', function () { clearTimeout(pend); pend = setTimeout(function () { ajustar(); if (ST) ST.refresh(); }, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ajustar(); if (ST) ST.refresh(); });

  var pie = document.querySelector('.pie'), marca = document.querySelector('.pie__marca');
  if (!pie || !marca) return;
  var letras = Array.prototype.slice.call(marca.querySelectorAll('.letra'));
  var cuadro = document.createElement('i');
  cuadro.className = 'pie__cuadro';
  letras[0].insertBefore(cuadro, letras[0].firstChild);
  if (reduce || !gsap || !ST) return;
  gsap.registerPlugin(ST);

  /* Cada letra lleva dentro otra caja: la de afuera entra, la de adentro late */
  var dentro = letras.map(function (l) {
    var s = document.createElement('span'); s.className = 'letra__in';
    s.textContent = l.textContent;
    Array.prototype.slice.call(l.childNodes).forEach(function (n) { if (n !== cuadro) l.removeChild(n); });
    l.appendChild(s); return s;
  });
  var lista = false, pulso = null, reposo = null;

  var entra = gsap.timeline({ paused: true, onComplete: function () { lista = true; programar(0.9); } });
  gsap.set(letras, { yPercent: 118, rotation: 7, transformOrigin: '0% 100%' });
  gsap.set(cuadro, { scale: 0, rotation: -38 });
  entra.to(letras, { yPercent: 0, rotation: 0, duration: 1.15, ease: 'expo.out', stagger: 0.07 }, 0)
    .to(cuadro, { scale: 1, rotation: 0, duration: 0.95, ease: 'back.out(1.7)' }, 0.62);

  /* El pulso: una onda que estira cada letra desde la base, como un latido */
  function latir() {
    if (!lista) return;
    if (pulso) pulso.kill();
    pulso = gsap.timeline({ onComplete: function () { programar(3.4); } });
    dentro.forEach(function (s, i) {
      pulso.to(s, { scaleY: 1.17, duration: 0.2, ease: 'power2.out' }, i * 0.075)
        .to(s, { scaleY: 0.95, duration: 0.18, ease: 'power1.inOut' }, i * 0.075 + 0.2)
        .to(s, { scaleY: 1, duration: 0.55, ease: 'elastic.out(1, 0.45)' }, i * 0.075 + 0.38);
    });
    pulso.to(cuadro, { rotation: '+=90', duration: 0.9, ease: 'expo.inOut' }, 0);
  }
  function programar(s) { if (reposo) reposo.kill(); reposo = gsap.delayedCall(s, latir); }

  ST.create({
    trigger: marca, start: 'top 94%',
    onEnter: function () { entra.play(); },
    onLeaveBack: function () {
      lista = false;
      if (pulso) pulso.kill();
      if (reposo) reposo.kill();
      gsap.set(dentro, { scaleY: 1 });
      gsap.set(cuadro, { rotation: -38 });
      entra.pause(0);
    }
  });

  /* El cursor levanta las letras que tiene cerca */
  if (window.matchMedia('(hover: hover)').matches) {
    var sube = dentro.map(function (s) { return gsap.quickTo(s, 'scaleY', { duration: 0.45, ease: 'power3.out' }); });
    marca.addEventListener('pointermove', function (e) {
      if (!lista) return;
      if (pulso) { pulso.kill(); pulso = null; }
      if (reposo) reposo.kill();
      letras.forEach(function (l, i) {
        var r = l.getBoundingClientRect(), d = Math.abs(e.clientX - (r.left + r.width / 2)) / (window.innerWidth * 0.2);
        sube[i](1 + 0.2 * Math.max(0, 1 - d * d));
      });
    });
    marca.addEventListener('pointerleave', function () { if (!lista) return; sube.forEach(function (f) { f(1); }); programar(2.4); });
  }
})();
