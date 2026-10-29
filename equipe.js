'use strict';
(() => {
  const $ = id => document.getElementById(id);
  let banco, usuario, registros = [], editando = null, carregamento = 0;
  let senhaPendente = /(?:[?#&])type=(?:recovery|invite)(?:&|$)/.test(location.hash);
  let ocupado = false;
  const normalizar = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const status = (texto, erro = false) => { $('status').textContent = texto; $('status').classList.toggle('error', erro); };
  const mensagemErro = e => ['PGRST205', '42P01'].includes(e?.code)
    ? 'A área da equipe ainda precisa ser ativada pela coordenação.'
    : 'Não foi possível concluir a operação. Verifique a conexão e suas permissões e tente novamente.';

  function limpar() {
    editando = null; $('form-artista').reset(); $('titulo-editor').textContent = 'Novo artista';
  }
  function mudou() {
    return editando !== null || $('nome').value.trim() || $('biografia').value.trim() || $('areas').value.trim();
  }
  function podeDescartar() { return !mudou() || window.confirm('Descartar o formulário atual?'); }
  function listar() {
    const termo = normalizar($('filtro').value);
    const encontrados = registros.filter(a => normalizar(`${a.nome_artistico} ${a.areas_atuacao.join(' ')}`).includes(termo));
    $('lista').replaceChildren();
    $('contagem').textContent = registros.length === 0 ? 'Nenhum cadastro ainda. Comece pelo formulário.' : `${encontrados.length} cadastro(s) encontrado(s).`;
    for (const a of encontrados) {
      const item = document.createElement('article'); item.className = 'list-item';
      const titulo = document.createElement('h3'); titulo.textContent = a.nome_artistico;
      const descricao = document.createElement('p'); descricao.textContent = `${a.publicado ? 'Publicado' : 'Rascunho'} · ${a.areas_atuacao.join(', ') || 'Área não informada'}`;
      const editar = document.createElement('button'); editar.type = 'button'; editar.className = 'secondary'; editar.textContent = 'Editar';
      editar.setAttribute('aria-label', `Editar ${a.nome_artistico}`);
      editar.addEventListener('click', () => {
        if (ocupado || !podeDescartar()) return;
        editando = a.id; $('nome').value = a.nome_artistico; $('biografia').value = a.biografia;
        $('areas').value = a.areas_atuacao.join(', '); $('publicado').checked = a.publicado;
        $('titulo-editor').textContent = 'Editar artista'; $('nome').focus();
      });
      item.append(titulo, descricao, editar); $('lista').appendChild(item);
    }
  }
  async function atualizar() {
    const versao = carregamento;
    const { data, error } = await banco.from(window.MAPA_CONFIG.table).select('id,nome_artistico,biografia,areas_atuacao,publicado').order('nome_artistico');
    if (versao !== carregamento) return;
    if (error) throw error;
    registros = data || []; listar();
  }
  async function sessao(session) {
    const versao = ++carregamento;
    usuario = session?.user || null;
    $('login').hidden = true; $('painel').hidden = true; $('nova-senha').hidden = true;
    $('sair').hidden = !usuario; registros = []; $('lista').replaceChildren(); limpar();
    if (!usuario) { $('login').hidden = false; status('Entre para gerenciar os cadastros.'); return; }
    if (senhaPendente) { $('nova-senha').hidden = false; status('Defina sua senha para continuar.'); return; }
    status('Verificando permissão da equipe…');
    try {
      const { data, error } = await banco.from('avare_equipe').select('user_id').eq('user_id', usuario.id).maybeSingle();
      if (versao !== carregamento) return;
      if (error) throw error;
      if (!data) { status('Sua conta ainda não foi liberada para a equipe. Peça a liberação à coordenação.', true); return; }
      await atualizar();
      if (versao !== carregamento) return;
      $('conta').textContent = `Conectado como ${usuario.email}`; $('painel').hidden = false;
      status('Acesso liberado. Cadastros salvos como rascunho só aparecem para a equipe.');
    } catch (e) { if (versao === carregamento) status(mensagemErro(e), true); }
  }

  $('form-login').addEventListener('submit', async event => {
    event.preventDefault(); $('entrar').disabled = true; status('Entrando…');
    try {
      const { error } = await banco.auth.signInWithPassword({ email: $('email').value.trim(), password: $('senha').value });
      if (error) { status('Não foi possível entrar. Confira o e-mail e a senha da sua conta.', true); return; }
      $('senha').value = '';
    } catch { status('Não foi possível conectar. Tente novamente.', true); }
    finally { $('entrar').disabled = false; }
  });
  $('recuperar').addEventListener('click', async () => {
    if (!$('email').reportValidity() || !$('email').value) { $('email').focus(); return; }
    $('recuperar').disabled = true;
    try {
      const redirectTo = new URL('equipe.html', location.href).href;
      const { error } = await banco.auth.resetPasswordForEmail($('email').value.trim(), { redirectTo });
      if (error) throw error;
      status('Se houver uma conta com esse e-mail, você receberá um link para definir a senha.');
    } catch { status('Não foi possível enviar o link. Tente novamente mais tarde.', true); }
    finally { $('recuperar').disabled = false; }
  });
  $('form-senha').addEventListener('submit', async event => {
    event.preventDefault();
    if ($('senha-nova').value !== $('senha-confirmacao').value) { status('As senhas precisam ser iguais.', true); return; }
    const botao = event.currentTarget.querySelector('button'); botao.disabled = true;
    try {
      const { error } = await banco.auth.updateUser({ password: $('senha-nova').value });
      if (error) throw error;
      senhaPendente = false; $('form-senha').reset(); history.replaceState(null, '', location.pathname);
      const { data, error: erroSessao } = await banco.auth.getSession(); if (erroSessao) throw erroSessao;
      await sessao(data.session);
    } catch { status('Não foi possível definir a senha. Use uma senha de pelo menos 12 caracteres ou solicite um novo link.', true); }
    finally { botao.disabled = false; }
  });
  $('sair').addEventListener('click', async () => {
    if (ocupado || !podeDescartar()) return;
    $('sair').disabled = true;
    try {
      const { error } = await banco.auth.signOut(); if (error) throw error;
      senhaPendente = false; $('form-login').reset(); await sessao(null);
    } catch { status('Não foi possível encerrar a sessão. Tente novamente.', true); }
    finally { $('sair').disabled = false; }
  });
  $('form-artista').addEventListener('submit', async event => {
    event.preventDefault(); if (ocupado || !usuario) return;
    const nome = $('nome').value.trim();
    if (!nome) { status('Informe o nome artístico.', true); $('nome').focus(); return; }
    const areas = [...new Set($('areas').value.split(',').map(a => a.trim()).filter(Boolean))];
    if (areas.length > 20 || areas.some(a => a.length > 80)) { status('Use até 20 áreas, com até 80 caracteres em cada uma.', true); return; }
    ocupado = true; $('salvar').disabled = true; $('novo').disabled = true; status('Salvando cadastro…');
    const versao = carregamento;
    try {
      const valores = { nome_artistico: nome, biografia: $('biografia').value.trim(), areas_atuacao: areas, publicado: $('publicado').checked };
      const tabela = banco.from(window.MAPA_CONFIG.table);
      const operacao = editando ? tabela.update(valores).eq('id', editando) : tabela.insert(valores);
      const { data, error } = await operacao.select('id').single();
      if (error || !data) throw error || new Error('Cadastro não salvo');
      if (versao !== carregamento) return;
      limpar(); status('Cadastro salvo.');
      try { await atualizar(); } catch { status('Cadastro salvo, mas a lista não pôde ser atualizada. Clique em Atualizar lista.', true); }
    } catch (e) { if (versao === carregamento) status(mensagemErro(e), true); }
    finally { ocupado = false; $('salvar').disabled = false; $('novo').disabled = false; }
  });
  $('novo').addEventListener('click', () => { if (!ocupado && podeDescartar()) limpar(); });
  $('filtro').addEventListener('input', listar);
  $('recarregar').addEventListener('click', async () => {
    $('recarregar').disabled = true;
    try { await atualizar(); status('Lista atualizada.'); } catch (e) { status(mensagemErro(e), true); }
    finally { $('recarregar').disabled = false; }
  });
  window.addEventListener('beforeunload', event => { if (mudou()) { event.preventDefault(); event.returnValue = ''; } });
  try {
    if (!window.supabase || !window.MAPA_CONFIG) throw new Error('Biblioteca indisponível');
    const c = window.MAPA_CONFIG;
    banco = window.supabase.createClient(c.url, c.publicKey);
    banco.auth.onAuthStateChange((evento, session) => {
      if (evento === 'PASSWORD_RECOVERY') senhaPendente = true;
      // O Supabase pode repetir SIGNED_IN ao voltar para a aba. Preserve o formulário.
      if (evento === 'SIGNED_IN' && session?.user?.id === usuario?.id && !$('painel').hidden && !senhaPendente) return;
      // Fora do callback síncrono de autenticação para evitar bloqueio do cliente.
      if (['INITIAL_SESSION', 'SIGNED_IN', 'SIGNED_OUT', 'PASSWORD_RECOVERY'].includes(evento)) setTimeout(() => sessao(session), 0);
    });
  } catch { status('Não foi possível iniciar a área da equipe. Atualize a página e confira a conexão.', true); }
})();
