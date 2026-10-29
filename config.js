// Chave publicável; as permissões são aplicadas pelas políticas do banco.
window.MAPA_CONFIG = Object.freeze({
  url: 'https://eggtmdibvcixlnlnlhcf.supabase.co',
  publicKey: 'sb_publishable_TVfmy-GC9F-5z2aLogQ0Gg_dnsfHRFK',
  table: 'avare_artistas'
});

// Um único cliente compartilha a sessão de acesso e de avaliação pública.
window.mapaBanco = (() => {
  let cliente;
  return () => cliente || (cliente = window.supabase.createClient(window.MAPA_CONFIG.url, window.MAPA_CONFIG.publicKey));
})();
