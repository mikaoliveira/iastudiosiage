# [RF001] Listar - Exceção de Hierarquia

## 1) Histórico

| Data | Versão | Descrição | Autor | Versão mind | Sprint de desenvolvimento |
| --- | --- | --- | --- | --- | --- |
| 16 de nov. de 2026 | 1.0 | Criação da funcionalidade | A definir | 01 | A definir |

## 2) História de Usuário

Eu, como usuário do SIAGE-RH, na qualidade de Administrador ou usuário com permissão de acesso,

Quero acessar a funcionalidade de Listar Exceção de Hierarquia,

Para consultar a situação das chefias e dos aprovadores de exceção de cada setor, localizar registros e acessar as operações autorizadas.

## 3) Fluxo de acesso à funcionalidade

Login >> Selecionar Matrícula, quando aplicável >> Página Inicial >> Configurações >> Hierarquia de Unidades e Cargos >> Exceção de Hierarquia

**Pré-condições:**

- O usuário deverá estar autenticado e possuir matrícula ativa em contexto, quando aplicável.
- O usuário deverá ter permissão para consultar a Exceção de Hierarquia ou ser Administrador; quando a permissão estiver vinculada a setores determinados, a consulta deverá limitar-se aos setores autorizados.

## 4) Critérios de Aceite

### 4.1 Acesso e permissões

- O acesso deverá ser permitido ao Administrador e aos usuários com permissão específica para a operação de Exceção de Hierarquia, inclusive quando o permissionamento estiver restrito ao setor.
- A aplicação deverá verificar a autorização antes de disponibilizar dados ou ações e revalidá-la ao executar operações de manutenção; ausência de autorização não deverá permitir consultar ou modificar informações protegidas.
- O acesso direto por rota sem permissão deverá apresentar a tela global de “Acesso restrito”, sem expor dados do setor ou dos servidores.
- Ações de consulta, configuração, edição e revogação deverão respeitar as permissões correspondentes; não oferecer botão de manutenção a quem possuir somente acesso de consulta.

### 4.2 Regras gerais

#### 4.2.1 Estrutura e apresentação da tela

- Apresentar breadcrumbs, Voltar, título “Exceção de Hierarquia”, descrição, bloco de filtros e tabela com os setores cadastrados na Hierarquia de Unidades e Cargos.
- Os setores deverão abranger Secretaria Geral, Secretaria Executiva, Gerência Executiva, Gerência Regional, Subgerência e Núcleo, conforme o permissionamento do usuário.
- Os filtros deverão ser Unidade de Trabalho / Setor, Situação, Chefia Imediata (Situação), Chefia Imediata (Nome), Aprovador de Exceção (Situação) e Aprovador de Exceção (Nome).
- A tabela deverá apresentar, nesta ordem, Nome do Setor, Unidade de Trabalho, Chefia Imediata, Aprovador de Exceção, Tipo de Atuação, Situação e Ações. Não haverá cadastro ou exclusão de setor por esta funcionalidade; os setores se originam dos respectivos cadastros de Hierarquia.
- A interface deverá seguir os padrões de acessibilidade definidos nas Padronizações do SIAGE-RH e os comportamentos acessíveis disponibilizados pelos componentes da biblioteca SIAGE-UI. Particularidades deverão ser especificadas no detalhamento dos respectivos elementos.

#### 4.2.2 Pesquisa, ordenação e paginação

- Unidade de Trabalho / Setor deverá realizar busca parcial pelo Nome do Setor, Código da UTB ou Nome da UTB, sem diferenciar maiúsculas e minúsculas. O filtro é um campo de texto; não exige seleção em lista de sugestões.
- Chefia Imediata (Nome) e Aprovador de Exceção (Nome) deverão pesquisar parcialmente os nomes dos servidores correspondentes, sem diferenciar maiúsculas e minúsculas.
- Situação terá opções Todos (inicial), Regular, Suprido, Descoberto e Necessita Troca. Chefia Imediata (Situação) terá Todos (inicial), Com Chefe Ativo, Com Chefe Inativo e Sem Chefe Definido. Aprovador de Exceção (Situação) terá Todos (inicial), Com Aprovador e Sem Aprovador.
- Todos os filtros preenchidos serão combinados por condição cumulativa: um setor só será apresentado se atender simultaneamente a cada critério aplicado. Os seletores com valor “Todos” não restringem a consulta.
- Buscar deverá permanecer desabilitado até que pelo menos um filtro difira do estado inicial. A pesquisa ocorrerá ao acionar Buscar ou pressionar ENTER em campo textual com critério informado. Alterar um campo não deverá aplicar automaticamente a pesquisa antes de Buscar.
- Limpar deverá remover todos os textos, restaurar os três seletores para Todos, apresentar a listagem sem filtros e retornar à primeira página. Buscar e Limpar deverão reiniciar a paginação na primeira página.
- Ordenar inicialmente os setores pelo Nome do Setor, de A a Z, permitindo alternar entre ordem crescente e decrescente. Paginar com até 10 setores por página, exibindo quantidade total e controles de navegação.
- Ao retornar à listagem depois de Visualizar ou Configurar, preservar os filtros aplicados, os textos digitados e a página anteriormente consultada, atualizando as informações do setor quando houver alteração em seu aprovador.

#### 4.2.3 Chefia Imediata e Aprovador de Exceção

- A Chefia Imediata deverá ser consultada nos cadastros de Hierarquia. Quando houver chefe, exibir Nome e Matrícula; quando não houver, exibir “Sem Chefe Definido”. Havendo chefe com situação inativa ou indisponibilidade operacional vigente, apresentar indicador “Inativo” em cinza, sem ocultar seu nome.
- Considerar Chefe Imediato ativo somente quando houver servidor vinculado com situação funcional 10 (Em exercício), 25 (Requisitado com ônus), 31 (Requisitado com ressarcimento) ou 22 (Requisitado sem ônus para estado), e sem férias, licença, afastamento ou cessão que o torne indisponível na data da consulta. Qualquer outra situação, ou indisponibilidade vigente, caracteriza Chefia Imediata inativa.
- Quando existir Aprovador de Exceção com designação vigente, exibir seu Nome e Matrícula. Sem designação vigente, apresentar “Sem exceção cadastrada”, independentemente de existirem designações encerradas no histórico.
- Tipo de Atuação deverá apresentar “Sempre sobrepõe chefia” quando o aprovador atuar em todos os fluxos de férias, licenças e afastamentos do setor, ou “Suporte à chefia ausente” quando atuar apenas se a chefia imediata estiver indisponível ou não definida. Sem aprovador vigente, exibir “—”.
- A exceção somente substitui ou sobrepõe a Chefia Imediata nos fluxos de aprovação de férias, licenças e afastamentos abrangidos pela designação; não concede outros poderes administrativos ou de gestão da hierarquia.

#### 4.2.4 Classificação da Situação do setor

- A situação deverá ser calculada a partir da existência e condição da Chefia Imediata e da designação vigente do Aprovador de Exceção, considerando os dados atuais de situação funcional e disponibilidade operacional.
- Aplicar a seguinte precedência: (1) Necessita Troca, quando houver aprovador vigente com situação funcional impeditiva ou indisponibilidade operacional, inclusive se houver Chefe Imediato ativo; (2) Suprido, quando não houver chefia ativa e existir aprovador vigente elegível e disponível; (3) Regular, quando houver chefia ativa e não ocorrer a condição Necessita Troca, exista ou não aprovador vigente; (4) Descoberto, quando não houver chefia ativa nem aprovador vigente.
- A classificação Necessita Troca deverá ser apresentada em amarelo; Descoberto, em vermelho; Regular, em verde; Suprido, em indicador informativo de acordo com a biblioteca SIAGE-UI. A informação textual deverá estar disponível independentemente da cor.
- O indicador Necessita Troca permanecerá até a regularização da disponibilidade/situação do aprovador vigente ou sua substituição/revogação, conforme nova classificação calculada.

#### 4.2.5 Ações, estados da listagem e feedback

- Visualizar deverá abrir RF002 em modo somente leitura, para o setor selecionado, com ou sem aprovador vigente. Editar/Configurar deverá abrir RF002 em modo de manutenção, respeitando a autorização do usuário; exibir “Configurar aprovador de exceção” quando não houver designação ativa e “Editar aprovador de exceção” quando houver.
- A listagem não deverá permitir criar, ativar, inativar ou excluir setores. A revogação da exceção ocorrerá exclusivamente na operação de Configurar/Editar do setor.
- Caso não exista nenhum setor cadastrado para consulta, apresentar “Nenhum setor cadastrado na Hierarquia de Unidades e Cargos.”. Se a aplicação dos filtros não retornar correspondência, apresentar “Nenhum setor encontrado” e “Nenhum setor corresponde aos critérios de busca selecionados.”, sem apresentar toast apenas por ausência de resultados.
- Durante o carregamento, manter os filtros e apresentar estado visual de carregamento na tabela. Em falha da consulta, apresentar o estado de erro sem exibir informações técnicas; a ação de tentar novamente deverá refazer a busca atual.

## 5) Detalhamento da funcionalidade

### 5.1 Cabeçalho e navegação

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Breadcrumbs</strong> | <ul><li><strong>Tipo:</strong> Navegação contextual.</li><li><strong>Componente SIAGE-UI:</strong> SPageHeaderComponent (s-page-header: breadcrumbs).</li><li><strong>Exibição:</strong> Início / Configurações / Hierarquia de Unidades e Cargos / Exceção de Hierarquia.</li><li><strong>Comportamentos:</strong> Cada nível anterior é navegável; o último corresponde à tela atual.</li></ul> |
| <strong>Voltar</strong> | <ul><li><strong>Label:</strong> “Voltar”.</li><li><strong>Tipo:</strong> IconButton do cabeçalho.</li><li><strong>Componente SIAGE-UI:</strong> SPageHeaderComponent (s-page-header: showBack).</li><li><strong>Comportamentos:</strong> Retorna ao menu Hierarquia de Unidades e Cargos, sem alterar registros.</li></ul> |
| <strong>Título e descrição</strong> | <ul><li><strong>Título:</strong> “Exceção de Hierarquia”.</li><li><strong>Tipo:</strong> Título de página e texto descritivo.</li><li><strong>Componente SIAGE-UI:</strong> SPageHeaderComponent (s-page-header: title e description).</li><li><strong>Descrição:</strong> “Designação de aprovadores de exceção para fluxos de aprovação quando houver necessidade de sobreposição ou ausência da chefia imediata formal.”</li><li><strong>Comportamentos:</strong> Contextualiza a funcionalidade sem conceder operações de manutenção.</li></ul> |
### 5.2 Filtros da listagem

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Bloco de filtros</strong> | <ul><li><strong>Tipo:</strong> Grupo de seis filtros com ações de consulta.</li><li><strong>Componente SIAGE-UI:</strong> SFilterCardComponent (s-filter-card: form, search e clear), SFieldComponent, SInputComponent e SSelectComponent; a aplicação reconhece o estado inicial dos filtros.</li><li><strong>Comportamentos:</strong> Os critérios são combináveis; só serão aplicados quando Buscar for acionado. Limpar restaura o estado inicial.</li></ul> |
| <strong>Unidade de Trabalho / Setor</strong> | <ul><li><strong>Label:</strong> “Unidade de Trabalho / Setor”.</li><li><strong>Tipo:</strong> Campo de texto para pesquisa.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field) e SInputComponent (s-input).</li><li><strong>Obrigatoriedade:</strong> Opcional.</li><li><strong>Placeholder:</strong> “Digite a Unidade de Trabalho / Setor”.</li><li><strong>Comportamentos:</strong> Aceita código da UTB, nome da UTB ou nome do setor. A pesquisa é parcial e não distingue maiúsculas/minúsculas; não exige seleção em autocomplete.</li></ul> |
| <strong>Situação</strong> | <ul><li><strong>Label:</strong> “Situação”.</li><li><strong>Tipo:</strong> Select.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent e SSelectComponent (s-select).</li><li><strong>Obrigatoriedade:</strong> Opcional.</li><li><strong>Opções:</strong> Todos, Regular, Suprido, Descoberto, Necessita Troca.</li><li><strong>Valor inicial:</strong> Todos.</li><li><strong>Comportamentos:</strong> Filtra pela situação calculada conforme a seção 4.2.4; Todos não aplica restrição.</li></ul> |
| <strong>Chefia Imediata (Situação)</strong> | <ul><li><strong>Label:</strong> “Chefia Imediata (Situação)”.</li><li><strong>Tipo:</strong> Select.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent e SSelectComponent.</li><li><strong>Obrigatoriedade:</strong> Opcional.</li><li><strong>Opções:</strong> Todos, Com Chefe Ativo, Com Chefe Inativo, Sem Chefe Definido.</li><li><strong>Valor inicial:</strong> Todos.</li><li><strong>Comportamentos:</strong> Com Chefe Ativo exige chefe vinculado, situação funcional elegível e disponibilidade operacional. Com Chefe Inativo exige chefe vinculado que não atenda a pelo menos um desses requisitos. Sem Chefe Definido exige ausência de vínculo de chefia.</li></ul> |
| <strong>Chefia Imediata (Nome)</strong> | <ul><li><strong>Label:</strong> “Chefia Imediata (Nome)”.</li><li><strong>Tipo:</strong> Campo de texto.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent e SInputComponent.</li><li><strong>Obrigatoriedade:</strong> Opcional.</li><li><strong>Placeholder:</strong> “Digite o Nome da Chefia Imediata”.</li><li><strong>Comportamentos:</strong> Pesquisa parcial pelo nome do chefe vinculado; não retorna setores sem chefia quando esse filtro estiver preenchido.</li></ul> |
| <strong>Aprovador de Exceção (Situação)</strong> | <ul><li><strong>Label:</strong> “Aprovador de Exceção (Situação)”.</li><li><strong>Tipo:</strong> Select.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent e SSelectComponent.</li><li><strong>Obrigatoriedade:</strong> Opcional.</li><li><strong>Opções:</strong> Todos, Com Aprovador e Sem Aprovador.</li><li><strong>Valor inicial:</strong> Todos.</li><li><strong>Comportamentos:</strong> Com Aprovador mostra somente setores com designação vigente. Sem Aprovador mostra setores sem designação vigente, ainda que possuam registros históricos encerrados ou substituídos.</li></ul> |
| <strong>Aprovador de Exceção (Nome)</strong> | <ul><li><strong>Label:</strong> “Aprovador de Exceção (Nome)”.</li><li><strong>Tipo:</strong> Campo de texto.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent e SInputComponent.</li><li><strong>Obrigatoriedade:</strong> Opcional.</li><li><strong>Placeholder:</strong> “Digite o Nome do Aprovador de Exceção”.</li><li><strong>Comportamentos:</strong> Pesquisa parcial pelo nome do aprovador vigente. Não usa designações históricas para corresponder a esse filtro.</li></ul> |
| <strong>Buscar</strong> | <ul><li><strong>Label:</strong> “Buscar”.</li><li><strong>Tipo:</strong> Ação primária do bloco de filtros.</li><li><strong>Componente SIAGE-UI:</strong> SFilterCardComponent (s-filter-card: search); a habilitação considerando os valores iniciais é responsabilidade da aplicação.</li><li><strong>Habilitação:</strong> Ao menos um dos seis critérios diferente do estado inicial.</li><li><strong>Comportamentos:</strong> Aplica cumulativamente os critérios e retorna à primeira página; ENTER nos filtros textuais aciona a mesma consulta quando habilitada.</li></ul> |
| <strong>Limpar</strong> | <ul><li><strong>Label:</strong> “Limpar”.</li><li><strong>Tipo:</strong> Ação secundária.</li><li><strong>Componente SIAGE-UI:</strong> SFilterCardComponent (s-filter-card: clear); a aplicação restaura os valores iniciais.</li><li><strong>Comportamentos:</strong> Esvazia três campos textuais, redefine os três selects para Todos, recupera a listagem completa e a primeira página.</li></ul> |
### 5.3 Listagem de setores

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Listagem</strong> | <ul><li><strong>Tipo:</strong> Tabela paginada de consulta.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: columns, rows, sort, actions, page, pageSize, total e empty).</li><li><strong>Ordenação inicial:</strong> Nome do Setor em ordem alfabética crescente.</li><li><strong>Paginação:</strong> Até 10 registros por página.</li><li><strong>Comportamentos:</strong> Exibe setores elegíveis ao permissionamento, situação atualizada, dados de chefia e ações conforme autorização.</li></ul> |
| <strong>Nome do Setor</strong> | <ul><li><strong>Label:</strong> “Nome do Setor”.</li><li><strong>Tipo:</strong> Coluna textual ordenável.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent com STableCellDirective (sTableCell) e STableColumn.</li><li><strong>Apresentação:</strong> Tipificação do setor em linha superior e Nome do Setor na linha seguinte.</li><li><strong>Comportamentos:</strong> Tipificação pode ser Secretaria Geral, Secretaria Executiva, Gerência Executiva, Gerência Regional, Subgerência ou Núcleo. A ordenação por nome não usa a tipificação como chave primária.</li></ul> |
| <strong>Unidade de Trabalho</strong> | <ul><li><strong>Label:</strong> “Unidade de Trabalho”.</li><li><strong>Tipo:</strong> Coluna textual.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent / STableColumn.</li><li><strong>Apresentação:</strong> Somente Código UTB, sem concatenar o nome.</li><li><strong>Comportamentos:</strong> Consulta o código da unidade atribuída ao setor na Hierarquia.</li></ul> |
| <strong>Chefia Imediata</strong> | <ul><li><strong>Label:</strong> “Chefia Imediata”.</li><li><strong>Tipo:</strong> Coluna informativa.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent com STableCellDirective; SBadgeComponent para status inativo.</li><li><strong>Apresentação:</strong> Nome do chefe e Matrícula em linha inferior; sem vínculo, “Sem Chefe Definido”.</li><li><strong>Comportamentos:</strong> Chefia inativa ou indisponível permanece visível com badge “Inativo” em cinza; chefia ativa aparece sem badge de inatividade.</li></ul> |
| <strong>Aprovador de Exceção</strong> | <ul><li><strong>Label:</strong> “Aprovador de Exceção”.</li><li><strong>Tipo:</strong> Coluna informativa.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent e STableCellDirective.</li><li><strong>Apresentação:</strong> Nome do aprovador vigente e Matrícula em linha inferior; sem vigente, “Sem exceção cadastrada”.</li><li><strong>Comportamentos:</strong> Não apresenta como vigente registro histórico encerrado ou substituído.</li></ul> |
| <strong>Tipo de Atuação</strong> | <ul><li><strong>Label:</strong> “Tipo de Atuação”.</li><li><strong>Tipo:</strong> Coluna textual.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent e STableCellDirective.</li><li><strong>Valores:</strong> “Sempre sobrepõe chefia”; “Suporte à chefia ausente”; “—” sem aprovador vigente.</li><li><strong>Comportamentos:</strong> Traduz a modalidade cadastrada da exceção, sem editar na tabela.</li></ul> |
| <strong>Situação</strong> | <ul><li><strong>Label:</strong> “Situação”.</li><li><strong>Tipo:</strong> Coluna de badge semântico.</li><li><strong>Componente SIAGE-UI:</strong> SBadgeComponent (s-badge) na STableComponent.</li><li><strong>Valores:</strong> Regular, Suprido, Descoberto e Necessita Troca.</li><li><strong>Regras:</strong> Classificação dinâmica conforme 4.2.4, com Necessita Troca prioritária quando aprovador vigente estiver inelegível/indisponível, mesmo havendo chefia ativa.</li><li><strong>Acessibilidade:</strong> Não depender apenas de cor; exibir texto da situação e descrição do motivo em tooltip quando houver Necessita Troca.</li></ul> |
| <strong>Ações</strong> | <ul><li><strong>Label:</strong> “Ações”.</li><li><strong>Tipo:</strong> Coluna de IconButtons.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: actions e actionClick; STableAction), com ações Visualizar e Editar/Configurar.</li><li><strong>Comportamentos:</strong> Permite acesso aos dados do setor conforme autorização, sem manutenção diretamente na tabela.</li></ul> |
| <strong>Visualizar</strong> | <ul><li><strong>Label:</strong> “Visualizar”.</li><li><strong>Tipo:</strong> IconButton com ícone de visualização.</li><li><strong>Componente SIAGE-UI:</strong> STableAction (icon visibility) e STableComponent.</li><li><strong>Tooltip:</strong> “Visualizar”.</li><li><strong>Comportamentos:</strong> Abre o registro em consulta somente leitura na RF002, independentemente de haver aprovador vigente.</li></ul> |
| <strong>Editar / Configurar</strong> | <ul><li><strong>Labels:</strong> “Editar aprovador de exceção” para setor com designação vigente; “Configurar aprovador de exceção” para setor sem designação vigente.</li><li><strong>Tipo:</strong> IconButton com ícone de edição.</li><li><strong>Componente SIAGE-UI:</strong> STableAction (icon edit) e STableComponent.</li><li><strong>Visibilidade:</strong> Somente para quem pode configurar ou editar a exceção do setor.</li><li><strong>Comportamentos:</strong> Abre a RF002 em modo de manutenção correspondente ao estado vigente do setor.</li></ul> |
| <strong>Paginação</strong> | <ul><li><strong>Tipo:</strong> Controles de navegação da tabela.</li><li><strong>Componente SIAGE-UI:</strong> Paginação integrada ao STableComponent (s-table: page, pageSize e total).</li><li><strong>Tamanho:</strong> Até 10 registros por página.</li><li><strong>Comportamentos:</strong> Navega entre páginas sem perder os filtros. Aplicar nova busca, limpar ou alterar ordenação retorna à primeira página.</li></ul> |
### 5.4 Situações e regras de apresentação

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Regular</strong> | <ul><li><strong>Condição:</strong> Chefia Imediata ativa e ausência de aprovador vigente inelegível ou operacionalmente indisponível.</li><li><strong>Componente SIAGE-UI:</strong> SBadgeComponent (tone success).</li><li><strong>Apresentação:</strong> “Regular”, em verde.</li><li><strong>Comportamentos:</strong> Permanece Regular mesmo com aprovador vigente, desde que ele seja elegível e disponível.</li></ul> |
| <strong>Suprido</strong> | <ul><li><strong>Condição:</strong> Sem Chefia Imediata ativa e com Aprovador de Exceção vigente, elegível e disponível.</li><li><strong>Componente SIAGE-UI:</strong> SBadgeComponent (tone info).</li><li><strong>Apresentação:</strong> “Suprido”.</li><li><strong>Comportamentos:</strong> Identifica setor coberto pela exceção apesar da chefia inexistente ou inativa.</li></ul> |
| <strong>Descoberto</strong> | <ul><li><strong>Condição:</strong> Sem Chefia Imediata ativa e sem Aprovador de Exceção vigente.</li><li><strong>Componente SIAGE-UI:</strong> SBadgeComponent (tone destructive).</li><li><strong>Apresentação:</strong> “Descoberto”, em vermelho.</li><li><strong>Comportamentos:</strong> Não confundir com setores que possuam aprovador vigente indisponível; estes serão classificados como Necessita Troca.</li></ul> |
| <strong>Necessita Troca</strong> | <ul><li><strong>Condição:</strong> Aprovador de Exceção vigente com situação funcional fora dos códigos 10/25/31/22 ou com indisponibilidade operacional vigente.</li><li><strong>Componente SIAGE-UI:</strong> SBadgeComponent (tone warning), com STooltipDirective.</li><li><strong>Apresentação:</strong> “Necessita Troca”, em amarelo.</li><li><strong>Comportamentos:</strong> Tem precedência sobre todas as outras situações, inclusive quando há Chefia Imediata ativa.</li></ul> |
### 5.5 Estados da listagem

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Sem setores cadastrados</strong> | <ul><li><strong>Tipo:</strong> Estado vazio da tabela sem dados de origem.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: empty) e estado vazio de consulta.</li><li><strong>Mensagem:</strong> “Nenhum setor cadastrado na Hierarquia de Unidades e Cargos.”</li><li><strong>Comportamentos:</strong> Apresenta quando nenhum setor estiver disponível para o usuário, antes da aplicação de filtros.</li></ul> |
| <strong>Nenhum resultado</strong> | <ul><li><strong>Tipo:</strong> Estado sem correspondências.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: empty).</li><li><strong>Título:</strong> “Nenhum setor encontrado”.</li><li><strong>Mensagem:</strong> “Nenhum setor corresponde aos critérios de busca selecionados.”</li><li><strong>Comportamentos:</strong> Mantém os filtros e permite Limpar ou alterar a pesquisa; não exibe toast por ausência de correspondência.</li></ul> |
| <strong>Carregamento</strong> | <ul><li><strong>Tipo:</strong> Estado transitório da consulta.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: loading), com apresentação de skeleton.</li><li><strong>Comportamentos:</strong> Impede ações sobre resultados não carregados e preserva os critérios informados.</li></ul> |
| <strong>Falha ao consultar</strong> | <ul><li><strong>Tipo:</strong> Estado de falha de requisição.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: empty com variant error e emptyAction) e SToastService (error), quando aplicável.</li><li><strong>Mensagem:</strong> “Não foi possível concluir a solicitação. Tente novamente.”</li><li><strong>Comportamentos:</strong> Não altera filtros nem registros e permite nova tentativa de consulta.</li></ul> |
| <strong>Acesso restrito</strong> | <ul><li><strong>Tipo:</strong> Estado de permissão negada.</li><li><strong>Componente SIAGE-UI:</strong> Implementação própria da aplicação: AcessoRestritoComponent (app-acesso-restrito).</li><li><strong>Comportamentos:</strong> Bloqueia consulta e ações quando o usuário não tiver permissão.</li></ul> |
## 6) Toast

| Toast | Quando exibir | Título/Mensagem | Ações/Regras | Imagens |
| --- | --- | --- | --- | --- |
| <strong>Erro genérico de requisição</strong> | Quando a consulta falhar sem mensagem funcional específica. | <strong>Título:</strong> “Não foi possível concluir a solicitação.”<br><strong>Mensagem:</strong> “Tente novamente.” | <ul><li><strong>Componente SIAGE-UI:</strong> SToastService (error).</li><li><strong>Comportamentos:</strong> Apresenta falha sem dados técnicos; preserva filtros e setor de origem, permitindo nova tentativa.</li></ul> |   |

## 7) Protótipos

| Protótipo |
| --- |
| <strong>Exceção de Hierarquia — listagem com situações e filtros</strong> |
|   |
| <strong>Exceção de Hierarquia — filtros preenchidos e sem resultados</strong> |
|   |
| <strong>Exceção de Hierarquia — Chefia Imediata inativa e Necessita Troca</strong> |
|   |
| <strong>Exceção de Hierarquia — ações Visualizar e Editar/Configurar</strong> |
|   |

## 8) Lacunas da biblioteca SIAGE-UI

Não foi identificada lacuna de componente para os filtros, tabela, indicadores, navegação ou ações desta funcionalidade. A aplicação controla a combinação e o estado inicial dos filtros, a ordenação, a paginação e o cálculo das situações. A pré-visualização de PDF ou imagem não é requisito desta RF.
