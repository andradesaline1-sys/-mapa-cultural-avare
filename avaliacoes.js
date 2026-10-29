'use strict';
(() => {
  let banco, perfil, versao = 0;
  const $ = id => document.getElementById(id);
  const elemento = (tag, texto, classe) => { const e = document.createElement(tag); e.textContent = texto; if (classe) e.className = classe; return e; };
  const avisar = (mensagem, erro = false) => { if ($('avaliacao-status')) { $('avaliacao-status').textContent = mensagem; $('avaliacao-status').classList.toggle('error', erro); } };
  async function sessaoFormulario() {
    const atual = versao;
    const { data, error } = await banco.auth.getSession();
    if (atual !== versao || !$('avaliacao-login')) return;
    if (error) { avisar('Não foi possível verificar o acesso. Tente novamente.', true); return; }
    const user = data.session?.user;
    $('avaliacao-login').hidden = !!user; $('form-avaliacao').hidden = !user; $('avaliacao-conta').hidden = !user;
    if (user) $('avaliacao-identidade').textContent = `Você está usando ${user.email}. Seu e-mail não será publicado.`;
  }
  async function carregar() {
    const atual = versao;
    $('avaliacoes-lista').replaceChildren();
    try {
      const [resposta, notas] = await Promise.all([
        banco.from('avare_avaliacoes_publicas').select('nome_exibicao,nota,comentario,criado_em').eq('artista_id', perfil.id).order('criado_em', { ascending: false }).limit(50),
        banco.from('avare_notas_publicas').select('total,media').eq('artista_id', perfil.id).maybeSingle()
      ]);
      const { data, error } = resposta;
      if (atual !== versao) return;
      if (error) throw error;
      const registros = data || [];
      $('avaliacoes-resumo').textContent = registros.length ? (notas.data ? `${Number(notas.data.media).toLocaleString('pt-BR')} de 5 · ${notas.data.total} avaliação(ões). Mostrando os comentários mais recentes, aprovados pela equipe.` : 'Comentários aprovados pela equipe') : 'Ainda não há avaliações publicadas. Você pode ser a primeira pessoa a compartilhar uma experiência.';
      for (const r of registros) {
        const item = document.createElement('article'); item.className = 'review-item';
        const nota = elemento('span', '★'.repeat(r.nota) + '☆'.repeat(5 - r.nota), 'review-stars'); nota.setAttribute('aria-label', `Nota ${r.nota} de 5`);
        item.append(elemento('h4', r.nome_exibicao), nota, elemento('p', r.comentario));
        const d = new Date(r.criado_em); if (!isNaN(d)) item.append(elemento('small', d.toLocaleDateString('pt-BR', {timeZone:'America/Sao_Paulo'})));
        $('avaliacoes-lista').append(item);
      }
      $('avaliacao-area').hidden = false;
      await sessaoFormulario();
    } catch {
      if (atual !== versao) return;
      $('avaliacoes-resumo').textContent = 'As avaliações estão indisponíveis no momento. Tente abrir este perfil novamente mais tarde.';
      $('avaliacao-area').hidden = true;
    }
  }
  document.addEventListener('perfilaberto', event => {
    perfil = event.detail; versao++;
    const secao = $('avaliacoes-perfil'); if (!secao) return;
    secao.className = 'reviews-section';
    secao.innerHTML = `<h3>A arte também se faz de encontros.</h3><p id="avaliacoes-resumo" class="hint" role="status">Carregando avaliações…</p><div id="avaliacoes-lista"></div>
      <div id="avaliacao-area" hidden><h4>Conte como foi sua experiência</h4><p class="hint">Avaliações são públicas e passam pela aprovação da equipe. Cada pessoa pode avaliar uma vez por artista; um novo envio substitui o anterior e volta para revisão.</p>
      <p id="avaliacao-status" role="status" class="hint"></p>
      <form id="avaliacao-login" hidden><label for="avaliacao-email">Confirme seu e-mail para participar</label><input id="avaliacao-email" type="email" autocomplete="email" required maxlength="254" placeholder="seu@email.com"><p class="hint">Enviaremos um link de acesso. O e-mail será usado para autenticação e não aparecerá no comentário. Isso não dá acesso à edição do catálogo.</p><button type="submit">Receber link de acesso</button></form>
      <div id="avaliacao-conta" hidden><p id="avaliacao-identidade" class="hint"></p><button id="avaliacao-sair" class="secondary" type="button">Usar outro e-mail / sair</button></div>
      <form id="form-avaliacao" hidden><label for="avaliacao-nome">Como seu nome deve aparecer?</label><input id="avaliacao-nome" minlength="2" maxlength="80" required autocomplete="nickname"><label for="avaliacao-nota">Sua avaliação</label><select id="avaliacao-nota" required><option value="">Escolha uma nota</option><option value="5">5 — Excelente</option><option value="4">4 — Muito bom</option><option value="3">3 — Bom</option><option value="2">2 — Regular</option><option value="1">1 — Ruim</option></select><label for="avaliacao-comentario">Seu comentário</label><textarea id="avaliacao-comentario" minlength="10" maxlength="2000" required placeholder="Compartilhe uma experiência com o trabalho deste artista. Não inclua dados pessoais de outras pessoas."></textarea><label class="hint"><input id="avaliacao-consentimento" type="checkbox" required> Autorizo a publicação deste nome, nota e comentário no catálogo.</label><button type="submit">Enviar para aprovação</button></form></div>`;
    banco = window.mapaBanco();
    $('avaliacao-login').addEventListener('submit', async e => {
      e.preventDefault(); const botao = e.currentTarget.querySelector('button'); botao.disabled = true; const atual = versao;
      try {
        const redirect = new URL('index.html', location.href); redirect.searchParams.set('artista', perfil.id);
        const { error } = await banco.auth.signInWithOtp({ email: $('avaliacao-email').value.trim(), options: { emailRedirectTo: redirect.href, shouldCreateUser: true } });
        if (error) throw error;
        if (atual === versao) avisar('Confira seu e-mail e abra o link de acesso. Se não chegar, veja a pasta de spam ou tente novamente mais tarde.');
      } catch { if (atual === versao) avisar('Não foi possível enviar o link. Tente novamente mais tarde.', true); }
      finally { botao.disabled = false; }
    });
    $('avaliacao-sair').addEventListener('click', async e => {
      e.currentTarget.disabled = true;
      try { const { error } = await banco.auth.signOut(); if (error) throw error; if ($('form-avaliacao')) { $('form-avaliacao').reset(); await sessaoFormulario(); } }
      catch { avisar('Não foi possível sair. Tente novamente.', true); }
      finally { if ($('avaliacao-sair')) $('avaliacao-sair').disabled = false; }
    });
    $('form-avaliacao').addEventListener('submit', async e => {
      e.preventDefault(); const botao = e.currentTarget.querySelector('button'); botao.disabled = true; const atual = versao;
      try {
        const { error } = await banco.rpc('avare_enviar_avaliacao', { p_artista: perfil.id, p_nome: $('avaliacao-nome').value.trim(), p_nota: Number($('avaliacao-nota').value), p_comentario: $('avaliacao-comentario').value.trim() });
        if (error) throw error;
        if (atual === versao) { $('form-avaliacao').reset(); avisar('Obrigada por participar! Sua avaliação foi enviada e aguarda aprovação da equipe.'); }
      } catch (error) {
        const texto = error?.message?.includes('Aguarde') ? 'Aguarde a revisão das avaliações anteriores ou tente novamente em um minuto.' : 'Não foi possível enviar. Confira os campos e se seu e-mail está confirmado e tente novamente.';
        if (atual === versao) avisar(texto, true);
      } finally { botao.disabled = false; }
    });
    carregar();
  });
  if (window.supabase && window.MAPA_CONFIG) {
    banco = window.mapaBanco(); banco.auth.onAuthStateChange(() => { if ($('form-avaliacao')) setTimeout(() => sessaoFormulario(), 0); });
  }
})();
