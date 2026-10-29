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


## Catálogo completo e avaliações públicas

A nova apresentação inclui filtros por área, busca sem distinção de acentos por nome/bairro, ordenação, carregamento de mais artistas e perfis com foto, apresentação curta, trajetória e contatos públicos. A equipe conta com upload de foto (até 5 MB), filtros por publicação e exportação CSV. A exportação é uma cópia para consulta; não é um mecanismo de importação.

### Ativar a atualização

1. Execute [atualizar-catalogo.sql](supabase/atualizar-catalogo.sql) no SQL Editor do projeto, após a ativação inicial. O arquivo adiciona campos, armazenamento de fotos e avaliações sem apagar artistas ou acessos existentes. Pode ser executado novamente. Não execute novamente o script inicial de criação de tabelas.
2. Em **Authentication → URL Configuration**, mantenha o endereço público em **Site URL** e adicione `https://andradesaline1-sys.github.io/-mapa-cultural-avare/**` em **Redirect URLs**. O curinga permite o retorno ao perfil do artista após o link de acesso. Preserve outros endereços de redirecionamento já necessários.
3. Em **Authentication → Sign In / Providers → Email**, mantenha o provedor de e-mail e o cadastro de usuários habilitados. Visitantes podem confirmar seu e-mail para avaliar; isso não os inclui em `avare_equipe` e não concede edição de artistas.
4. Configure **SMTP próprio** em Authentication para enviar links a visitantes fora da organização. O serviço padrão do Supabase tem restrições de destinatários e limites; a entrega pública de e-mails precisa ser validada com um endereço real. Insira credenciais somente no painel seguro do Supabase, nunca no JavaScript ou no GitHub.
5. Teste com uma pessoa de fora da equipe: abrir um perfil publicado, solicitar link, abrir o e-mail e enviar a avaliação. Verifique que o comentário continua oculto até a aprovação em **Área da equipe → Avaliações do público**. O envio e a entrega real de e-mail não são comprovados pelos testes simulados.

O catálogo e o formulário básico continuam funcionando antes dessa atualização. Os campos completos são ocultados no editor enquanto a coluna nova não estiver disponível. As avaliações aparecem apenas em perfis com identificador público após a atualização do banco.

### Como funcionam as avaliações

- Nota de 1 a 5 e comentário com 10 a 2.000 caracteres. Nome de exibição com 2 a 80 caracteres; o e-mail não é publicado.
- É obrigatório confirmar o e-mail pelo link de acesso. A pessoa consente com a publicação de nome, nota e comentário antes do envio.
- Uma avaliação por conta e artista. Reenviar substitui a anterior e exige nova aprovação. O servidor limita envios a um por minuto por conta e até dez pendências em outros artistas.
- A equipe pode aprovar, não aprovar e retirar a publicação. Notas e médias usam somente comentários aprovados de artistas publicados. Não há edição do texto pela equipe.
- A tela de moderação mostra até 100 registros por situação; ao processá-los, atualize a lista para receber os próximos. O perfil mostra os 50 comentários públicos mais recentes; a média considera todos os aprovados.
- Fotos enviadas ao bucket `avare-perfis` têm URLs públicas, inclusive antes da publicação do artista. Envie apenas imagens autorizadas para divulgação. Remover a foto do perfil não apaga o arquivo de armazenamento; a coordenação pode removê-lo no painel Storage quando ele não for mais usado.
- Ao retirar um artista do catálogo, suas avaliações também deixam de aparecer. Não são aceitas novas avaliações para rascunhos.

### Validação desta atualização

Foram exercitados o banco atual de leitura, a interface no Chromium com serviços simulados e as políticas SQL em PostgreSQL isolado (incluindo aprovação, e-mail confirmado e limites de envio). Esses testes não criam artistas nem contas no Supabase real. A ativação da migração, o SMTP e o fluxo completo com uma conta autorizada precisam ser confirmados no projeto de produção.


### Repetir os testes de desenvolvimento

A aplicação continua sem dependências npm de execução. Para os testes opcionais, instale ferramentas fora do checkout:

```sh
npm install --prefix /tmp/avare-test-tools --no-save --package-lock=false @electric-sql/pglite@0.5.13 playwright@1.62.1
curl -fsS https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2 -o /tmp/avare-sdk.js
NODE_PATH=/tmp/avare-test-tools/node_modules node tests/permissoes.cjs
NODE_PATH=/tmp/avare-test-tools/node_modules node tests/navegador.cjs
```

O teste de navegador usa `/usr/bin/chromium` no ambiente de desenvolvimento, faz uma consulta pública real ao catálogo vazio e depois usa dados simulados exclusivamente no navegador local. Não cria contas nem envia e-mails. As capturas de revisão são salvas em `/tmp/avare-novo-desktop.png` e `/tmp/avare-novo-mobile.png`. Não execute o teste de catálogo vazio após começar a publicar artistas sem adaptar essa expectativa.
