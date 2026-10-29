# Mapa Cultural de Avaré

Site estático com catálogo público e área da equipe. Não requer npm, compilação ou servidor de aplicação. Não contém artistas de exemplo.

## Rodar localmente

Na pasta do projeto: `python3 -m http.server 8000 --bind 127.0.0.1`.
Abra `index.html` pelo servidor; `equipe.html` contém o acesso da equipe. Use o checkout existente; tarefas na nuvem já são isoladas e não precisam de worktrees adicionais.

## Ativação no Supabase (coordenação)

1. Entre na sua conta em https://supabase.com/dashboard/project/eggtmdibvcixlnlnlhcf.
2. Abra **SQL Editor**, crie uma consulta e execute o conteúdo de [ativar-equipe.sql](supabase/ativar-equipe.sql) uma vez. A transação cria tabelas separadas e suas políticas de acesso; não modifica nem apaga `artistas_publicos`. Se as tabelas já existirem, não apague nada para repetir: confira o resultado da ativação anterior.
3. Em **Authentication → URL Configuration**, configure **Site URL** como `https://andradesaline1-sys.github.io/-mapa-cultural-avare/` e adicione `https://andradesaline1-sys.github.io/-mapa-cultural-avare/equipe.html` em **Redirect URLs**. Isso permite os links de convite e recuperação de senha.
4. Em **Authentication → Users**, use **Add user → Invite user** (ou crie a conta). Cada pessoa deve ter sua própria conta. Se o envio por e-mail exigir configuração SMTP no seu plano/projeto, configure-a antes de usar convites/recuperação; não coloque a senha de SMTP no site.
5. Execute [liberar-pessoa.sql](supabase/liberar-pessoa.sql), substituindo o e-mail indicado pelo e-mail da conta criada. Repita para cada pessoa da equipe. Ter conta no Supabase Auth não concede acesso de edição por si só.
6. A pessoa abre o convite, define a senha e acessa `equipe.html`. Se a confirmação abrir a página inicial em vez do formulário de senha, use **Esqueci minha senha** na área da equipe, após conferir a URL de redirecionamento.

Não copie chaves `service_role`, senhas ou tokens administrativos para arquivos do site. `config.js` contém somente a chave publicável já usada pelo catálogo. RLS limita visitantes a artistas publicados; apenas contas liberadas na tabela `avare_equipe` podem cadastrar/editar. O navegador não pode incluir novas pessoas na equipe.

## Uso pela estagiária

Entre em **Área da equipe** com e-mail e senha. Preencha nome, biografia e áreas separadas por vírgula. **Salvar cadastro** cria um rascunho por padrão. Marque **Publicar no catálogo** e salve para mostrar o artista ao público. Para editar ou retirar do catálogo, use **Editar**, desmarque a publicação se necessário e salve. O cadastro permanece disponível à equipe. Use **Sair** em computadores compartilhados.

## Publicação

O GitHub Pages existente usa a branch `main`, pasta raiz. Os arquivos novos precisam entrar nessa branch para atualizar o site. A publicação do ambiente de desenvolvimento do Codex é independente da publicação do site. Não exponha a área nova como operacional antes de ativar o banco e validar com uma conta autorizada.

## Verificação de aceite após ativação

- Visitante vê o catálogo vazio sem erro; rascunhos ficam invisíveis.
- Conta autorizada entra, salva um rascunho, edita, publica e retira a publicação.
- Conta sem liberação não recebe acesso de edição, mesmo se conseguir fazer login.
- Ao sair, os dados da equipe desaparecem da tela.
- Convite e recuperação abrem a área da equipe e permitem definir a senha.

Os testes locais com serviços simulados não substituem essa verificação com o Supabase real. O catálogo legado é consultado somente enquanto a tabela nova ainda não existe. Depois da ativação, novos cadastros usam exclusivamente `avare_artistas`; registros antigos não são migrados automaticamente.
