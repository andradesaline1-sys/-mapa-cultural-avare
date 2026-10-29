'use strict';
(() => {
  const area = document.getElementById('artistas');
  const mensagem = document.getElementById('mensagem');
  const busca = document.getElementById('busca');
  const tentar = document.getElementById('tentar');
  let artistas = [];
  const normalizar = texto => String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function desenhar() {
    const termo = normalizar(busca.value.trim());
    const filtrados = artistas.filter(a => normalizar(`${a.nome_artistico} ${(a.areas_atuacao || []).join(' ')}`).includes(termo));
    area.replaceChildren();
    mensagem.textContent = artistas.length === 0
      ? 'O catálogo está sendo preparado. Em breve, conheça os artistas da nossa cidade.'
      : filtrados.length === 0 ? 'Nenhum artista encontrado. Tente outro nome ou área cultural.'
      : `${filtrados.length} artista(s) encontrado(s).`;
    for (const artista of filtrados) {
      const card = document.createElement('article'); card.className = 'card';
      const titulo = document.createElement('h2'); titulo.textContent = artista.nome_artistico;
      const bio = document.createElement('p'); bio.textContent = artista.biografia || '';
      card.append(titulo, bio);
      for (const nome of artista.areas_atuacao || []) {
        const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = nome; card.appendChild(tag);
      }
      area.appendChild(card);
    }
  }
  async function carregar() {
    tentar.hidden = true; busca.disabled = true; mensagem.classList.remove('error'); mensagem.textContent = 'Carregando catálogo…';
    try {
      if (!window.supabase || !window.MAPA_CONFIG) throw new Error('Biblioteca indisponível');
      const c = window.MAPA_CONFIG;
      const banco = window.supabase.createClient(c.url, c.publicKey, { auth: { persistSession: false, detectSessionInUrl: false } });
      let resultado = await banco.from(c.table).select('nome_artistico,biografia,areas_atuacao').eq('publicado', true).order('nome_artistico');
      // Preserva o catálogo anterior enquanto a área da equipe não foi ativada.
      if (resultado.error && ['PGRST205', '42P01'].includes(resultado.error.code)) resultado = await banco.from('artistas_publicos').select('nome_artistico,biografia,areas_atuacao');
      if (resultado.error) throw resultado.error;
      artistas = resultado.data || []; busca.disabled = false; desenhar();
    } catch {
      area.replaceChildren(); mensagem.classList.add('error');
      mensagem.textContent = 'Não foi possível carregar o catálogo. Verifique sua conexão e tente novamente.'; tentar.hidden = false;
    }
  }
  busca.addEventListener('input', desenhar); tentar.addEventListener('click', carregar); carregar();
})();
