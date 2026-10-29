'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const normalizar = texto => String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  let artistas = [], selecionada = '', limite = 12, ultimoBotao;
  const padrao = ['Música', 'Artes visuais', 'Teatro', 'Dança', 'Literatura', 'Artesanato', 'Cultura popular'];
  const texto = (tag, valor, classe) => { const e = document.createElement(tag); e.textContent = valor; if (classe) e.className = classe; return e; };
  const urlSegura = valor => { try { const u = new URL(valor); return u.protocol === 'https:' && !u.username && !u.password ? u.href : null; } catch { return null; } };
  function capa(a, indice, classe) {
    const e = document.createElement('div'); e.className = classe; e.dataset.tone = indice % 4;
    const iniciais = texto('span', a.nome_artistico.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join(''), 'artist-initials');
    e.append(iniciais);
    const url = urlSegura(a.perfil?.foto_url);
    if (url) { const img = document.createElement('img'); img.src = url; img.alt = ''; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer'; img.addEventListener('load', () => { iniciais.hidden = true; }); img.addEventListener('error', () => { img.remove(); iniciais.hidden = false; }); e.append(img); }
    return e;
  }
  function tags(a, pai) { for (const nome of a.areas_atuacao || []) pai.append(texto('span', nome, 'tag')); }
  function categorias() {
    const nomes = [...new Set([...padrao, ...artistas.flatMap(a => a.areas_atuacao || [])])];
    $('categorias').replaceChildren();
    for (const nome of ['', ...nomes]) {
      const b = texto('button', nome || 'Todas as áreas'); b.type = 'button'; b.setAttribute('aria-pressed', String(nome === selecionada));
      b.addEventListener('click', () => { selecionada = nome; limite = 12; categorias(); desenhar(); [...$('categorias').children].find(e => e.textContent === (nome || 'Todas as áreas'))?.focus(); });
      $('categorias').append(b);
    }
  }
  function abrirPerfil(a, indice, botao) {
    ultimoBotao = botao;
    const corpo = document.createElement('div'); corpo.className = 'profile-body';
    const p = a.perfil || {};
    corpo.append(texto('p', [p.cidade || 'Avaré', p.bairro].filter(Boolean).join(' · '), 'eyebrow'));
    const nome = texto('h2', a.nome_artistico); nome.id = 'perfil-nome'; corpo.append(nome);
    const areas = document.createElement('div'); tags(a, areas); corpo.append(areas);
    if (p.resumo) corpo.append(texto('p', p.resumo, 'profile-intro'));
    if (a.biografia) corpo.append(texto('h3', 'Sobre o artista'), texto('p', a.biografia, 'profile-bio'));
    if (p.trabalhos) corpo.append(texto('h3', 'Trabalhos e trajetória'), texto('p', p.trabalhos, 'profile-bio'));
    const links = document.createElement('div'); links.className = 'profile-links';
    function link(nome, href) { const e = texto('a', nome); const seta = document.createElement('span'); seta.className = 'arrow'; seta.setAttribute('aria-hidden', 'true'); e.append(' ', seta); e.href = href; e.target = '_blank'; e.rel = 'noopener noreferrer'; links.append(e); }
    for (const [rotulo, campo] of [['Instagram', 'instagram'], ['Site', 'site'], ['Portfólio', 'portfolio_url']]) { const url = urlSegura(p[campo]); if (url) link(rotulo, url); }
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.contato_email || '')) link('E-mail', 'mailto:' + encodeURIComponent(p.contato_email));
    if (/^\d{10,15}$/.test(p.whatsapp || '')) link('WhatsApp', 'https://wa.me/' + p.whatsapp);
    if (links.children.length) corpo.append(texto('h3', 'Conecte-se'), links);
    if (a.id) { const reviews = document.createElement('section'); reviews.id = 'avaliacoes-perfil'; corpo.append(reviews); }
    $('perfil-conteudo').replaceChildren(capa(a, indice, 'profile-cover'), corpo);
    if (!$('perfil-dialog').open) $('perfil-dialog').showModal();
    document.body.style.overflow = 'hidden';
    if (a.id) {
      const url = new URL(location.href); url.searchParams.set('artista', a.id); history.replaceState(null, '', url);
      document.dispatchEvent(new CustomEvent('perfilaberto', { detail: { id: a.id, nome: a.nome_artistico } }));
    }
  }
  function desenhar() {
    const termo = normalizar($('busca').value.trim());
    const filtrados = artistas.filter(a => (!selecionada || (a.areas_atuacao || []).includes(selecionada)) && normalizar(`${a.nome_artistico} ${(a.areas_atuacao || []).join(' ')} ${a.perfil?.bairro || ''} ${a.perfil?.resumo || ''}`).includes(termo));
    filtrados.sort((a, b) => a.nome_artistico.localeCompare(b.nome_artistico, 'pt-BR') * ($('ordenar').value === 'za' ? -1 : 1));
    $('artistas').replaceChildren(); $('estado-vazio').hidden = artistas.length > 0; $('sem-resultados').hidden = !artistas.length || filtrados.length > 0;
    $('mensagem').textContent = artistas.length ? `${filtrados.length} artista${filtrados.length !== 1 ? 's' : ''} para descobrir` : 'Novas histórias chegam em breve';
    for (const [indice, a] of filtrados.slice(0, limite).entries()) {
      const card = document.createElement('article'); card.className = 'artist-card';
      const corpo = document.createElement('div'); corpo.className = 'artist-card-body';
      const areas = document.createElement('div'); tags({ areas_atuacao: a.areas_atuacao?.slice(0, 2) }, areas);
      corpo.append(areas, texto('h3', a.nome_artistico), texto('p', a.perfil?.resumo || a.biografia || 'Conheça a trajetória e o trabalho deste artista.', 'artist-summary'), texto('p', [a.perfil?.cidade || 'Avaré', a.perfil?.bairro].filter(Boolean).join(' · '), 'artist-location'));
      const b = texto('button', 'Conhecer artista'); const seta = document.createElement('span'); seta.className = 'arrow'; seta.setAttribute('aria-hidden', 'true'); b.append(seta); b.type = 'button'; b.setAttribute('aria-label', `Conhecer ${a.nome_artistico}`); b.addEventListener('click', () => abrirPerfil(a, indice, b));
      corpo.append(b); card.append(capa(a, indice, 'artist-cover'), corpo); $('artistas').append(card);
    }
    $('mais').hidden = filtrados.length <= limite;
  }
  async function carregar() {
    $('tentar').hidden = true; $('busca').disabled = true; $('mensagem').classList.remove('error'); $('mensagem').textContent = 'Buscando talentos…';
    $('estado-vazio').hidden = true; $('sem-resultados').hidden = true; $('mais').hidden = true;
    try {
      if (!window.supabase || !window.MAPA_CONFIG) throw new Error('Biblioteca indisponível');
      const banco = window.mapaBanco();
      let r = await banco.from(window.MAPA_CONFIG.table).select('id,nome_artistico,biografia,areas_atuacao,perfil').eq('publicado', true).order('nome_artistico');
      // A versão anterior do banco continua funcionando durante a atualização.
      if (r.error && ['42703', 'PGRST204', '42501'].includes(r.error.code)) r = await banco.from(window.MAPA_CONFIG.table).select('nome_artistico,biografia,areas_atuacao').eq('publicado', true).order('nome_artistico');
      if (r.error && ['PGRST205', '42P01'].includes(r.error.code)) r = await banco.from('artistas_publicos').select('nome_artistico,biografia,areas_atuacao');
      if (r.error) throw r.error;
      artistas = r.data || []; $('busca').disabled = false; categorias(); desenhar();
      const id = new URL(location.href).searchParams.get('artista'); const escolhido = artistas.find(a => a.id === id);
      if (escolhido) abrirPerfil(escolhido, artistas.indexOf(escolhido));
    } catch {
      $('artistas').replaceChildren(); $('mensagem').classList.add('error'); $('mensagem').textContent = 'Não foi possível carregar o catálogo. Verifique a conexão e tente novamente.'; $('tentar').hidden = false;
    }
  }
  $('busca').addEventListener('input', () => { limite = 12; desenhar(); }); $('ordenar').addEventListener('change', desenhar);
  $('limpar-busca').addEventListener('click', () => { $('busca').value = ''; selecionada = ''; limite = 12; categorias(); desenhar(); $('busca').focus(); });
  $('mais').addEventListener('click', () => { limite += 12; desenhar(); }); $('tentar').addEventListener('click', carregar);
  $('fechar-perfil').addEventListener('click', () => $('perfil-dialog').close());
  $('perfil-dialog').addEventListener('click', e => { if (e.target === $('perfil-dialog') && (e.clientX < e.target.getBoundingClientRect().left || e.clientX > e.target.getBoundingClientRect().right || e.clientY < e.target.getBoundingClientRect().top || e.clientY > e.target.getBoundingClientRect().bottom)) e.target.close(); });
  $('perfil-dialog').addEventListener('close', () => { document.body.style.overflow = ''; const url = new URL(location.href); url.searchParams.delete('artista'); history.replaceState(null, '', url); ultimoBotao?.focus(); });
  carregar();
})();
