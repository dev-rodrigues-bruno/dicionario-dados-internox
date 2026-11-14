/* Dicionario de Dados - Internox Acos e Tubos Ltda.
   Tema claro/escuro, menu responsivo, busca em tempo real, secao ativa e modal do DER com Panzoom. */
(function () {
  'use strict';

  var raiz = document.documentElement;

  /* ---------- Tema ---------- */
  var btnTema = document.getElementById('btnTema');
  var txtTema = document.getElementById('txtTema');
  function aplicarTema(t) {
    raiz.setAttribute('data-tema', t);
    txtTema.textContent = t === 'escuro' ? 'Tema claro' : 'Tema escuro';
    btnTema.setAttribute('aria-pressed', t === 'escuro' ? 'true' : 'false');
    try { localStorage.setItem('tema', t); } catch (e) { /* sem armazenamento: segue sem lembrar */ }
  }
  aplicarTema(raiz.getAttribute('data-tema') || 'claro');
  btnTema.addEventListener('click', function () {
    aplicarTema(raiz.getAttribute('data-tema') === 'escuro' ? 'claro' : 'escuro');
  });

  /* ---------- Menu lateral no celular ---------- */
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('overlay');
  var btnMenu = document.getElementById('btnMenu');
  function menu(abrir) {
    sidebar.classList.toggle('aberta', abrir);
    overlay.hidden = !abrir;
    btnMenu.setAttribute('aria-expanded', abrir ? 'true' : 'false');
  }
  btnMenu.addEventListener('click', function () { menu(!sidebar.classList.contains('aberta')); });
  overlay.addEventListener('click', function () { menu(false); });
  sidebar.addEventListener('click', function (ev) {
    if (ev.target.closest('a') && window.matchMedia('(max-width: 860px)').matches) { menu(false); }
  });

  /* ---------- Secao ativa na sidebar ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.sidebar a[data-alvo]'));
  var mapaLinks = {};
  links.forEach(function (a) { mapaLinks[a.getAttribute('data-alvo')] = a; });
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting && mapaLinks[en.target.id]) {
          links.forEach(function (a) { a.classList.remove('ativo'); });
          mapaLinks[en.target.id].classList.add('ativo');
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    Object.keys(mapaLinks).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { obs.observe(el); }
    });
  }

  /* ---------- Busca em tempo real ---------- */
  var busca = document.getElementById('busca');
  var buscaRes = document.getElementById('buscaRes');
  var semResultado = document.getElementById('semResultado');
  var secoes = Array.prototype.slice.call(document.querySelectorAll('section.tabela'));
  var nomesOriginais = new Map();
  secoes.forEach(function (s) {
    s.querySelectorAll('td.attr code').forEach(function (c) { nomesOriginais.set(c, c.textContent); });
  });

  function normalizar(t) {
    return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  function escapar(t) {
    return t.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  function destacar(el, termo) {
    var txt = nomesOriginais.get(el);
    if (!termo) { el.textContent = txt; return; }
    var i = normalizar(txt).indexOf(termo);
    if (i < 0) { el.textContent = txt; return; }
    el.innerHTML = escapar(txt.slice(0, i)) + '<mark>' + escapar(txt.slice(i, i + termo.length)) + '</mark>' + escapar(txt.slice(i + termo.length));
  }

  function filtrar() {
    var termo = normalizar(busca.value.trim());
    var totalLinhas = 0, totalTabelas = 0;
    secoes.forEach(function (s) {
      var nomeTabela = normalizar(s.getAttribute('data-nome'));
      var tabelaCasa = termo && nomeTabela.indexOf(termo) >= 0;
      var visiveis = 0;
      s.querySelectorAll('tbody tr').forEach(function (tr) {
        var casa = !termo || tabelaCasa || normalizar(tr.getAttribute('data-busca')).indexOf(termo) >= 0;
        tr.classList.toggle('oculto', !casa);
        destacar(tr.querySelector('td.attr code'), termo);
        if (casa) { visiveis++; }
      });
      var mostrar = visiveis > 0;
      s.classList.toggle('oculto', !mostrar);
      var link = mapaLinks['tabela_' + s.getAttribute('data-nome')];
      if (link) { link.classList.toggle('oculto', !mostrar); }
      if (mostrar) { totalTabelas++; totalLinhas += visiveis; }
    });
    semResultado.hidden = totalTabelas > 0;
    buscaRes.textContent = termo ? totalTabelas + ' tabela(s), ' + totalLinhas + ' coluna(s)' : '';
  }
  busca.addEventListener('input', filtrar);
  busca.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') { busca.value = ''; filtrar(); }
  });

  /* ---------- Modal do DER com Panzoom ---------- */
  var modal = document.getElementById('modalDer');
  var palco = document.getElementById('palcoDer');
  var img = document.getElementById('imgDer');
  var btnDer = document.getElementById('btnDer');
  var pz = null;

  function iniciarPanzoom() {
    if (pz || typeof window.Panzoom !== 'function') { return; }
    pz = window.Panzoom(img, { maxScale: 8, minScale: 0.5, step: 0.3, canvas: true, cursor: 'grab' });
    palco.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      pz.zoomWithWheel(ev);
    }, { passive: false });
  }
  function abrirDer() {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    iniciarPanzoom();
    if (pz) { pz.reset({ animate: false }); }
    document.getElementById('fecharDer').focus();
  }
  function fecharDer() {
    modal.hidden = true;
    document.body.style.overflow = '';
    btnDer.focus();
  }
  btnDer.addEventListener('click', abrirDer);
  document.getElementById('fecharDer').addEventListener('click', fecharDer);
  document.getElementById('zoomMais').addEventListener('click', function () { if (pz) { pz.zoomIn(); } });
  document.getElementById('zoomMenos').addEventListener('click', function () { if (pz) { pz.zoomOut(); } });
  document.getElementById('zoomReset').addEventListener('click', function () { if (pz) { pz.reset(); } });
  document.addEventListener('keydown', function (ev) {
    if (!modal.hidden && ev.key === 'Escape') { fecharDer(); }
  });
})();
