'use strict';
(() => {
  let promptInstalacao;
  const botao = document.getElementById('instalar-app');
  const ajuda = document.getElementById('instalar-ajuda');
  if (!botao || !ajuda) return;
  const instalado = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (instalado()) return;
  if (ios) {
    botao.hidden = false;
    botao.textContent = 'Como instalar no iPhone';
    botao.addEventListener('click', () => {
      ajuda.hidden = !ajuda.hidden;
      ajuda.textContent = 'No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início.';
    });
  }
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    promptInstalacao = event;
    botao.hidden = false;
    botao.textContent = 'Instalar aplicativo grátis';
  });
  botao.addEventListener('click', async () => {
    if (!promptInstalacao) return;
    const evento = promptInstalacao;
    promptInstalacao = null;
    botao.hidden = true;
    await evento.prompt();
  });
  window.addEventListener('appinstalled', () => { botao.hidden = true; ajuda.hidden = true; });
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
  }
})();