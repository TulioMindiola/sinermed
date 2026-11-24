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

  /* ── Medir: la frase sigue a la película y la película sigue a la frase ── */
  (function () {
    var video = $('#film video'), tomas = $$('.toma'), pie = $('#film-pie');
    if (!video || !tomas.length) return;
    var inicios = [0, 3.68, 6.84, 10.6], actual = 0;
    var textos = [
      'Captura de movimiento Xsens: el cuerpo y su doble digital, al mismo tiempo.',
      'Sensor en la barra: fuerza y velocidad de cada repetición.',
      'Ergoespirometría Cortex: el oxígeno de cada respiración.',
      'Seguimiento ocular Tobii: hacia dónde mira una persona y por cuánto tiempo.'
    ];
    function poner(n) {
      if (n === actual) return;
      actual = n;
      tomas.forEach(function (t, i) { t.classList.toggle('is-on', i === n); t.setAttribute('aria-pressed', i === n ? 'true' : 'false'); });
      pie.classList.add('is-out');
      setTimeout(function () { pie.textContent = textos[n]; pie.classList.remove('is-out'); }, 220);
    }
    function ver() {
      var t = video.currentTime + 0.02, n = 0;
      for (var i = 0; i < inicios.length; i++) if (t >= inicios[i]) n = i;
      poner(n);
    }
    video.addEventListener('timeupdate', ver);
    video.addEventListener('seeked', ver);
    function saltar(n) {
      try { video.currentTime = inicios[n] + 0.05; } catch (e) { /* todavía sin datos */ }
      if (!reduce) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
    }
    function ir(n) {
      var fin = video.seekable.length ? video.seekable.end(video.seekable.length - 1) : 0;
      poner(n);
      if (fin > inicios[n] || n === 0) { saltar(n); return; }
      /* El servidor no permite saltar dentro del video: se descarga entero una sola vez */
      var src = $('source', video).getAttribute('src');
      fetch(src).then(function (r) { return r.blob(); }).then(function (b) {
        video.addEventListener('loadeddata', function () { saltar(n); }, { once: true });
        video.src = URL.createObjectURL(b);
      }).catch(function () {});
    }
    tomas.forEach(function (t, i) {
      t.setAttribute('role', 'button'); t.setAttribute('tabindex', '0'); t.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      t.addEventListener('click', function () { ir(i); });
      t.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ir(i); } });
    });
  })();

  /* ── El cuerpo, convertido en datos: el esqueleto se calculó cuadro por cuadro sobre este mismo video ── */
  (function () {
    var caja = $('#cuerpo'), lienzo = $('.cuerpo__lienzo'), corte = $('#cuerpo-corte'), tabla = $('#angulos');
    if (!caja || !lienzo || !lienzo.getContext) return;
    var video = $('video', caja), ctx = lienzo.getContext('2d'), D = null, P = {}, W = 0, H = 0;
    var visible = false, raf = 0, w = 1, meta = 1, mano = null, suelta = 0, filas = {};
    var VERDE = '#9aca3b', AZUL = '#3aa5e6', BLANCO = '#f3f7f6';
    var SEG = [[11, 12, BLANCO], [11, 23, BLANCO], [12, 24, BLANCO], [23, 24, BLANCO], [11, 13, AZUL], [13, 15, AZUL], [23, 25, AZUL], [25, 27, AZUL], [27, 29, AZUL], [29, 31, AZUL], [27, 31, AZUL], [12, 14, VERDE], [14, 16, VERDE], [24, 26, VERDE], [26, 28, VERDE], [28, 30, VERDE], [30, 32, VERDE], [28, 32, VERDE]];
    var PUN = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28, 31, 32];

    function medir() {
      var r = caja.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      lienzo.width = Math.round(W * d); lienzo.height = Math.round(H * d);
      ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    /* El video se recorta con «cover»: los puntos siguen el mismo recorte */
    function ajuste() { var e = Math.max(W / 9, H / 14), vw = 9 * e, vh = 14 * e; return { x: (W - vw) / 2, y: (H - vh) / 2, w: vw, h: vh }; }
    function pose() {
      var f = (video.currentTime * D.fps) % D.n, a = Math.floor(f), b = (a + 1) % D.n, t = f - a, c = ajuste();
      D.id.forEach(function (id, i) {
        var p = D.p[a][i], q = D.p[b][i];
        P[id] = [c.x + (p[0] + (q[0] - p[0]) * t) * c.w, c.y + (p[1] + (q[1] - p[1]) * t) * c.h];
      });
      return f;
    }
    function linea(a, b, g, col) { ctx.strokeStyle = col; ctx.lineWidth = g; ctx.beginPath(); ctx.moveTo(P[a][0], P[a][1]); ctx.lineTo(P[b][0], P[b][1]); ctx.stroke(); }
    function arco(c, a, b, r, txt, lado) {
      var a0 = Math.atan2(P[a][1] - P[c][1], P[a][0] - P[c][0]), a1 = Math.atan2(P[b][1] - P[c][1], P[b][0] - P[c][0]), d = a1 - a0;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      ctx.strokeStyle = BLANCO; ctx.lineWidth = Math.max(2, W * 0.0045);
      ctx.beginPath(); ctx.arc(P[c][0], P[c][1], r, a0, a0 + d, d < 0); ctx.stroke();
      ctx.fillStyle = BLANCO; ctx.font = '800 ' + Math.round(W * 0.046) + 'px "Schibsted Grotesk", sans-serif';
      ctx.textAlign = lado > 0 ? 'left' : 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(txt, P[c][0] + lado * r * 1.35, P[c][1]);
    }
    function dibujar(ahora) {
      raf = 0;
      if (!D) return;
      if (mano !== null) meta = mano;
      else if (ahora > suelta) {
        var r = caja.getBoundingClientRect(), vh = window.innerHeight, p = (vh - r.top) / (vh + r.height);
        meta = p < 0.28 ? 1 : p < 0.5 ? 1 - (p - 0.28) / 0.22 * 0.5 : p < 0.64 ? 0.5 : Math.max(0.06, 0.5 - (p - 0.64) / 0.2 * 0.44);
      }
      w += (meta - w) * (reduce ? 1 : 0.14);
      var f = pose(), x = w * W, g = W * 0.0125, i0 = Math.floor(f) % D.n, c = ajuste();
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = ctx.lineJoin = 'round';

      /* lado del cuerpo: solo se marcan las articulaciones */
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, x, H); ctx.clip();
      ctx.strokeStyle = BLANCO; ctx.lineWidth = Math.max(1.5, W * 0.0035);
      PUN.forEach(function (k) { ctx.beginPath(); ctx.arc(P[k][0], P[k][1], W * 0.014, 0, 7); ctx.stroke(); });
      ctx.restore();

      /* lado de los datos */
      ctx.save(); ctx.beginPath(); ctx.rect(x, 0, W - x, H); ctx.clip();
      ctx.fillStyle = 'rgba(6, 22, 36, 0.93)'; ctx.fillRect(x, 0, W - x, H);
      ctx.fillStyle = 'rgba(243, 247, 246, 0.1)';
      for (var gy = W / 24; gy < H; gy += W / 12) for (var gx = W / 24; gx < W; gx += W / 12) if (gx > x - 2) ctx.fillRect(gx - 1, gy - 1, 2, 2);
      [[28, VERDE], [27, AZUL], [16, VERDE]].forEach(function (q) { /* recorrido de los tobillos y la mano en el ciclo */
        var i = D.id.indexOf(q[0]);
        ctx.globalAlpha = 0.45; ctx.strokeStyle = q[1]; ctx.lineWidth = Math.max(1.5, W * 0.004); ctx.beginPath();
        for (var k = 0; k <= D.n; k++) { var pt = D.p[k % D.n][i]; ctx[k ? 'lineTo' : 'moveTo'](c.x + pt[0] * c.w, c.y + pt[1] * c.h); }
        ctx.stroke(); ctx.globalAlpha = 1;
      });
      SEG.forEach(function (s) { linea(s[0], s[1], g, s[2]); });
      var cx = (P[7][0] + P[8][0] + P[0][0]) / 3, cy = (P[7][1] + P[8][1] + P[0][1]) / 3 - W * 0.012, nx = (P[11][0] + P[12][0]) / 2, ny = (P[11][1] + P[12][1]) / 2, L = Math.hypot(nx - cx, ny - cy) || 1, rc = W * 0.078;
      ctx.strokeStyle = BLANCO; ctx.lineWidth = g;
      ctx.beginPath(); ctx.arc(cx, cy, rc, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(cx + (nx - cx) * rc / L, cy + (ny - cy) * rc / L); ctx.stroke();
      ctx.fillStyle = BLANCO;
      PUN.forEach(function (k) { ctx.beginPath(); ctx.arc(P[k][0], P[k][1], W * 0.0145, 0, 7); ctx.fill(); });
      arco(26, 24, 28, W * 0.075, Math.round(D.a.rodilla[i0]) + '°', -1);
      arco(14, 12, 16, W * 0.06, Math.round(D.a.codo[i0]) + '°', -1);
      ctx.restore();

      corte.style.left = (w * 100) + '%';
      corte.setAttribute('aria-valuenow', Math.round((1 - w) * 100));
      Object.keys(filas).forEach(function (k) {
        var q = filas[k], a = D.a[k][i0];
        q.n.textContent = Math.round(a) + '°';
        q.punto.style.left = (q.izq + f / D.n * q.ancho) + 'px';
        q.punto.style.top = (q.arriba + (52 - (a - q.lo) / (q.hi - q.lo) * 48) / 56 * q.alto) + 'px';
      });
      if (visible && (!reduce || Math.abs(meta - w) > 0.002)) pedir();
    }
    function pedir() { if (!raf) raf = requestAnimationFrame(dibujar); }
    function medirFilas() {
      Object.keys(filas).forEach(function (k) {
        var q = filas[k], a = q.svg.getBoundingClientRect(), b = q.fila.getBoundingClientRect();
        q.ancho = a.width; q.alto = a.height; q.arriba = a.top - b.top; q.izq = a.left - b.left;
      });
    }

    function arrancar(d) {
      D = d; medir();
      caja.classList.add('is-viva'); tabla.classList.add('is-viva');
      $$('[data-ang]', tabla).forEach(function (fila) {
        var k = fila.getAttribute('data-ang'), a = D.a[k], lo = Math.min.apply(null, a), hi = Math.max.apply(null, a), pts = [];
        for (var i = 0; i <= D.n; i++) pts.push((i / D.n * 300).toFixed(1) + ',' + (52 - (a[i % D.n] - lo) / (hi - lo) * 48).toFixed(1));
        fila.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 300 56" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + pts.join(' ') + '" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg><i class="angulos__punto"></i>');
        filas[k] = { fila: fila, n: $('dd', fila), svg: $('svg', fila), punto: $('.angulos__punto', fila), lo: lo, hi: hi };
      });
      medirFilas(); pedir();
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }
    var pedido = false;
    function cargar() {
      if (pedido) return;
      pedido = true;
      fetch('assets/js/cuerpo.json?v=1').then(function (r) { return r.json(); }).then(arrancar).catch(function () {});
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { if (es[es.length - 1].isIntersecting) cargar(); }, { rootMargin: '800px 0px' }).observe(caja);
      new IntersectionObserver(function (es) {
        visible = es[es.length - 1].isIntersecting;
        if (visible) { video.playbackRate = 0.8; if (D) medirFilas(); pedir(); }
      }, { threshold: 0.02 }).observe(caja);
    } else { visible = true; cargar(); }
    window.addEventListener('resize', function () { if (D) { medir(); medirFilas(); pedir(); } });
    window.addEventListener('scroll', function () { if (D && visible) pedir(); }, { passive: true });

    /* El corte sigue al cursor o al dedo, y se mueve con las flechas del teclado */
    function aqui(e) { var r = caja.getBoundingClientRect(); mano = Math.min(0.98, Math.max(0.02, (e.clientX - r.left) / r.width)); pedir(); }
    function soltar() { if (mano === null) return; mano = null; suelta = performance.now() + 900; setTimeout(pedir, 920); }
    caja.addEventListener('pointerdown', function (e) { aqui(e); });
    caja.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse' || e.buttons) aqui(e); });
    caja.addEventListener('pointerleave', soltar);
    caja.addEventListener('pointercancel', soltar);
    caja.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') soltar(); });
    corte.addEventListener('keydown', function (e) {
      var d = { ArrowLeft: -0.05, ArrowDown: -0.05, ArrowRight: 0.05, ArrowUp: 0.05 }[e.key];
      if (!d) return;
      e.preventDefault();
      mano = Math.min(0.98, Math.max(0.02, meta + d));
      pedir();
    });
    corte.addEventListener('blur', soltar);
  })();

  /* ── Catálogo: cada fila cambia la imagen grande ── */
  (function () {
    var marco = $('#lineas-marco'), pie = $('#lineas-pie');
    if (!marco || !pie) return;
    var base = pie.textContent, fotos = {}, actual = null, volver;
    function poner(a) {
      clearTimeout(volver);
      var src = a && a.getAttribute('data-img');
      if (src && !fotos[src]) {
        var im = new Image();
        im.alt = ''; im.decoding = 'async'; im.src = src;
        marco.appendChild(im); fotos[src] = im;
        void im.offsetWidth;
      }
      if (src === actual) return;
      if (actual && fotos[actual]) fotos[actual].classList.remove('is-on');
      actual = src || null;
      if (actual) fotos[actual].classList.add('is-on');
      pie.textContent = (src && a.getAttribute('data-pie')) || base;
    }
    $$('.lineas__tabla a').forEach(function (a) {
      a.addEventListener('mouseenter', function () { poner(a); });
      a.addEventListener('focus', function () { poner(a); });
      a.addEventListener('blur', function () { poner(null); });
    });
    $('.lineas__tabla').addEventListener('mouseleave', function () { volver = setTimeout(function () { poner(null); }, 260); });
  })();

  /* ── Tienda: cada equipo en 3D junto a su fila ── */
  (function () {
    var caja = $('#visor-caja'), filas = $$('.tienda__grupo a[data-m]'), lista = $('.tienda__lista');
    if (!caja || !filas.length) return;
    var orden = filas.map(function (a) { return a.getAttribute('data-m'); });
    var poster = $('.visor__poster', caja), nom = $('#visor-n'), pre = $('#visor-p');
    var visor = null, actual = null, encima = false, plano = null;
    function nombre(a) { return $('.tienda__n', a).textContent; }
    function marcar(a) {
      if (!a || a === actual) return;
      if (actual) actual.classList.remove('is-on');
      actual = a; a.classList.add('is-on');
      nom.textContent = nombre(a); pre.textContent = '$' + $('.tienda__p', a).textContent;
      caja.setAttribute('aria-label', 'Modelo 3D del equipo ' + nombre(a));
      var k = a.getAttribute('data-m'), i = orden.indexOf(k);
      if (visor) {
        visor.mostrar(k);
        [i + 1, i - 1, i + 2].forEach(function (j) { if (orden[j]) visor.precargar(orden[j]); });
      } else if (plano) plano(k);
    }
    function porPosicion() {
      if (encima) return;
      var r = lista.getBoundingClientRect(), vh = window.innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      /* La marca baja con el recorrido: primera fila al entrar, última al llegar al final */
      var techo = desktop.matches ? nav.offsetHeight : nav.offsetHeight + caja.parentNode.offsetHeight, alto = vh - techo;
      var av = Math.min(1, Math.max(0, (techo - r.top) / Math.max(1, r.height - alto)));
      var y = techo + alto * (0.06 + 0.9 * av);
      var mejor = filas[0], d = 1e9;
      filas.forEach(function (a) { var q = a.getBoundingClientRect(), e = Math.abs((q.top + q.bottom) / 2 - y); if (e < d) { d = e; mejor = a; } });
      marcar(mejor);
    }
    var pend = false;
    /* manda lo último que hizo el visitante: mover el cursor sobre una fila o desplazarse */
    window.addEventListener('scroll', function () { encima = false; if (pend) return; pend = true; requestAnimationFrame(function () { pend = false; porPosicion(); }); }, { passive: true });
    filas.forEach(function (a) {
      a.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse' && (e.movementX || e.movementY)) { encima = true; marcar(a); } });
      a.addEventListener('focus', function () { marcar(a); });
    });
    lista.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') encima = false; });
    actual = null; marcar(filas[0]);

    /* Sin WebGL: el recorte plano del equipo sobre el cuadrado azul */
    function sin3d() {
      fetch('assets/3d/modelos.json?v=2').then(function (r) { return r.json(); }).then(function (d) {
        caja.classList.add('is-plano');
        plano = function (k) {
          var e = d.equipos[k]; if (!e) return;
          poster.style.clipPath = 'polygon(' + e.c.map(function (p) { return (p[0] * 100).toFixed(2) + '% ' + (p[1] * 100).toFixed(2) + '%'; }).join(',') + ')';
          poster.src = 'assets/3d/' + k + '.webp';
        };
        plano(actual.getAttribute('data-m'));
      }).catch(function () {});
    }
    function cargar() {
      var sc = document.createElement('script');
      sc.src = 'assets/js/tienda3d.js?v=7'; sc.async = true;
      sc.onload = function () {
        visor = window.Tienda3D && window.Tienda3D.montar(caja, { base: 'assets/3d/', orden: orden, v: 2 });
        if (!visor) { sin3d(); return; }
        var k = actual.getAttribute('data-m'); visor.mostrar(k);
        var i = orden.indexOf(k); if (orden[i + 1]) visor.precargar(orden[i + 1]);
      };
      sc.onerror = sin3d;
      document.head.appendChild(sc);
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); cargar(); } }, { rootMargin: '1200px 0px' });
      io.observe($('#tienda'));
    } else cargar();
  })();

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
  entrar('.angulos > div', { opacity: 0, y: 24 }, { trigger: '.angulos', duration: 0.8, stagger: 0.08, start: 'top 96%' });

  /* Medir */
  ScrollTrigger.matchMedia({
    '(min-width: 801px)': function () {
      gsap.fromTo('.film__cuadro', { clipPath: 'inset(0% 16% 0% 16%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: '.film', start: 'top 92%', end: 'top 24%', scrub: true } });
      gsap.fromTo('.film video', { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.film', start: 'top bottom', end: 'bottom 40%', scrub: true } });
    }
  });
  entrar('.selector__panel', { opacity: 0, y: 40 }, { start: 'top 88%' });

  /* Líneas del catálogo */
  entrar('.lineas__media', { clipPath: 'inset(0% 100% 0% 0%)' }, { trigger: '.lineas', duration: 1.2, start: 'top 72%' });
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

  /* ── Proyectos: el muro de clientes y la banda que cruza ── */
  entrar('.confian__title', { opacity: 0, y: 40 }, { duration: 1 });
  entrar('.confian__muro li', { opacity: 0, y: 22 }, { trigger: '.confian__muro', duration: 0.7, stagger: 0.028, start: 'top 88%' });
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
  entrar('.tienda__cab > *', { opacity: 0, y: 30 }, { trigger: '.tienda__cab', duration: 0.9, stagger: 0.1 });
  entrar('.visor', { opacity: 0 }, { duration: 0.9 });
  $$('.tienda__grupo').forEach(function (g) { entrar(g, { opacity: 0, y: 36 }, { duration: 0.9 }); });

  /* ── Transformar: la escalera ── */
  $$('.escalon').forEach(function (e) { entrar(e, { opacity: 0, x: -70 }, { start: 'top 90%' }); });

  /* ── Testimonio: las palabras se abren hasta los bordes ── */
  $$('.cita__l').forEach(function (l, i) {
    entrar(l.children[0], { x: 220, opacity: 0 }, { trigger: '.cita', duration: 1.3, delay: i * 0.1, start: 'top 80%' });
    entrar(l.children[1], { x: -220, opacity: 0 }, { trigger: '.cita', duration: 1.3, delay: i * 0.1, start: 'top 80%' });
  });
  entrar('.cita__firma span', { opacity: 0, y: 20 }, { trigger: '.cita__firma', duration: 0.8, stagger: 0.1, start: 'top 94%' });

  /* ── TechCamp: las letras suben una por una y el video se abre ── */
  ScrollTrigger.create({ trigger: '.techcamp', start: 'top bottom', once: true, onEnter: function () { gsap.set('.techcamp__title .letra', { yPercent: 108 }); } });
  ScrollTrigger.create({ trigger: '.techcamp', start: 'top 72%', once: true, onEnter: function () { gsap.to('.techcamp__title .letra', { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.06 }); } });
  entrar('.techcamp__video', { clipPath: 'inset(0% 0% 100% 0%)' }, { duration: 1.2, start: 'top 86%' });
  entrar('.techcamp__foto img', { clipPath: 'inset(0% 0% 100% 0%)' }, { trigger: '.techcamp__foto', duration: 1.1, start: 'top 92%' });

  /* ── Nosotros ── */
  entrar('.nosotros__txt > *', { opacity: 0, y: 30 }, { trigger: '.nosotros__txt', duration: 0.9, stagger: 0.1 });
  entrar('.nosotros__foto', { clipPath: 'inset(0% 0% 0% 100%)' }, { duration: 1.3, start: 'top 82%' });
  gsap.fromTo('.nosotros__foto img', { scale: 1.14 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.nosotros__foto', start: 'top bottom', end: 'bottom 30%', scrub: true } });
  entrar('.valores li', { opacity: 0, y: 34 }, { trigger: '.valores', duration: 0.8, stagger: 0.08, start: 'top 92%' });

  /* ── Contacto ── */
  entrar(['.visita__title', '.visita__p', '.visita__datos > div', '.visita__curva'], { opacity: 0, y: 30 }, { trigger: '.visita', duration: 0.9, stagger: 0.07 });
  entrar(['.cierre__frase', '.cierre__links > *'], { opacity: 0, y: 30 }, { trigger: '.cierre', duration: 0.9, stagger: 0.07 });
  gsap.fromTo('.cierre__foto', { y: 46, rotation: -7 }, { y: -26, rotation: 3, ease: 'none', scrollTrigger: { trigger: '.cierre__arte', start: 'top bottom', end: 'bottom top', scrub: 0.6 } });

  /* ── Pie (el nombre se anima en pie.js) ── */
  entrar(['.pie__inv', '.pie__arriba .btn', '.pie__redes li'], { opacity: 0, y: 30 }, { trigger: '.pie__arriba', duration: 0.9, stagger: 0.06 });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
