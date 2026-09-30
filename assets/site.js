/* Site da Nuzi: animações e navegação. Sem dependências; tudo funciona sem JS, só fica parado. */
(() => {
  'use strict';

  const calmo = matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (sel, raiz = document) => raiz.querySelector(sel);
  const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
  const limita = (v, min, max) => Math.min(max, Math.max(min, v));
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------- Rolagem: um só laço para friso, zigurate e índice ---------- */
  const aoRolar = [];
  let pedido = 0;
  const agenda = () => {
    if (pedido) return;
    pedido = requestAnimationFrame(() => {
      pedido = 0;
      for (const fn of aoRolar) fn();
    });
  };
  addEventListener('scroll', agenda, { passive: true });
  addEventListener('resize', agenda);

  /* ---------- Entrada ao rolar ---------- */
  function revelar() {
    const itens = $$('[data-reveal]');
    const irmaos = new Map();
    for (const el of itens) {
      const pai = el.parentElement;
      const n = irmaos.get(pai) ?? 0;
      el.style.setProperty('--ordem', String(n));
      irmaos.set(pai, n + 1);
    }
    // Pelo laço de rolagem (e não por IntersectionObserver): o que já passou da linha aparece.
    let faltam = itens;
    const conferir = () => {
      if (!faltam.length) return;
      const linha = innerHeight * 0.92;
      faltam = faltam.filter((el) => {
        if (el.getBoundingClientRect().top > linha) return true;
        el.classList.add('dentro');
        return false;
      });
    };
    aoRolar.push(conferir);
    conferir();
  }

  /* ---------- Capa: as tábuas caem na pasta ---------- */
  function cena() {
    const palco = $('.scene');
    if (!palco) return;
    const tocar = () => {
      palco.classList.remove('cai');
      void palco.getBoundingClientRect(); // reinicia as animações
      palco.classList.add('cai');
    };
    tocar();
    palco.addEventListener('click', tocar);

    // Paralaxe leve: zigurate e palmeiras seguem o ponteiro.
    const camadas = $$('[data-depth]', palco);
    const hero = palco.closest('.hero');
    hero.addEventListener('pointermove', (ev) => {
      if (calmo.matches || ev.pointerType === 'touch') return;
      const r = hero.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width - 0.5;
      const y = (ev.clientY - r.top) / r.height - 0.5;
      for (const c of camadas) {
        const d = Number(c.dataset.depth);
        c.style.transform = `translate(${-x * d}px, ${-y * d * 0.5}px)`;
      }
    });
    hero.addEventListener('pointerleave', () => camadas.forEach((c) => (c.style.transform = '')));
  }

  /* ---------- Friso: um selo cilíndrico rola e deixa a impressão ---------- */
  const cunhaH = (x, y, s) =>
    `<path d="M${x} ${y}l${4 * s} ${2 * s} ${7 * s} ${0.5 * s} ${-7 * s} ${0.5 * s} ${-4 * s} ${2 * s}z"/>`;
  const cunhaV = (x, y, s) =>
    `<path d="M${x} ${y}h${5 * s}l${-2 * s} ${4 * s} ${-0.5 * s} ${7 * s} ${-0.5 * s} ${-7 * s}z"/>`;
  const rosa = (cx, cy, r) => {
    let s = '';
    for (let i = 0; i < 8; i++) {
      s += `<ellipse cx="${cx}" cy="${cy - r * 0.52}" rx="${r * 0.2}" ry="${r * 0.42}" transform="rotate(${i * 45} ${cx} ${cy})"/>`;
    }
    return s + `<circle cx="${cx}" cy="${cy}" r="${r * 0.2}" fill="var(--friso-fundo)"/>`;
  };
  const estrela = (cx, cy, r) => {
    const p = [];
    for (let i = 0; i < 16; i++) {
      const a = (Math.PI / 8) * i - Math.PI / 2;
      const rr = i % 2 ? r * 0.42 : r;
      p.push(`${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`);
    }
    return `<path d="M${p.join('L')}z"/>`;
  };
  const agua = (y, largura) => {
    let d = `M0 ${y + 5}`;
    for (let x = 0; x < largura; x += 12) d += `l6 -4 6 4`;
    return `<path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>`;
  };
  // Um ladrilho de 120 de largura: roseta, cunhas, estrela e tamareira estilizada.
  const LADRILHO = 120;
  const ladrilho = (h) => {
    const c = h / 2;
    const k = h / 56;
    return [
      rosa(20, c, 13 * k),
      cunhaH(40, c - 11 * k, 1.5 * k),
      cunhaH(40, c - 1.5 * k, 1.5 * k),
      cunhaH(40, c + 8 * k, 1.5 * k),
      cunhaV(62, c - 9 * k, 1.3 * k),
      cunhaV(71, c - 9 * k, 1.3 * k),
      estrela(96, c, 11 * k),
    ].join('');
  };

  function frisos() {
    const todos = $$('.friso');
    if (!todos.length) return;
    let id = 0;
    const montar = (el) => {
      const w = Math.round(el.clientWidth);
      const h = Math.round(el.clientHeight);
      if (!w || !h) return;
      const n = ++id;
      const faixaH = h - 12;
      const y0 = 6;
      el.innerHTML = `
        <svg viewBox="0 0 ${w} ${h}" xmlns="${NS}" focusable="false">
          <defs>
            <pattern id="fr-lad-${n}" width="${LADRILHO}" height="${faixaH}" patternUnits="userSpaceOnUse" y="${y0}">
              <g fill="currentColor">${ladrilho(faixaH)}</g>
            </pattern>
            <clipPath id="fr-clip-${n}"><rect class="revela" x="0" y="0" width="0" height="${h}"/></clipPath>
            <linearGradient id="fr-cil-${n}" x1="0" x2="1">
              <stop offset="0" stop-color="#8e6a45"/><stop offset=".35" stop-color="#d8b894"/>
              <stop offset=".6" stop-color="#c99d6e"/><stop offset="1" stop-color="#6e4b2c"/>
            </linearGradient>
            <clipPath id="fr-corpo-${n}"><rect x="0" y="-4" width="30" height="${h + 8}" rx="6"/></clipPath>
          </defs>
          <rect class="faixa" x="0" y="${y0}" width="${w}" height="${faixaH}" rx="${faixaH / 2.4}"/>
          <g clip-path="url(#fr-clip-${n})">
            <g class="motivo relevo">
              <rect x="0" y="${y0}" width="${w}" height="${faixaH}" fill="url(#fr-lad-${n})"/>
              <g transform="translate(0 ${y0 - 2})">${agua(0, w)}</g>
              <g transform="translate(0 ${y0 + faixaH - 8})">${agua(0, w)}</g>
            </g>
          </g>
          <g class="cilindro">
            <g clip-path="url(#fr-corpo-${n})">
              <rect x="0" y="-4" width="30" height="${h + 8}" fill="url(#fr-cil-${n})"/>
              <g class="giro" fill="#6e4b2c" opacity=".45"></g>
            </g>
            <ellipse cx="15" cy="-4" rx="15" ry="4" fill="#ead7bf"/>
            <ellipse cx="15" cy="-4" rx="3" ry="1.2" fill="#6e4b2c"/>
          </g>
        </svg>`;
      el._fr = { w, revela: $('.revela', el), cil: $('.cilindro', el), giro: $('.giro', el), h };
      atualizar(el);
    };
    const atualizar = (el) => {
      const f = el._fr;
      if (!f) return;
      let p = 1;
      if (!calmo.matches) {
        const r = el.getBoundingClientRect();
        const vh = innerHeight;
        p = limita((vh - r.top - 30) / (vh * 0.5), 0, 1);
        // No fim da página o friso de baixo não sobe o bastante: termina de rolar ali.
        if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4 && r.top < vh) p = 1;
      }
      const x = p * f.w;
      f.revela.setAttribute('width', String(x));
      f.cil.setAttribute('transform', `translate(${limita(x - 15, -15, f.w - 15)} 0)`);
      f.cil.style.opacity = p >= 1 || calmo.matches ? '0' : '1';
      // Marcas na superfície do cilindro correm ao contrário: parece que ele gira.
      const off = -(x % 10);
      let marcas = '';
      for (let i = -1; i < 5; i++) {
        const mx = off + i * 10;
        marcas += `<rect x="${mx.toFixed(1)}" y="0" width="2" height="${f.h}" rx="1"/>`;
      }
      f.giro.innerHTML = marcas;
    };
    todos.forEach(montar);
    aoRolar.push(() => todos.forEach(atualizar));
    let espera;
    addEventListener('resize', () => {
      clearTimeout(espera);
      espera = setTimeout(() => todos.forEach(montar), 150);
    });
  }

  /* ---------- Demonstração: escreva na tábua e guarde no arquivo ---------- */
  function demo() {
    const form = $('#demo-form');
    if (!form) return;
    const nome = $('#demo-nome');
    const tabua = $('#demo-tabua');
    const dica = $('#demo-dica');
    const arvore = $('#arvore');
    const aviso = $('#demo-aviso');
    const campo = (n) => form.elements.namedItem(n);

    const arquivo = [
      { nome: 'Atlas', itens: 1, subs: [{ nome: 'Design', itens: 3 }, { nome: 'Pesquisa', itens: 2 }] },
      { nome: 'Estudos', itens: 4, subs: [] },
      { nome: 'Orbita', itens: 0, subs: [{ nome: 'Vendas', itens: 3 }] },
    ];
    let soltos = 2;
    const ordena = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR');

    const limpa = (v) =>
      v
        .replace(/\s*\/\s*/g, ' ')
        .replace(/#/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    const ler = () => {
      const p = limpa(campo('p').value);
      const s = p ? limpa(campo('s').value) : '';
      const t = limpa(campo('t').value);
      const g = limpa(campo('g').value).replace(/ /g, '-');
      return { p, s, t, g, subSemProjeto: !p && limpa(campo('s').value) !== '' };
    };

    const span = (cls, txt) => {
      const el = document.createElement('span');
      el.className = cls;
      el.textContent = txt;
      return el;
    };
    function escrever(comEstilete) {
      const v = ler();
      nome.replaceChildren();
      if (v.p) nome.append(span('seg-p', v.p), span('sep', ' / '));
      if (v.s) nome.append(span('seg-s', v.s), span('sep', ' / '));
      nome.append(span('seg-t', v.t || 'Sem título'));
      if (v.g) nome.append(span('seg-g', '#' + v.g));
      const fim = span('fim', '');
      nome.append(fim);
      dica.textContent = v.subSemProjeto
        ? 'Subpasta só vale dentro de um projeto.'
        : v.p
          ? `Vai para ${v.p}${v.s ? ' › ' + v.s : ''}.`
          : 'Sem projeto, o item fica em "Sem pasta".';
      if (comEstilete && !calmo.matches) {
        const e = document.createElement('span');
        e.className = 'estilete';
        e.style.left = fim.offsetLeft + 4 + 'px';
        e.style.top = fim.offsetTop + 10 + 'px';
        tabua.append(e);
        e.addEventListener('animationend', () => e.remove());
      }
    }

    function desenhar(novas = new Set(), pulsa = new Set()) {
      const linhas = [];
      const linha = (chave, texto, conta, cls) => {
        const li = document.createElement('li');
        li.dataset.chave = chave;
        li.className = cls;
        if (novas.has(chave)) li.classList.add('nova');
        if (pulsa.has(chave)) li.classList.add('pulsa');
        li.append(span('pasta', ''), document.createTextNode(texto), span('conta', String(conta)));
        linhas.push(li);
      };
      for (const pr of [...arquivo].sort(ordena)) {
        const total = pr.itens + pr.subs.reduce((n, s) => n + s.itens, 0);
        linha('p:' + pr.nome, pr.nome, total, '');
        for (const s of [...pr.subs].sort(ordena)) linha(`s:${pr.nome}/${s.nome}`, s.nome, s.itens, 'sub');
      }
      linha('solto', 'Sem pasta', soltos, 'solto');
      arvore.replaceChildren(...linhas);
    }

    const acha = (lista, n) => lista.find((x) => x.nome.toLocaleLowerCase('pt-BR') === n.toLocaleLowerCase('pt-BR'));

    function guardar(ev) {
      ev.preventDefault();
      const v = ler();
      if (!v.t) {
        dica.textContent = 'Toda tábua precisa de um título.';
        campo('t').focus();
        return;
      }
      // Cria as pastas que ainda não existem (aparecem vazias e recebem a tábua).
      const novas = new Set();
      let alvo = 'solto';
      let pr = null;
      let sub = null;
      if (v.p) {
        pr = acha(arquivo, v.p);
        if (!pr) {
          pr = { nome: v.p, itens: 0, subs: [] };
          arquivo.push(pr);
          novas.add('p:' + pr.nome);
        }
        alvo = 'p:' + pr.nome;
        if (v.s) {
          sub = acha(pr.subs, v.s);
          if (!sub) {
            sub = { nome: v.s, itens: 0 };
            pr.subs.push(sub);
            novas.add(`s:${pr.nome}/${sub.nome}`);
          }
          alvo = `s:${pr.nome}/${sub.nome}`;
        }
      }
      desenhar(novas);

      const aplicar = () => {
        if (sub) sub.itens++;
        else if (pr) pr.itens++;
        else soltos++;
        const pulsa = new Set([alvo]);
        if (pr) pulsa.add('p:' + pr.nome);
        desenhar(new Set(), pulsa);
        setTimeout(() => $$('.pulsa', arvore).forEach((li) => li.classList.remove('pulsa')), 900);
        aviso.textContent = `Guardado em ${pr ? pr.nome + (sub ? ' › ' + sub.nome : '') : 'Sem pasta'}.`;
      };

      const destino = $(`[data-chave="${CSS.escape(alvo)}"]`, arvore);
      if (calmo.matches || !destino || !Element.prototype.animate) {
        aplicar();
        return;
      }
      // No celular a árvore fica abaixo da tábua: rola até ela antes do voo, para ver o pouso.
      const r = destino.getBoundingClientRect();
      if (r.top < 60 || r.bottom > innerHeight - 20) {
        destino.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setTimeout(() => voar(destino, aplicar), 480);
      } else {
        voar(destino, aplicar);
      }
    }

    function voar(destino, depois) {
      tabua.classList.remove('bate');
      void tabua.offsetWidth;
      tabua.classList.add('bate');
      const a = tabua.getBoundingClientRect();
      const b = destino.getBoundingClientRect();
      const bloco = document.createElement('div');
      bloco.className = 'voando';
      bloco.textContent = nome.textContent;
      bloco.style.opacity = '0';
      document.body.append(bloco);
      const bw = bloco.offsetWidth;
      const bh = bloco.offsetHeight;
      const x0 = a.left + a.width / 2 - bw / 2;
      const y0 = a.top + a.height / 2 - bh / 2;
      const x1 = b.left + 40 - bw / 2 + (bw * 0.35) / 2;
      const y1 = b.top + b.height / 2 - bh / 2;
      const xm = (x0 + x1) / 2;
      const ym = Math.min(y0, y1) - 90;
      const anim = bloco.animate(
        [
          { transform: `translate(${x0}px, ${y0}px) scale(1.25) rotate(-2deg)`, opacity: 0 },
          { transform: `translate(${x0}px, ${y0 - 12}px) scale(1.2) rotate(-4deg)`, opacity: 1, offset: 0.18 },
          { transform: `translate(${xm}px, ${ym}px) scale(0.9) rotate(8deg)`, opacity: 1, offset: 0.58 },
          { transform: `translate(${x1}px, ${y1}px) scale(0.35) rotate(0deg)`, opacity: 0.3 },
        ],
        // fill 'both': durante o atraso a tábua já fica no primeiro quadro (invisível), e não no canto da tela.
        { duration: 820, easing: 'cubic-bezier(.45,0,.35,1)', delay: 120, fill: 'both' },
      );
      anim.onfinish = () => {
        bloco.remove();
        depois();
      };
    }

    for (const b of $$('[data-preset]')) {
      b.addEventListener('click', () => {
        const [p, s, t, g] = b.dataset.preset.split('|');
        campo('p').value = p;
        campo('s').value = s;
        campo('t').value = t;
        campo('g').value = g;
        escrever(true);
      });
    }
    let ultimo = 0;
    form.addEventListener('input', () => {
      const agora = performance.now();
      escrever(agora - ultimo > 70);
      ultimo = agora;
    });
    form.addEventListener('submit', guardar);
    escrever(false);
    desenhar();
  }

  /* ---------- Números cuneiformes nas abas ---------- */
  function numeros() {
    for (const el of $$('.cnum')) {
      const n = Number(el.dataset.n);
      el.setAttribute('aria-hidden', 'true');
      let s = '';
      for (let i = 0; i < n; i++) {
        s += `<svg viewBox="0 0 5 11" xmlns="${NS}"><path d="M0 0h5l-2 4-.5 7-.5-7z" fill="currentColor"/></svg>`;
      }
      el.innerHTML = s;
      if (n === 4) el.style.width = '16px';
    }
  }

  /* ---------- Abas (teclado: setas, Home, End) ---------- */
  function abas() {
    for (const lista of $$('[role="tablist"]')) {
      const tabs = $$('[role="tab"]', lista);
      const escolher = (tab, foco) => {
        for (const t of tabs) {
          const sel = t === tab;
          t.setAttribute('aria-selected', String(sel));
          t.tabIndex = sel ? 0 : -1;
          const painel = document.getElementById(t.getAttribute('aria-controls'));
          painel.hidden = !sel;
          if (sel) {
            $$('li', painel).forEach((li, k) => li.style.setProperty('--k', String(k)));
            painel.classList.remove('entra');
            void painel.offsetWidth;
            painel.classList.add('entra');
          }
        }
        if (foco) tab.focus();
      };
      lista.addEventListener('click', (ev) => {
        const tab = ev.target.closest('[role="tab"]');
        if (tab) escolher(tab, false);
      });
      lista.addEventListener('keydown', (ev) => {
        const i = tabs.indexOf(document.activeElement);
        if (i < 0) return;
        const mapa = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
        let j = null;
        if (ev.key in mapa) j = (i + mapa[ev.key] + tabs.length) % tabs.length;
        if (ev.key === 'Home') j = 0;
        if (ev.key === 'End') j = tabs.length - 1;
        if (j === null) return;
        ev.preventDefault();
        escolher(tabs[j], true);
      });
    }
  }

  /* ---------- Tábuas que viram ---------- */
  function viradas() {
    for (const b of $$('.vira')) {
      b.addEventListener('click', () => {
        b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
      });
    }
  }

  /* ---------- Cesto de tokens: fichas de argila caem no cesto ---------- */
  // Na Mesopotâmia, antes da escrita, bens eram contados com fichas de argila:
  // esferas, cones, discos e cilindros. São os "tokens" do cesto.
  const CORES = ['#EAD7BF', '#D8B894', '#C99D6E'];
  const MARCA = '#8E6A45';
  function ficha(tipo, cor) {
    switch (tipo) {
      case 'esfera':
        return `<circle r="9" fill="${cor}"/><circle cx="-3" cy="-3" r="3" fill="#fff" opacity=".35"/>`;
      case 'cone':
        return `<path d="M0-11c3 0 10 14 10 17 0 3-20 3-20 0 0-3 7-17 10-17z" fill="${cor}"/><path d="M-3 0h6" stroke="${MARCA}" stroke-width="1.5" stroke-linecap="round"/>`;
      case 'disco':
        return `<ellipse rx="12" ry="7" fill="${cor}"/><path d="M-6-1l4 1 6 .3-6 .3-4 1z" fill="${MARCA}"/>`;
      default:
        return `<rect x="-6" y="-10" width="12" height="20" rx="5" fill="${cor}"/><path d="M-3-4h6M-3 1h6" stroke="${MARCA}" stroke-width="1.3" stroke-linecap="round"/>`;
    }
  }
  const TIPOS = ['esfera', 'cone', 'disco', 'cilindro'];
  const sorteia = (lista) => lista[Math.floor(Math.random() * lista.length)];
  // Altura do monte: mais alto no meio do cesto.
  const monte = (x) => 104 - 12 * Math.cos(((x - 160) / 120) * (Math.PI / 2));

  function cestos() {
    for (const palco of $$('[data-cesto]')) {
      palco.innerHTML = `
        <button class="cesto" type="button" aria-label="Jogar um token no cesto (animação)">
          <svg viewBox="0 0 320 290" aria-hidden="true" focusable="false">
            <ellipse cx="160" cy="272" rx="116" ry="10" class="cesto-sombra"/>
            <g class="cesto-corpo">
              <ellipse cx="160" cy="112" rx="126" ry="24" fill="#6E1F16"/>
              <g class="pilha"></g>
              <g class="caindo"></g>
              <path d="M34 112q126 34 252 0l-22 130q-4 20-24 20H80q-20 0-24-20z" fill="#B23A2B"/>
              <g fill="none" stroke="#8F2D21" stroke-width="3" stroke-linecap="round" opacity=".9">
                <path d="M40 150q120 30 240 0M46 186q114 26 228 0M52 222q108 22 216 0"/>
              </g>
              <g stroke="#6E1F16" stroke-width="2.5" opacity=".35" stroke-linecap="round">
                <path d="M80 124l6 132M120 130l3 132M160 132v132M200 130l-3 132M240 124l-6 132"/>
              </g>
              <path d="M34 112q126 34 252 0" fill="none" stroke="#6E1F16" stroke-width="12" stroke-linecap="round"/>
              <path d="M40 108q120 30 240 0" fill="none" stroke="#C44A3A" stroke-width="3" stroke-linecap="round" opacity=".7"/>
              <g transform="translate(222 150) rotate(8)">
                <path d="M4-14v10" stroke="#6E1F16" stroke-width="2"/>
                <rect x="-14" y="-6" width="36" height="28" rx="6" fill="#EAD7BF"/>
                <path d="M-8 1l3 1.5 5 .4-5 .4-3 1.5zM2 1l3 1.5 5 .4-5 .4-3 1.5zM-7 10h4l-1.5 3-.4 5-.4-5z" fill="#6E1F16"/>
              </g>
            </g>
          </svg>
        </button>
        <p class="cesto-dica" aria-hidden="true">Toque no cesto</p>`;
      const botao = $('.cesto', palco);
      const pilha = $('.pilha', palco);
      const caindo = $('.caindo', palco);
      const corpo = $('.cesto-corpo', palco);

      const pousar = (g, x, y, r) => {
        g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r.toFixed(0)})`);
        pilha.append(g);
        // Guarda no máximo 26 fichas: a mais antiga some.
        const todas = pilha.children;
        if (todas.length > 26) todas[0].remove();
      };
      const nova = () => {
        const g = document.createElementNS(NS, 'g');
        g.innerHTML = ficha(sorteia(TIPOS), sorteia(CORES));
        return g;
      };
      // Monte inicial.
      for (let i = 0; i < 12; i++) {
        const x = 72 + i * 16 + (Math.random() * 8 - 4);
        pousar(nova(), x, monte(x) + Math.random() * 6, Math.random() * 60 - 30);
      }

      const jogar = (atraso = 0) => {
        const x = 90 + Math.random() * 140;
        const y = monte(x) - 4 - Math.min(pilha.children.length, 26) * 0.15;
        const r = Math.random() * 80 - 40;
        const g = nova();
        if (calmo.matches || !Element.prototype.animate) {
          pousar(g, x, y, r);
          return;
        }
        const interno = document.createElementNS(NS, 'g');
        interno.append(g);
        interno.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
        caindo.append(interno);
        g.style.transformBox = 'fill-box';
        g.style.transformOrigin = '50% 100%';
        // Cai acelerando, gira, achata ao bater e quica uma vez.
        const anim = g.animate(
          [
            { transform: `translateY(-150px) rotate(${r - 160}deg)`, easing: 'cubic-bezier(.55,0,.9,.45)' },
            { transform: `translateY(0) rotate(${r}deg)`, offset: 0.55, easing: 'ease-out' },
            { transform: `translateY(0) rotate(${r}deg) scale(1.25,.75)`, offset: 0.64, easing: 'ease-out' },
            { transform: `translateY(-14px) rotate(${r}deg) scale(.95,1.05)`, offset: 0.8, easing: 'ease-in' },
            { transform: `translateY(0) rotate(${r}deg)` },
          ],
          { duration: 820, delay: atraso, fill: 'backwards' },
        );
        // O cesto sente o peso: afunda um pouco e volta.
        setTimeout(() => {
          corpo.animate(
            [{ transform: 'none' }, { transform: 'translateY(3px) scale(1.01,.985)' }, { transform: 'none' }],
            { duration: 320, easing: 'ease-out' },
          );
        }, atraso + 450);
        anim.onfinish = () => {
          interno.remove();
          g.removeAttribute('style');
          pousar(g, x, y, r);
        };
      };
      botao.addEventListener('click', () => jogar());

      // Na primeira vez que o cesto aparece, caem três fichas sozinhas.
      let visto = false;
      const olhar = () => {
        if (visto) return;
        const rr = palco.getBoundingClientRect();
        if (rr.top < innerHeight * 0.8 && rr.bottom > 0) {
          visto = true;
          [150, 420, 700].forEach((t) => jogar(t));
        }
      };
      aoRolar.push(olhar);
      olhar();
    }
  }

  /* ---------- Topo: sombra ao rolar, progresso, menu do celular e seção atual ---------- */
  function topo() {
    const top = $('.top');
    if (!top) return;
    const barra = $('.progresso span', top);
    const botao = $('.menu-btn', top);
    const menu = $('#menu');

    const fechar = (focar) => {
      top.classList.remove('aberto');
      botao.setAttribute('aria-expanded', 'false');
      botao.setAttribute('aria-label', 'Abrir o menu');
      if (focar) botao.focus();
    };
    botao?.addEventListener('click', () => {
      const abrir = !top.classList.contains('aberto');
      top.classList.toggle('aberto', abrir);
      botao.setAttribute('aria-expanded', String(abrir));
      botao.setAttribute('aria-label', abrir ? 'Fechar o menu' : 'Abrir o menu');
      if (abrir) $('a', menu)?.focus();
    });
    menu?.addEventListener('click', (ev) => {
      if (ev.target.closest('a')) fechar(false);
    });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && top.classList.contains('aberto')) fechar(true);
    });
    document.addEventListener('click', (ev) => {
      if (top.classList.contains('aberto') && !top.contains(ev.target)) fechar(false);
    });

    // Links para seções desta página: o da seção visível fica marcado.
    const internos = $$('a[href^="#"]', menu).map((a) => [a, document.getElementById(a.getAttribute('href').slice(1))]);
    const secoes = $$('[data-nav]');

    const medir = () => {
      top.classList.toggle('rolou', scrollY > 8);
      const alto = document.documentElement.scrollHeight - innerHeight;
      barra?.style.setProperty('--p', alto > 0 ? String(limita(scrollY / alto, 0, 1)) : '0');
      if (internos.length && secoes.length) {
        const sec = secoes[atual(secoes)];
        for (const [a, alvo] of internos) {
          if (alvo && alvo === sec) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        }
      }
    };
    aoRolar.push(medir);
    medir();
  }

  /* ---------- Seção atual: o que está no terço de cima da tela ---------- */
  const atual = (alvos) => {
    const linha = innerHeight * 0.35;
    let i = 0;
    alvos.forEach((el, k) => {
      if (el.getBoundingClientRect().top <= linha) i = k;
    });
    // No fim da página, a última seção vale.
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) i = alvos.length - 1;
    return i;
  };

  /* ---------- Zigurate: navegação entre as seções da página inicial ---------- */
  function zigurate() {
    const secoes = $$('[data-nav]');
    if (secoes.length < 3) return;
    const nav = document.createElement('nav');
    nav.className = 'zig';
    nav.setAttribute('aria-label', 'Seções da página');
    const ol = document.createElement('ol');
    const links = secoes.map((s, i) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + s.id;
      a.style.setProperty('--w', `${18 + i * 9}px`);
      a.append(span(s.dataset.nav));
      li.append(a);
      ol.append(li);
      return a;
    });
    nav.append(ol);
    document.body.append(nav);
    function span(txt) {
      const el = document.createElement('span');
      el.textContent = txt;
      return el;
    }
    const marcar = () => {
      const i = atual(secoes);
      links.forEach((a, k) => {
        a.classList.toggle('passou', k < i);
        if (k === i) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };
    aoRolar.push(marcar);
    marcar();
  }

  /* ---------- Índice lateral das páginas de texto ---------- */
  function indice() {
    const artigo = $('article.prose');
    if (!artigo) return;
    const titulos = $$('h2', artigo);
    if (titulos.length < 3) return;
    const slug = (t) =>
      t
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    const aside = document.createElement('nav');
    aside.className = 'indice';
    aside.setAttribute('aria-label', 'Nesta página');
    const rot = document.createElement('strong');
    rot.textContent = 'Nesta página';
    aside.append(rot);
    const links = titulos.map((h) => {
      if (!h.id) h.id = slug(h.textContent);
      const a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      aside.append(a);
      return a;
    });
    artigo.after(aside);
    artigo.parentElement.classList.add('com-indice');
    const marcar = () => {
      const i = atual(titulos);
      links.forEach((a, k) => (k === i ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    };
    aoRolar.push(marcar);
    marcar();
  }

  revelar();
  cena();
  numeros();
  abas();
  viradas();
  cestos();
  topo();
  demo();
  zigurate();
  indice();
  // O friso mede a largura: espera o layout (e as fontes) assentarem.
  (document.fonts?.ready ?? Promise.resolve()).then(frisos);
})();
