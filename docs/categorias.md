# Categorias culturais

A lista compartilhada entre o catálogo e o cadastro fica em `categorias.js`.

## Fonte consultada

[Mapas Culturais — taxonomias de áreas, funções e linguagens](https://github.com/mapasculturais/mapasculturais/blob/9427d9bd4e5b957a3286704764662907db6f425b/src/conf/taxonomies.php), versão `9427d9bd4e5b957a3286704764662907db6f425b`, consultada em 29/10/2026.

Foram importadas 382 entradas de áreas de atuação, 366 de funções/ocupações e 19 de linguagens. A interface remove duplicações sem diferenciar maiúsculas e acentos e mantém uma categoria complementar do catálogo anterior. São 759 valores únicos nesta versão.

Também foi consultado o [portal da Classificação Brasileira de Ocupações (CBO)](https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/cbo) como referência sobre ocupações. A lista não foi apresentada como uma extração da CBO: sua fonte de dados é o Mapas Culturais.

Não existe uma lista universal e definitiva de todas as atividades artísticas. Esta implementação importa integralmente as três listas da fonte consultada e permite categorias complementares, sem afirmar que esgota toda a internet.

## Compatibilidade e múltipla escolha

- Um artista pode ter até 20 categorias, salvas como um array de textos em `areas_atuacao`, já existente no banco.
- A seleção usa checkboxes, busca sem distinção de acentos, filtro de tipo e etiquetas removíveis.
- Categorias com vírgulas são itens únicos. O formulário não divide mais nomes por vírgula.
- Editar preserva os valores existentes, incluindo categorias antigas ou personalizadas.
- Categorias personalizadas têm até 80 caracteres. Uma categoria nova aparece no filtro público quando houver um perfil publicado que a utilize.
- Duas entradas da fonte excedem 80 caracteres: o rótulo completo é exibido, mas o valor salvo usa as abreviações `Cultura de terreiro e de matriz africana` e `Dançarino(a) de danças populares e tradicionais`. O restante mantém o texto da fonte.
- As categorias representam áreas, linguagens e atividades. Sua seleção descreve a atuação profissional; não constitui comprovação de registro profissional ou certificação.

A mudança não exige executar outro SQL.
