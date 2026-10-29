'use strict';
(() => {
  const $ = id => document.getElementById(id);
  if (!$('painel-artistas')) return;
  const movimentoReduzido = matchMedia('(prefers-reduced-motion: reduce)');
  let fila = [], indice = 0, visivel = null, notas = new Map(), estadoNotas = 'carregando';
  let pausado = movimentoReduzido.matches, sobre = false, focado = false, timer, versao = 0, pedidoFoto = 0;
  const urlSegura = valor => { try { const u = new URL(valor); return u.protocol === 'https:' && !u.username && !u.password ? u.href : null; } catch { return null; } };
  function embaralhar(lista) {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copia[i], copia[j]] = [copia[j], copia[i]]; }
    return copia;
  }
  function controles() {
    const unico = fila.length < 2;
    $('painel-anterior').disabled = unico; $('painel-proximo').disabled = unico; $('painel-pausar').disabled = unico;
    $('painel-pausar').textContent = pausado ? 'Continuar' : 'Pausar'; $('painel-pausar').setAttribute('aria-pressed', String(pausado));
  }
  function agendar() {
    clearInterval(timer); controles();
    if (fila.length > 1 && !pausado && !sobre && !focado && !document.hidden) timer = setInterval(() => { if (!$('perfil-dialog')?.open) avancar(1); }, 6000);
  }
  function avaliacao() {
    if (!visivel) return;
    const r = notas.get(visivel.id); const media = Number(r?.media), total = Number(r?.total);
    $('painel-estrelas').replaceChildren();
    if (estadoNotas === 'pronto' && Number.isFinite(media) && media >= 1 && media <= 5 && total > 0) {
      const estrelas = document.createElement('span'); estrelas.className = 'rating-stars'; estrelas.setAttribute('aria-label', `${media.toLocaleString('pt-BR')} de 5 estrelas`);
      const preenchidas = document.createElement('span'); preenchidas.className = 'rating-stars-fill'; preenchidas.style.width = `${media / 5 * 100}%`; estrelas.append(preenchidas); $('painel-estrelas').append(estrelas);
      $('painel-nota').textContent = `${media.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} de 5 · ${total} ${total === 1 ? 'avaliação aprovada' : 'avaliações aprovadas'}`;
    } else $('painel-nota').textContent = estadoNotas === 'carregando' ? 'Carregando avaliações…' : estadoNotas === 'erro' ? 'Avaliações indisponíveis no momento.' : 'Ainda sem avaliações aprovadas.';
  }
  function vazio(mensagem) {
    visivel = null; $('painel-conteudo').hidden = true; $('painel-vazio').hidden = false; $('painel-vazio').textContent = mensagem;
    $('painel-foto').removeAttribute('src'); fila = []; agendar();
  }
  function mostrar(posicao) {
    if (!fila.length) { vazio('As fotos aparecerão aqui quando forem adicionadas aos perfis publicados.'); return; }
    indice = (posicao + fila.length) % fila.length;
    const artista = fila[indice], pedido = ++pedidoFoto;
    const imagem = new Image(); imagem.referrerPolicy = 'no-referrer';
    imagem.onload = () => {
      if (pedido !== pedidoFoto) return;
      visivel = artista; $('painel-foto').src = imagem.src; $('painel-foto').alt = `Foto de ${artista.nome_artistico}`;
      $('painel-nome').textContent = artista.nome_artistico;
      $('painel-area').textContent = (artista.areas_atuacao || []).slice(0, 3).join(' · ');
      $('painel-resumo').textContent = artista.perfil?.resumo || '';
      $('painel-vazio').hidden = true; $('painel-conteudo').hidden = false; avaliacao(); controles();
    };
    imagem.onerror = () => { if (pedido !== pedidoFoto) return; fila.splice(indice, 1); mostrar(indice); agendar(); };
    imagem.src = urlSegura(artista.perfil.foto_url);
  }
  function avancar(direcao) {
    if (fila.length < 2) return;
    if (direcao > 0 && indice === fila.length - 1) {
      const anterior = fila[indice]; fila = embaralhar(fila);
      if (fila[0] === anterior) [fila[0], fila[1]] = [fila[1], fila[0]];
      mostrar(0);
    } else mostrar(indice + direcao);
  }
  document.addEventListener('catalogocarregado', async event => {
    const atual = ++versao; pedidoFoto++; clearInterval(timer);
    fila = embaralhar(event.detail.artistas.filter(a => a.id && urlSegura(a.perfil?.foto_url)));
    notas = new Map(); estadoNotas = 'carregando'; visivel = null;
    if (!fila.length) { vazio('As fotos dos artistas publicados aparecerão aqui.'); return; }
    mostrar(0); agendar();
    try {
      const { data, error } = await window.mapaBanco().from('avare_notas_publicas').select('artista_id,total,media');
      if (atual !== versao) return;
      if (error) throw error;
      notas = new Map((data || []).map(r => [r.artista_id, r])); estadoNotas = 'pronto';
    } catch { if (atual !== versao) return; estadoNotas = 'erro'; }
    avaliacao();
  });
  document.addEventListener('catalogofalhou', () => { versao++; pedidoFoto++; vazio('Não foi possível carregar as fotos. Tente carregar o catálogo novamente.'); });
  $('painel-proximo').addEventListener('click', () => { avancar(1); agendar(); });
  $('painel-anterior').addEventListener('click', () => { avancar(-1); agendar(); });
  $('painel-pausar').addEventListener('click', () => { pausado = !pausado; agendar(); });
  $('painel-artistas').addEventListener('mouseenter', () => { sobre = true; agendar(); });
  $('painel-artistas').addEventListener('mouseleave', () => { sobre = false; agendar(); });
  document.querySelector('.artist-showcase').addEventListener('focusin', () => { focado = true; agendar(); });
  document.querySelector('.artist-showcase').addEventListener('focusout', event => { if (!event.currentTarget.contains(event.relatedTarget)) { focado = false; agendar(); } });
  document.addEventListener('visibilitychange', agendar);
  movimentoReduzido.addEventListener('change', event => { pausado = event.matches; agendar(); });
  $('painel-perfil').addEventListener('click', () => { if (visivel) document.dispatchEvent(new CustomEvent('abrirartista', { detail: { id: visivel.id, botao: $('painel-perfil') } })); });
})();
