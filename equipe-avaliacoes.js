'use strict';
(() => {
  const $ = id => document.getElementById(id);
  let banco, filtro = 'pendentes', versao = 0;
  const texto = (tag, valor) => { const e = document.createElement(tag); e.textContent = valor; return e; };
  async function carregar() {
    if (!banco) return;
    const atual = ++versao; $('moderacao-status').textContent = 'Buscando avaliações…'; $('moderacao-lista').replaceChildren();
    for (const [id, estado] of [['ver-pendentes','pendentes'], ['ver-aprovadas','aprovadas'], ['ver-rejeitadas','rejeitadas']]) $(id).setAttribute('aria-pressed', String(filtro === estado));
    try {
      const { data, error } = await banco.from('avare_avaliacoes').select('id,artista_id,nome_exibicao,nota,comentario,criado_em,avare_artistas(nome_artistico)').eq('aprovado', filtro === 'aprovadas').eq('rejeitado', filtro === 'rejeitadas').order('enviado_em', { ascending: false }).limit(100);
      if (atual !== versao) return;
      if (error) throw error;
      $('moderacao-status').textContent = data?.length ? `${data.length} avaliação(ões) nesta lista (até 100 por vez).` : 'Nenhuma avaliação nesta lista.';
      for (const r of data || []) {
        const item = document.createElement('article'); item.className = 'review-item';
        item.append(texto('h3', r.avare_artistas?.nome_artistico || 'Artista'), texto('p', `${r.nome_exibicao} · Nota ${r.nota}/5`), texto('p', r.comentario));
        const acoes = document.createElement('div'); acoes.className = 'actions';
        function acao(rotulo, valores, pergunta) {
          const b = texto('button', rotulo); b.type = 'button'; b.className = 'secondary';
          b.addEventListener('click', async () => {
            if (!window.confirm(pergunta)) return;
            for (const botao of acoes.children) botao.disabled = true;
            try {
              const { data, error } = await banco.from('avare_avaliacoes').update(valores).eq('id', r.id).select('id').single();
              if (error || !data) throw error || new Error('Permissão insuficiente');
              if (atual === versao) await carregar();
            } catch { $('moderacao-status').textContent = 'Não foi possível alterar a publicação. Tente novamente.'; for (const botao of acoes.children) botao.disabled = false; }
          }); acoes.append(b);
        }
        if (filtro !== 'aprovadas') acao('Aprovar e publicar', { aprovado: true, rejeitado: false }, 'Publicar este nome, nota e comentário no perfil do artista?');
        if (filtro === 'aprovadas') acao('Retirar publicação', { aprovado: false, rejeitado: false }, 'Retirar esta avaliação do site e voltar para revisão?');
        if (filtro !== 'rejeitadas') acao('Não aprovar', { aprovado: false, rejeitado: true }, 'Manter esta avaliação fora do site?');
        item.append(acoes); $('moderacao-lista').append(item);
      }
    } catch { if (atual === versao) $('moderacao-status').textContent = 'A moderação está indisponível. Confira a conexão ou a ativação desta função com a coordenação.'; }
  }
  for (const [id, estado] of [['ver-pendentes','pendentes'], ['ver-aprovadas','aprovadas'], ['ver-rejeitadas','rejeitadas']]) $(id).addEventListener('click', () => { filtro = estado; carregar(); });
  document.addEventListener('equipepronta', event => { banco = event.detail.banco; carregar(); });
  document.addEventListener('equipesaiu', () => { versao++; banco = null; $('moderacao-lista').replaceChildren(); $('moderacao-status').textContent = ''; });
})();
