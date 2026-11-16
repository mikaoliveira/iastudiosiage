# [RF001] Listar / Inativar - Configurar Gerência Regional

## 1) Histórico

| Data | Versão | Descrição | Autor | Versão mind | Sprint de desenvolvimento |
| --- | --- | --- | --- | --- | --- |
| 16 de nov. de 2026 | 1.0 | Criação da funcionalidade | A definir | 01 | A definir |

## 2) História de Usuário

Eu, como usuário do SIAGE-RH, na qualidade de Administrador ou usuário com permissão de acesso,

Quero acessar a funcionalidade de Listar Gerência Regional,

Para consultar os registros cadastrados e executar as ações permitidas conforme minhas permissões.

## 3) Fluxo de acesso à funcionalidade

Login >> Selecionar Matrícula, quando aplicável >> Página Inicial >> Configurações >> Hierarquia de Unidades e Cargos >> Configurar Gerência Regional

**Pré-condições:**

- O usuário deverá estar autenticado no SIAGE-RH e possuir matrícula ativa em contexto, quando aplicável.
- O usuário deverá possuir permissão de acesso a Configurar Gerência Regional ou perfil Administrador.

## 4) Critérios de Aceite

### 4.1 Acesso e permissões

- O acesso deverá ser permitido ao Administrador e aos usuários com permissão específica para Listar / Inativar Gerência Regional.
- O sistema deverá verificar a permissão antes de disponibilizar dados e ações da funcionalidade; o perfil Administrador seguirá as regras gerais de permissionamento.
- A tentativa de acesso direto sem permissão deverá apresentar a tela global de “Acesso restrito”, sem expor dados protegidos.

### 4.2 Regras gerais

#### 4.2.1 Estrutura e apresentação da tela

- A tela deverá apresentar breadcrumbs navegáveis, Voltar, título “Configurar Gerência Regional”, descrição curta, ação Adicionar, filtros e tabela de resultados.
- Os filtros deverão apresentar Nome, Unidade de Trabalho (UTB) e Status; a tabela, nessa ordem, Nome da Gerência Regional, Unidade de Trabalho (UTB), Criador/Editor, Data de Criação, Status e Ações.
- Ações por registro: Visualizar, Editar e Ativar/Inativar, conforme permissões; não disponibilizar Excluir nesta listagem.
- A interface deverá seguir os padrões de acessibilidade definidos nas Padronizações do SIAGE-RH e os comportamentos acessíveis disponibilizados pelos componentes da biblioteca SIAGE-UI. Particularidades deverão ser especificadas no detalhamento dos respectivos elementos.

#### 4.2.2 Pesquisa, ordenação e paginação

- Permitir pesquisa por Nome, por UTB e/ou Status. Nome admite pesquisa parcial, até 200 caracteres, sem diferenciar maiúsculas/minúsculas.
- O filtro de UTB deverá apresentar apenas UTBs dos registros de Gerência Regional cadastrados, no formato Código + Nome, ordenadas pelo código crescente; não se confunde com as UTBs disponíveis para novo cadastro.
- Status deverá oferecer Todos, Ativo e Inativo, iniciando em Todos. Buscar permanece desabilitado sem critério diferente do estado inicial; pressionar ENTER com critérios executa a mesma pesquisa.
- Limpar repõe os filtros originais, a listagem completa e a primeira página.
- Iniciar a listagem ordenada pela Data de Criação mais recente; permitir alternância de ordenação em Nome, UTB e Data de Criação. Paginar com até 10 registros por página.

#### 4.2.3 Ações da listagem

- Adicionar permite iniciar o cadastro quando o usuário possuir permissão; o sistema admite o cadastro de mais de uma Gerência Regional ativa.
- Visualizar abre a consulta do registro ativo ou inativo. Editar ficará disponível apenas quando houver permissão e o registro estiver ativo.
- O SlideToggle deverá indicar a situação efetiva; o clique não deverá antecipar visualmente a alteração de status. Registros inativos não poderão ser reativados.
- Ao solicitar inativação de registro ativo, apresentar primeiro “Inativar registro?” e, se confirmado, verificar Chefia Imediata, Núcleos e Escolas vinculados, profissionais vinculados ao registro e Normativa de Extinção.

#### 4.2.4 Regras específicas de inativação

- A inativação somente poderá ser concluída quando não houver Chefe Imediato vinculado, não existirem Núcleos ou Escolas subordinados nem profissionais vinculados ao registro, e houver Normativa de Extinção anexada.
- Se houver impedimentos por Chefia Imediata, Núcleos, Escolas e/ou profissionais vinculados, apresentar “Não é possível inativar”, informando somente os impedimentos encontrados e as orientações para resolvê-los; quando disponíveis, indicar o nome do chefe, a quantidade de unidades subordinadas e a quantidade de profissionais vinculados.
- Sem impedimentos, mas com Normativa de Extinção ausente, abrir “Anexar Normativa de Extinção”; Nome, Número, Data da Publicação e arquivo serão obrigatórios. Aceitar PDF, JPG, JPEG ou PNG de até 10 MB.
- Concluída a anexação válida, inativar sem solicitar segunda confirmação. Se a normativa já existir, concluir diretamente após a confirmação inicial.
- Cancelar ou fechar qualquer etapa deverá manter o status original. A inativação será irreversível; tentativa de ativar registro inativo exibirá toast de impossibilidade.

#### 4.2.5 Estados da listagem e feedback

- Sem registros, apresentar “Nenhum registro cadastrado” e “Ainda não existem gerências regionais cadastradas.”.
- Sem correspondência aos filtros, apresentar “Nenhum resultado encontrado” e “Nenhum registro corresponde aos filtros aplicados.”.
- Durante o carregamento, exibir skeleton no formato da tabela. Na falha, apresentar “Erro ao carregar dados”, mensagem orientativa e ação “Tentar novamente”.

## 5) Detalhamento da funcionalidade

### 5.1 Cabeçalho e navegação

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Breadcrumbs</strong> | <ul><li><strong>Tipo:</strong> Navegação contextual.</li><li><strong>Componente SIAGE-UI:</strong> SPageHeaderComponent (s-page-header: breadcrumbs).</li><li><strong>Exibição:</strong> Início / Configurações / Hierarquia de Unidades e Cargos / Configurar Gerência Regional.</li><li><strong>Comportamentos:</strong><ul><li>Os níveis anteriores deverão ser navegáveis e o último nível representará a página atual.</li></ul></li></ul> |
| <strong>Voltar</strong> | <ul><li><strong>Label:</strong> “Voltar”.</li><li><strong>Tipo:</strong> IconButton.</li><li><strong>Componente SIAGE-UI:</strong> SPageHeaderComponent (s-page-header: showBack).</li><li><strong>Formato:</strong> Ação secundária.</li><li><strong>Habilitação:</strong> Sempre disponível.</li><li><strong>Comportamentos:</strong><ul><li>Retorna ao menu Hierarquia de Unidades e Cargos.</li></ul></li></ul> |
| <strong>Título e descrição</strong> | <ul><li><strong>Título:</strong> “Configurar Gerência Regional”.</li><li><strong>Tipo:</strong> Título de página e texto descritivo.</li><li><strong>Componente SIAGE-UI:</strong> SPageHeaderComponent (s-page-header: title e description).</li><li><strong>Descrição:</strong> “Gerencie as Gerências Regionais vinculadas à Secretaria Geral, a vinculação de chefia e suas normativas.”</li><li><strong>Comportamentos:</strong><ul><li>Apresenta o contexto da funcionalidade no cabeçalho da página.</li></ul></li></ul> |
| <strong>Adicionar</strong> | <ul><li><strong>Label:</strong> “Adicionar”.</li><li><strong>Tipo:</strong> Button.</li><li><strong>Componente SIAGE-UI:</strong> SButtonComponent (s-button: variant primary, icon add) e STooltipDirective (sTooltip).</li><li><strong>Formato:</strong> Ação primária.</li><li><strong>Visibilidade:</strong> Conforme permissão de Adicionar Gerência Regional.</li><li><strong>Habilitação:</strong> Somente com permissão; não há limite de um registro ativo.</li><li><strong>Tooltip:</strong> “Adicionar nova Gerência Regional”.</li><li><strong>Comportamentos:</strong><ul><li>Direciona para RF002 — Adicionar Gerência Regional; ausência de permissão impede acesso à ação.</li></ul></li></ul> |

### 5.2 Filtros da listagem

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Bloco de filtros</strong> | <ul><li><strong>Tipo:</strong> Grupo de filtros.</li><li><strong>Componente SIAGE-UI:</strong> SFilterCardComponent (s-filter-card), com SFieldComponent, SInputComponent, SAutocompleteComponent, SSelectComponent e ações integradas de busca/limpeza.</li><li><strong>Comportamentos:</strong><ul><li>Agrupa Nome, Unidade de Trabalho (UTB), Status, Limpar e Buscar; mantém os filtros separados da tabela.</li></ul></li></ul> |
| <strong>Nome</strong> | <ul><li><strong>Label:</strong> “Nome”.</li><li><strong>Tipo:</strong> Campo de texto alfanumérico e caracteres especiais.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field) e SInputComponent (s-input: maxlength 200).</li><li><strong>Obrigatoriedade:</strong> Opcional.</li><li><strong>Placeholder:</strong> “Digite o Nome”.</li><li><strong>Limite de caracteres:</strong> 200.</li><li><strong>Comportamentos:</strong><ul><li>Aceita busca parcial por nome de Gerência Regional, sem diferenciar letras maiúsculas de minúsculas.</li></ul></li></ul> |
| <strong>Unidade de Trabalho (UTB) — filtro</strong> | <ul><li><strong>Label:</strong> “Unidade de Trabalho (UTB)”.</li><li><strong>Tipo:</strong> Select com autocomplete.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field) e SAutocompleteComponent (s-autocomplete)</li><li><strong>Obrigatoriedade:</strong> Opcional.</li><li><strong>Placeholder:</strong> “Selecione ou busque uma unidade de trabalho”.</li><li><strong>Opções:</strong> UTBs vinculadas às Gerências Regionais cadastradas, exibidas como Código + Nome, ordenadas pelo código crescente.</li><li><strong>Comportamentos:</strong><ul><li>Pesquisa as UTBs pelo código ou nome; o filtro não apresenta todas as UTBs da base de profissionais.</li></ul></li></ul> |
| <strong>Status</strong> | <ul><li><strong>Label:</strong> “Status”.</li><li><strong>Tipo:</strong> Select.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field) e SSelectComponent (s-select).</li><li><strong>Obrigatoriedade:</strong> Opcional.</li><li><strong>Opções:</strong> Todos, Ativo, Inativo.</li><li><strong>Valor inicial:</strong> Todos.</li><li><strong>Comportamentos:</strong><ul><li>Permite restringir os resultados por situação cadastral; limpar retorna a Todos.</li></ul></li></ul> |
| <strong>Buscar</strong> | <ul><li><strong>Label:</strong> “Buscar”.</li><li><strong>Tipo:</strong> Ação de pesquisa do filtro.</li><li><strong>Componente SIAGE-UI:</strong> SFilterCardComponent (s-filter-card: search), com SButtonComponent (s-button).</li><li><strong>Formato:</strong> Ação primária.</li><li><strong>Habilitação:</strong> Somente quando pelo menos um filtro diferir do estado inicial.</li><li><strong>Comportamentos:</strong><ul><li>Executa a consulta conforme critérios informados; ENTER com critério válido equivale a Buscar; retorna à primeira página.</li></ul></li></ul> |
| <strong>Limpar</strong> | <ul><li><strong>Label:</strong> “Limpar”.</li><li><strong>Tipo:</strong> Ação de limpeza do filtro.</li><li><strong>Componente SIAGE-UI:</strong> SFilterCardComponent (s-filter-card: clear), com SButtonComponent (s-button).</li><li><strong>Formato:</strong> Ação secundária.</li><li><strong>Comportamentos:</strong><ul><li>Limpa Nome e UTB, restaura Status=Todos, todos os registros e a primeira página.</li></ul></li></ul> |

### 5.3 Listagem de Gerências Regionais

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Listagem</strong> | <ul><li><strong>Tipo:</strong> Tabela paginada.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: columns, rows, sort, actions, loading, empty e paginação).</li><li><strong>Paginação:</strong> Até 10 registros por página.</li><li><strong>Ordenação inicial:</strong> Data de Criação decrescente.</li><li><strong>Comportamentos:</strong><ul><li>Apresenta as Gerências Regionais conforme filtros e ordenação; permite alternar a ordenação nas colunas previstas.</li><li>Apresenta skeleton durante o carregamento; vazio e erro seguem a seção 5.5.</li></ul></li></ul> |
| <strong>Nome da Gerência Regional</strong> | <ul><li><strong>Label:</strong> “Nome da Gerência Regional”.</li><li><strong>Tipo:</strong> Coluna textual de listagem.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn)</li><li><strong>Ordenação:</strong> Crescente e decrescente.</li><li><strong>Comportamentos:</strong><ul><li>Exibe o nome cadastrado do registro.</li></ul></li></ul> |
| <strong>Unidade de Trabalho (UTB)</strong> | <ul><li><strong>Label:</strong> “Unidade de Trabalho (UTB)”.</li><li><strong>Tipo:</strong> Coluna textual de listagem.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn)</li><li><strong>Ordenação:</strong> Crescente e decrescente.</li><li><strong>Comportamentos:</strong><ul><li>Exibe a UTB vinculada no formato Código + Nome.</li></ul></li></ul> |
| <strong>Criador/Editor</strong> | <ul><li><strong>Label:</strong> “Criador/Editor”.</li><li><strong>Tipo:</strong> Coluna textual de listagem.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn)</li><li><strong>Comportamentos:</strong><ul><li>Exibe o responsável pela criação ou última edição.</li></ul></li></ul> |
| <strong>Data de Criação</strong> | <ul><li><strong>Label:</strong> “Data de Criação”.</li><li><strong>Tipo:</strong> Coluna textual de listagem.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn)</li><li><strong>Ordenação:</strong> Crescente e decrescente.</li><li><strong>Comportamentos:</strong><ul><li>Exibe data/hora do cadastro conforme dado registrado.</li></ul></li></ul> |
| <strong>Status</strong> | <ul><li><strong>Label:</strong> “Status”.</li><li><strong>Tipo:</strong> Coluna textual de listagem.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn)</li><li><strong>Comportamentos:</strong><ul><li>Exibe badge “Ativo” ou “Inativo” correspondente à situação efetiva.</li></ul></li></ul> |
| <strong>Ações</strong> | <ul><li><strong>Label:</strong> “Ações”.</li><li><strong>Tipo:</strong> Última coluna da tabela.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: actions; configuração STableAction), com SSwitchComponent (s-switch) no template da ação de situação.</li><li><strong>Comportamentos:</strong><ul><li>Apresenta Visualizar e Editar, além de switch Ativar/Inativar conforme a permissão.</li></ul></li></ul> |
| <strong>Visualizar</strong> | <ul><li><strong>Label:</strong> “Visualizar”.</li><li><strong>Tipo:</strong> IconButton na tabela.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableAction: view, visibility).</li><li><strong>Tooltip:</strong> “Visualizar Gerência Regional”.</li><li><strong>Comportamentos:</strong><ul><li>Encaminha à RF003 — Visualizar Gerência Regional; permite consultar registros ativos ou inativos.</li></ul></li></ul> |
| <strong>Editar</strong> | <ul><li><strong>Label:</strong> “Editar”.</li><li><strong>Tipo:</strong> IconButton na tabela.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableAction: edit).</li><li><strong>Tooltip:</strong> “Editar Gerência Regional”.</li><li><strong>Visibilidade:</strong> Usuário com permissão de edição e registro ativo.</li><li><strong>Comportamentos:</strong><ul><li>Encaminha à RF004 — Editar Gerência Regional. A ação não deverá ser disponibilizada para registro inativo.</li></ul></li></ul> |
| <strong>Ativar/Inativar</strong> | <ul><li><strong>Label:</strong> “Ativar/Inativar”.</li><li><strong>Tipo:</strong> SlideToggle.</li><li><strong>Componente SIAGE-UI:</strong> SSwitchComponent (s-switch), utilizado na coluna Ações.</li><li><strong>Habilitação:</strong> Conforme permissão da ação.</li><li><strong>Aria-label:</strong> “Inativar Gerência Regional” ou “Ativar Gerência Regional”, conforme situação.</li><li><strong>Comportamentos:</strong><ul><li>No registro ativo, inicia a confirmação sem alternar antecipadamente o switch; após sucesso, apresenta situação inativa.</li><li>No registro inativo, não reativa e apresenta toast explicativo.</li></ul></li></ul> |
| <strong>Paginação</strong> | <ul><li><strong>Tipo:</strong> Controle de paginação da tabela.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: page, pageSize, total e eventos de paginação).</li><li><strong>Paginação:</strong> Até 10 registros por página.</li><li><strong>Comportamentos:</strong><ul><li>Exibe total, faixa de registros e controles de página; reinicia a primeira página em pesquisa/limpeza e mudança de quantidade por página.</li></ul></li></ul> |

### 5.4 Ações e regras de inativação

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Confirmação de inativação</strong> | <ul><li><strong>Tipo:</strong> Modal de confirmação.</li><li><strong>Componente SIAGE-UI:</strong> SModalService (confirm).</li><li><strong>Título:</strong> “Inativar registro?”.</li><li><strong>Comportamentos:</strong><ul><li>Solicita confirmação antes de executar verificações de impedimento; Cancelar/X mantém o registro ativo.</li></ul></li></ul> |
| <strong>Verificação de impedimentos</strong> | <ul><li><strong>Tipo:</strong> Validação funcional da operação.</li><li><strong>Componente SIAGE-UI:</strong> SModalService e modal de impedimento, conforme padronização.</li><li><strong>Comportamentos:</strong><ul><li>Impedir inativação quando houver Chefia Imediata, Núcleos e/ou Escolas subordinados ou profissionais vinculados ao registro.</li><li>O modal apresentará apenas os impedimentos efetivos e orientações de regularização, incluindo nome da chefia e quantidades de unidades e profissionais quando disponíveis.</li></ul></li></ul> |
| <strong>Anexação da Normativa de Extinção</strong> | <ul><li><strong>Tipo:</strong> Etapa condicional da operação.</li><li><strong>Componente SIAGE-UI:</strong> Modal de anexação acionado por SModalService, com campos e SFileUploadComponent.</li><li><strong>Comportamentos:</strong><ul><li>Sem impedimentos, mas faltando documento de extinção, solicitar Nome, Número, Data da Publicação e arquivo antes de concluir.</li><li>Número da Normativa: apenas dígitos, até 100 caracteres, sem contador; data no formato DD/MM/AAAA, com calendário sem datas futuras.</li><li>Aceita PDF, JPG, JPEG e PNG, com máximo de 10 MB.</li><li>Cancelar a anexação não altera o status.</li></ul></li></ul> |
| <strong>Tentar novamente</strong> | <ul><li><strong>Label:</strong> “Tentar novamente”.</li><li><strong>Tipo:</strong> Ação no estado de erro da tabela.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: empty, variant error, actionLabel), com SEmptyStateComponent (s-empty-state).</li><li><strong>Comportamentos:</strong><ul><li>Reexecuta o carregamento da listagem depois de erro, mantendo o contexto apropriado.</li></ul></li></ul> |

### 5.5 Estados da listagem

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Sem registros</strong> | <ul><li><strong>Tipo:</strong> Estado vazio da tabela.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: empty, variant no-data) e SEmptyStateComponent (s-empty-state).</li><li><strong>Título:</strong> “Nenhum registro cadastrado”.</li><li><strong>Mensagem:</strong> “Ainda não existem gerências regionais cadastradas.”</li><li><strong>Comportamentos:</strong><ul><li>Exibe quando não existir Gerência Regional cadastrada.</li></ul></li></ul> |
| <strong>Sem resultados</strong> | <ul><li><strong>Tipo:</strong> Estado de filtro sem correspondência.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: empty, variant no-results) e SEmptyStateComponent (s-empty-state).</li><li><strong>Título:</strong> “Nenhum resultado encontrado”.</li><li><strong>Mensagem:</strong> “Nenhum registro corresponde aos filtros aplicados.”</li><li><strong>Comportamentos:</strong><ul><li>Exibe quando os filtros informados não retornarem registros; pode oferecer Limpar filtros.</li></ul></li></ul> |
| <strong>Carregamento</strong> | <ul><li><strong>Tipo:</strong> Estado de espera da listagem.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: loading).</li><li><strong>Comportamentos:</strong><ul><li>Exibe skeleton no formato da tabela até concluir o carregamento.</li></ul></li></ul> |
| <strong>Erro ao carregar</strong> | <ul><li><strong>Tipo:</strong> Estado de falha da listagem.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: empty, variant error) e SEmptyStateComponent (s-empty-state).</li><li><strong>Título:</strong> “Erro ao carregar dados”.</li><li><strong>Mensagem:</strong> “Não foi possível carregar as informações desta funcionalidade. Verifique sua conexão e tente novamente.”</li><li><strong>Comportamentos:</strong><ul><li>Oferece a ação “Tentar novamente”.</li></ul></li></ul> |

## 6) Modais

| Modal | Quando exibir | Título/Mensagem | Ações/Regras | Imagens |
| --- | --- | --- | --- | --- |
| <strong>6.1 Confirmação de inativação</strong> | Ao acionar Inativar em registro ativo. | Título: “Inativar registro?”. Mensagem: “Deseja inativar {Nome da Gerência Regional}? A inativação é irreversível e o registro não poderá ser reativado.” | <ul><li><strong>Cancelar / X:</strong><ul><li>Fecha o modal e preserva status e posição do switch.</li></ul></li><li><strong>Sim, inativar:</strong><ul><li>Confirma a intenção e inicia as verificações de chefia, Núcleos, Escolas, profissionais vinculados e Normativa de Extinção.</li></ul></li></ul> |  |
| <strong>6.2 Impedimento de inativação</strong> | Após confirmar, quando houver Chefe Imediato, Núcleos ou Escolas subordinados e/ou profissionais vinculados. | Título: “Não é possível inativar”. | <ul><li><strong>Impedimentos identificados:</strong><ul><li>Informar somente os bloqueios existentes: Chefia Imediata vinculada, Núcleos e/ou Escolas subordinados e profissionais vinculados, conforme cada caso.</li><li>Exibir o nome do Chefe Imediato e as quantidades de Núcleos/Escolas e de profissionais vinculados, quando disponíveis.</li><li>Orientar a remoção/desvinculação dos impedimentos antes de nova tentativa.</li></ul></li><li><strong>Fechar / X:</strong><ul><li>Encerra o modal sem alterar a situação do registro.</li></ul></li></ul> |  |
| <strong>6.3 Anexar Normativa de Extinção</strong> | Após confirmação inicial, quando não houver impedimentos, mas ainda faltar Normativa de Extinção. | Título: “Anexar Normativa de Extinção”. | <ul><li><strong>Nome da Normativa:</strong><ul><li>Obrigatório; até 100 caracteres.</li></ul></li><li><strong>Número da Normativa:</strong><ul><li>Obrigatório; somente dígitos, até 100 caracteres, sem contador.</li></ul></li><li><strong>Data da Publicação:</strong><ul><li>Obrigatória; DD/MM/AAAA; calendário não permite datas futuras.</li></ul></li><li><strong>Documento:</strong><ul><li>Obrigatório; PDF, JPG, JPEG ou PNG até 10 MB; habilitado após dados válidos.</li></ul></li><li><strong>Cancelar / X:</strong><ul><li>Descarta a etapa e mantém o registro ativo.</li></ul></li><li><strong>Confirmar:</strong><ul><li>Conclui a inativação se os dados estiverem válidos, sem uma nova confirmação geral.</li></ul></li></ul> |  |
| <strong>6.4 Visualizar anexo</strong> | Quando for utilizada a ação de pré-visualização de documento no fluxo de anexação. | Título: “Visualizar anexo”. | <ul><li><strong>Pré-visualização:</strong><ul><li>PDF ou imagem, sem edição; aplica-se LAC-001 da biblioteca SIAGE-UI.</li></ul></li><li><strong>Baixar arquivo:</strong><ul><li>Disponibiliza o documento original, sem toast de início.</li></ul></li><li><strong>Fechar / X:</strong><ul><li>Retorna à etapa de anexação, mantendo os dados preenchidos.</li></ul></li></ul> |  |

## 7) Toast

| Toast | Quando exibir | Título/Mensagem | Ações/Regras | Imagens |
| --- | --- | --- | --- | --- |
| <strong>Registro inativado</strong> | Após concluir a inativação com todos os requisitos atendidos. | Título: “Registro inativado com sucesso.” Mensagem: Não se aplica. | <ul><li><strong>Componente SIAGE-UI:</strong><ul><li>SToastService (success).</li></ul></li><li><strong>Ações/Regras:</strong><ul><li>Atualiza status/posição do switch e conserva a inativação como irreversível.</li></ul></li></ul> |  |
| <strong>Impossibilidade de reativação</strong> | Ao tentar ativar Gerência Regional inativa. | Título: “A inativação de uma Gerência Regional é irreversível. O registro não pode ser reativado.” Mensagem: Não se aplica. | <ul><li><strong>Componente SIAGE-UI:</strong><ul><li>SToastService (warning).</li></ul></li><li><strong>Ações/Regras:</strong><ul><li>Não altera a situação do registro nem movimenta o switch.</li></ul></li></ul> |  |
| <strong>Erro genérico de requisição</strong> | Quando a operação falhar sem mensagem funcional específica. | Título: “Não foi possível concluir a solicitação.” Mensagem: “Tente novamente.” | <ul><li><strong>Componente SIAGE-UI:</strong><ul><li>SToastService (error).</li></ul></li><li><strong>Ações/Regras:</strong><ul><li>Aplica o padrão global de erro; preserva a situação efetiva do registro.</li></ul></li></ul> |  |

## 8) Protótipos

| Protótipo |
| --- |
| <strong>Listar Gerência Regional — com registros e filtros</strong> |
|  |
| <strong>Listar Gerência Regional — sem registros e sem resultado</strong> |
|  |
| <strong>Inativar registro — confirmação e impedimentos</strong> |
|  |
| <strong>Anexar Normativa de Extinção — operação de inativação</strong> |
|  |

## 9) Lacunas da biblioteca SIAGE-UI

Aplica-se a LAC-001 já documentada no módulo para a pré-visualização de PDF e imagens quando exigida no fluxo de anexação. Nenhuma nova lacuna é identificada nesta RF.

| Identificador | Elemento da RF | Necessidade não atendida | Referência na RF |
| --- | --- | --- | --- |
| LAC-001 (referência existente) | Pré-visualização de PDFs e imagens. | A biblioteca SIAGE-UI não oferece visualizador dedicado de PDF/imagem; aplica-se a lacuna já documentada nas RFs de Hierarquia. | Seção 6 — Visualizar anexo. |
