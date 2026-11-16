// BUTBUIL · filtros de trabajos, visor de fotos, antes/después, barra del móvil y formulario → WhatsApp
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // filtros de la galería
  const filtros = $$('[data-filtro]');
  filtros.forEach((b) => b.addEventListener('click', () => {
    const c = b.dataset.filtro;
    filtros.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    $$('.obra').forEach((o) => { o.hidden = c !== 'todas' && o.dataset.cat !== c; });
  }));

  // visor de fotos de una obra (las fotos grandes solo se cargan al abrir)
  const datos = JSON.parse($('#datos-obras').textContent);
  const dlg = $('#visor');
  const img = $('[data-img]', dlg), tipo = $('[data-tipo]', dlg), cont = $('[data-cont]', dlg), minis = $('[data-minis]', dlg);
  let obra = null, n = 0, desde = null;
  const srcset = (f, ext) => f.a.map((a) => `img/${f.id}-${a}.${ext} ${a}w`).join(', ');
  const webp = (() => { try { return document.createElement('canvas').toDataURL('image/webp').startsWith('data:image/webp'); } catch { return false; } })();
  function pinta() {
    const f = obra.fotos[n];
    img.srcset = srcset(f, webp ? 'webp' : 'jpg');
    img.sizes = '(min-width: 900px) 760px, 100vw';
    img.src = `img/${f.id}-${f.a[0]}.jpg`;
    img.width = f.w; img.height = f.h;
    img.alt = `${obra.t} · ${f.tipo} (${n + 1} de ${obra.fotos.length})`;
    tipo.textContent = f.tipo; tipo.dataset.t = f.tipo;
    cont.textContent = `Foto ${n + 1} de ${obra.fotos.length}`;
    $$('button', minis).forEach((b, i) => b.setAttribute('aria-current', String(i === n)));
    const sig = obra.fotos[(n + 1) % obra.fotos.length];   // precarga la siguiente
    new Image().src = `img/${sig.id}-${sig.a[0]}.${webp ? 'webp' : 'jpg'}`;
  }
  function abre(id, boton) {
    obra = datos[id]; n = 0; desde = boton;
    $('[data-titulo]', dlg).textContent = obra.t;
    $('[data-fecha]', dlg).textContent = obra.f;
    $('[data-texto]', dlg).textContent = obra.x;
    $('[data-reel]', dlg).href = obra.r;
    minis.innerHTML = obra.fotos.map((f, i) => `<li><button type="button" data-ir="${i}">${i + 1}. ${f.tipo}</button></li>`).join('');
    pinta();
    dlg.showModal();
  }
  const mueve = (d) => { n = (n + d + obra.fotos.length) % obra.fotos.length; pinta(); };
  $$('[data-obra]').forEach((b) => b.addEventListener('click', () => abre(b.dataset.obra, b)));
  $('[data-ant]', dlg).addEventListener('click', () => mueve(-1));
  $('[data-sig]', dlg).addEventListener('click', () => mueve(1));
  $('[data-cerrar]', dlg).addEventListener('click', () => dlg.close());
  minis.addEventListener('click', (e) => { const b = e.target.closest('[data-ir]'); if (b) { n = +b.dataset.ir; pinta(); } });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') mueve(1); if (e.key === 'ArrowLeft') mueve(-1); });
  dlg.addEventListener('close', () => { img.removeAttribute('srcset'); img.removeAttribute('src'); desde?.focus(); });
  let x0 = null;   // deslizar con el dedo
  img.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  img.addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) mueve(dx < 0 ? 1 : -1); x0 = null; });

  // antes / después
  const visor = $('[data-ad-visor]'), rango = $('.ad__control', visor);
  rango.addEventListener('input', () => visor.style.setProperty('--p', rango.value + '%'));
  $$('[data-ad]').forEach((t) => t.addEventListener('click', () => {
    $$('[data-ad]').forEach((x) => x.setAttribute('aria-selected', String(x === t)));
    $$('[data-escena]', visor).forEach((e) => { e.hidden = e.dataset.escena !== t.dataset.ad; });
    rango.value = 50; visor.style.setProperty('--p', '50%');
  }));

  // barra fija del móvil: aparece tras la portada y se esconde en contacto
  const barra = $('#barra');
  if ('IntersectionObserver' in window) {
    let tras = false, enContacto = false;
    const pinta2 = () => { const v = tras && !enContacto; barra.classList.toggle('visible', v); barra.setAttribute('aria-hidden', String(!v)); $$('a', barra).forEach((a) => (a.tabIndex = v ? 0 : -1)); };
    new IntersectionObserver(([e]) => { tras = !e.isIntersecting; pinta2(); }).observe($('.portada'));
    new IntersectionObserver(([e]) => { enContacto = e.isIntersecting; pinta2(); }, { threshold: 0.05 }).observe($('#contacto'));
  }

  // formulario → WhatsApp con el mensaje escrito
  const f = $('#formulario');
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = f.nombre.value.trim();
    if (!nombre) { f.nombre.setAttribute('aria-invalid', 'true'); f.nombre.focus(); return; }
    f.nombre.removeAttribute('aria-invalid');
    const lugar = f.lugar.value.trim(), extra = f.mensaje.value.trim();
    const t = `Hola, soy ${nombre}. Quiero presupuesto: ${f.obra.value.toLowerCase()}${lugar ? ` en ${lugar}` : ''}.${extra ? `\n${extra}` : ''}`;
    window.open(`https://wa.me/${f.dataset.tel}?text=${encodeURIComponent(t)}`, '_blank', 'noopener');
  });
})();
