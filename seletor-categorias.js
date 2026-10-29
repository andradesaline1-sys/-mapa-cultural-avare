'use strict';
(() => {
  const $ = id => document.getElementById(id);
  if (!$('seletor-categorias')) return;
  const chave = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const escolhidas = new Map();
  const opcoes = new Map();
  for (const grupo of window.MAPA_CATEGORIAS || []) for (const o of grupo.opcoes) {
    const k = chave(o.valor); if (!opcoes.has(k)) opcoes.set(k, { ...o, grupo: grupo.nome });
  }
  function mudou() { $('form-artista').dispatchEvent(new Event('input', { bubbles: true })); }
  function atualizarSelecionadas() {
    $('areas').value = JSON.stringify([...escolhidas.values()]);
    $('categorias-selecionadas').replaceChildren();
    for (const [k, valor] of escolhidas) {
      const tag = document.createElement('button'); tag.type = 'button'; tag.className = 'selected-category'; tag.textContent = (opcoes.get(k)?.rotulo || valor) + ' ×'; tag.setAttribute('aria-label', `Remover ${opcoes.get(k)?.rotulo || valor}`);
      tag.addEventListener('click', () => { escolhidas.delete(k); atualizarSelecionadas(); listar(); mudou(); });
      $('categorias-selecionadas').append(tag);
    }
    $('categorias-contagem').textContent = `${escolhidas.size} de 20 categorias selecionadas`;
  }
  function listar() {
    const termo = chave($('busca-categorias').value);
    const grupo = $('grupo-categorias').value;
    $('opcoes-categorias').replaceChildren();
    const encontradas = [...opcoes].filter(([k, o]) => (!grupo || o.grupo === grupo) && chave(o.rotulo + ' ' + o.valor).includes(termo)).sort((a, b) => a[1].rotulo.localeCompare(b[1].rotulo, 'pt-BR'));
    $('categorias-resultados').textContent = `${encontradas.length} opções disponíveis`;
    let indice = 0;
    for (const [k, o] of encontradas) {
      const label = document.createElement('label'); label.className = 'category-choice';
      const input = document.createElement('input'); input.type = 'checkbox'; input.id = 'categoria-opcao-' + indice++; input.checked = escolhidas.has(k); input.value = o.valor;
      const texto = document.createElement('span'); texto.textContent = o.rotulo;
      input.addEventListener('change', () => {
        if (input.checked && escolhidas.size >= 20) { input.checked = false; $('categorias-contagem').textContent = 'Limite de 20 categorias. Remova uma para escolher outra.'; return; }
        if (input.checked) escolhidas.set(k, o.valor); else escolhidas.delete(k);
        atualizarSelecionadas(); mudou();
      });
      label.append(input, texto); $('opcoes-categorias').append(label);
    }
  }
  window.MAPA_AREA_SELECTOR = {
    getValues: () => [...escolhidas.values()],
    setValues(valores) {
      escolhidas.clear();
      for (const valor of valores || []) {
        escolhidas.set(chave(valor), valor);
        if (!opcoes.has(chave(valor))) opcoes.set(chave(valor), { valor, rotulo: valor, grupo: 'Categorias complementares' });
      }
      $('busca-categorias').value = ''; $('grupo-categorias').value = ''; atualizarSelecionadas(); listar();
    }
  };
  $('busca-categorias').addEventListener('input', listar);
  $('grupo-categorias').addEventListener('change', listar);
  $('adicionar-categoria').addEventListener('click', () => {
    const valor = $('categoria-personalizada').value.trim();
    if (!valor || valor.length > 80) { $('categoria-personalizada').focus(); return; }
    if (escolhidas.size >= 20 && !escolhidas.has(chave(valor))) { $('categorias-contagem').textContent = 'Limite de 20 categorias. Remova uma para escolher outra.'; return; }
    opcoes.set(chave(valor), opcoes.get(chave(valor)) || { valor, rotulo: valor, grupo: 'Categorias complementares' }); escolhidas.set(chave(valor), valor);
    $('categoria-personalizada').value = ''; atualizarSelecionadas(); listar(); mudou();
  });
  for (const nome of [...new Set([...opcoes.values()].map(o => o.grupo))]) { const option = document.createElement('option'); option.value = nome; option.textContent = nome; $('grupo-categorias').append(option); }
  atualizarSelecionadas(); listar();
})();
