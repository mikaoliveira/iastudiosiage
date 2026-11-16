# Cópia de \[RF001\] Listar / Inativar - Configurar Secretaria Geral

## 1) Histórico

| <strong>Data</strong> | <strong>Versão</strong> | <strong>Descrição</strong> | <strong>Autor</strong> | <strong>Versão mind</strong> | <strong>Sprint de desenvolvimento</strong> |
| --- | --- | --- | --- | --- | --- |
| 28 de out. de 2026 | 1.0 | Criação da funcionalidade | Mikael Oliveira | 01 | SPXXX |

## 2) História de Usuário

Eu, como usuário do SIAGE-RH, na qualidade de Administrador ou usuário com permissão de acesso,

Quero acessar a funcionalidade de Listar Secretaria Geral,

Para consultar os registros cadastrados e acessar suas ações de manutenção conforme minhas permissões.

## 3) Fluxo de acesso à funcionalidade

Login \>\> Selecionar Matrícula, quando aplicável \>\> Página Inicial \>\> Configurações \>\> Hierarquia de Unidades e Cargos \>\> Configurar Secretaria Geral

<strong>Pré-condições:</strong>

- O usuário deverá estar autenticado no SIAGE-RH e possuir matrícula ativa em contexto, quando aplicável.

- O usuário deverá possuir permissão específica para acessar Configurar Secretaria Geral ou perfil Administrador.

## 4) Critérios de Aceite

### 4.1 Acesso e permissões

- O acesso à funcionalidade deverá ser permitido ao Administrador e aos usuários com permissão específica para Configurar Secretaria Geral.

- O sistema deverá validar a permissão de acesso antes de carregar os dados e a interface da funcionalidade.

- Administradores terão acesso irrestrito à funcionalidade, independentemente das permissões específicas.

- As ações Adicionar, Visualizar, Editar e Inativar deverão respeitar as permissões correspondentes do usuário. Ações sem permissão não deverão ser disponibilizadas.

- A tentativa de acesso direto pela rota sem permissão deverá apresentar a tela global de “Acesso restrito”, sem carregar os dados protegidos da funcionalidade.

### 4.2 Regras gerais

#### 4.2.1 Estrutura e apresentação da tela

- A tela deverá apresentar breadcrumbs navegáveis, ação Voltar, título “Configurar Secretaria Geral”, descrição curta, ação principal Adicionar, bloco de filtros e tabela de resultados.

- O bloco de filtros deverá apresentar Nome, Unidade de Trabalho (UTB) e Status, com as ações Limpar e Buscar alinhadas à direita.

- A listagem deverá apresentar, nesta ordem, Nome da Secretaria Geral, Unidade de Trabalho (UTB), Criador/Editor, Data de Criação, Status e Ações.

- A coluna Status deverá exibir os badges “Ativo” e “Inativo”. A coluna Ações deverá permanecer como a última coluna.

- As ações disponíveis por registro são Visualizar, Editar e Ativar/Inativar. Não haverá ação Excluir nesta listagem.

- O botão Adicionar deverá permanecer desabilitado quando existir qualquer Secretaria Geral ativa, independentemente dos filtros aplicados.

- A interface deverá seguir os padrões de acessibilidade definidos nas Padronizações do SIAGE-RH e os comportamentos acessíveis disponibilizados pelos componentes da biblioteca SIAGE-UI. Particularidades deverão ser especificadas no detalhamento dos respectivos elementos.

#### 4.2.2 Pesquisa, ordenação e paginação

- A pesquisa deverá permitir consulta combinada por Nome e/ou Unidade de Trabalho (UTB) e/ou Status.

- O filtro Nome deverá aceitar parte da palavra, sem distinguir letras maiúsculas de minúsculas, respeitando o limite funcional de 200 caracteres.

- O filtro Unidade de Trabalho (UTB) deverá utilizar Select com autocomplete, exibindo somente as UTBs vinculadas às Secretarias Gerais cadastradas na listagem, e não todas as UTBs disponíveis no sistema. As opções deverão apresentar Código + Nome da UTB, em ordem crescente de código, permitindo pesquisa por código ou nome.

- O filtro Status deverá disponibilizar as opções “Todos”, “Ativo” e “Inativo”, iniciando em “Todos”.

- O botão Buscar deverá permanecer desabilitado quando Nome e Unidade de Trabalho (UTB) estiverem vazios e Status estiver definido como “Todos”. Deverá ser habilitado quando pelo menos um desses filtros for informado ou alterado em relação ao estado inicial. Ao acioná-lo, executará a pesquisa; pressionar ENTER nos campos de busca deverá produzir o mesmo comportamento, desde que exista ao menos um critério informado.

- O botão Limpar deverá limpar Nome e Unidade de Trabalho (UTB), redefinir Status como “Todos” e recarregar a listagem. Quando já estiverem limpos, a ação não deverá causar alteração adicional.

- A listagem deverá iniciar ordenada por Data de Criação em ordem decrescente. As colunas Nome da Secretaria Geral e Unidade de Trabalho (UTB) deverão permitir alternar entre ordenação crescente e decrescente.

- A paginação deverá apresentar no máximo 10 registros por página, atualizando a quantidade e a página após pesquisas e alterações de situação.

#### 4.2.3 Ações da listagem

- Adicionar deverá encaminhar para o cadastro de Secretaria Geral somente quando não existir Secretaria Geral ativa. Quando bloqueado, deverá apresentar tooltip informando que a anterior precisa ser inativada.

- Visualizar deverá encaminhar para a tela de visualização do registro selecionado.

- Editar deverá encaminhar para a tela de edição do registro ativo, observadas as permissões. Registros inativos não deverão disponibilizar a ação Editar.

- Ativar/Inativar deverá utilizar SlideToggle que reflete exclusivamente a situação efetiva do registro, sem alternância visual antecipada.

- Ao solicitar a inativação, o sistema deverá apresentar inicialmente o modal “Inativar registro?”. Cancelar ou fechar pelo X deverá preservar a situação vigente.

- Após confirmar, o sistema deverá verificar Chefia Imediata, vínculos com Secretarias Executivas e Gerências Regionais e existência da Normativa de Extinção.

- Uma vez concluída a inativação, a ação será irreversível; tentativas de ativação deverão ser bloqueadas com toast de impossibilidade de reativação.

#### 4.2.4 Regras específicas de inativação

- A inativação somente poderá ser concluída quando não houver Chefe Imediato vinculado, não existirem Secretarias Executivas ou Gerências Regionais subordinadas e houver Normativa de Extinção anexada.

- Quando houver Chefia Imediata e/ou unidades vinculadas, deverá ser apresentado o modal “Não é possível inativar”, contendo somente os impedimentos identificados e as orientações para resolvê-los.

- O impedimento por Chefia Imediata deverá orientar a remoção do vínculo, informando o nome do servidor quando disponível.

- O impedimento por unidades subordinadas deverá informar sua quantidade e orientar a desvinculação das Secretarias Executivas e Gerências Regionais.

- Se não houver chefia nem unidades subordinadas, mas faltar a Normativa de Extinção, o sistema deverá abrir o modal “Anexar Normativa de Extinção” durante o próprio fluxo.

- Na etapa de anexação, Nome da Normativa, Número da Normativa, Data da Publicação e arquivo serão obrigatórios. A seleção do arquivo somente poderá ser utilizada após o preenchimento válido dos demais campos.

- O documento deverá aceitar PDF, JPG, JPEG ou PNG, com tamanho máximo de 10 MB. Cancelar a anexação deverá manter o registro ativo.

- Quando todos os requisitos estiverem atendidos, o sistema deverá concluir a inativação sem solicitar uma segunda confirmação, atualizar o status e apresentar feedback de sucesso.

- Em impedimento, falha ou cancelamento, o switch deverá permanecer imóvel e representar o status original. Registros inativos não poderão ser reativados.

#### 4.2.5 Estados da listagem e feedback



Quando não houver registros cadastrados, exibir “Nenhum registro cadastrado” e “Ainda não existem secretarias gerais cadastradas.”. Quando os filtros não retornarem correspondências, exibir “Nenhum resultado encontrado” e “Nenhum registro corresponde aos filtros aplicados.”. Durante o carregamento, exibir skeleton no formato da tabela. Em falha de carregamento, exibir “Erro ao carregar dados”, a mensagem definida na seção  5.4 e a ação “Tentar novamente”.

## 5) Detalhamento da funcionalidade

### <strong>5.1 Cabeçalho e navegação</strong>

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Breadcrumbs</strong> | <ul><li><strong>Tipo:</strong> Navegação contextual.</li><li><strong>Componente SIAGE-UI:</strong> SPageHeaderComponent (s-page-header: breadcrumbs)</li><li><strong>Exibição:</strong> Início / Configurações / Hierarquia de Unidades e Cargos / Configurar Secretaria Geral.</li><li><strong>Comportamentos:</strong><ul><li>Deve representar a hierarquia de páginas reais da aplicação.</li><li>Início, Configurações e Hierarquia de Unidades e Cargos devem ser apresentados como níveis anteriores e ser navegáveis.</li><li>O último nível representa a página atual e não deve ser navegável.</li></ul></li></ul> |
| <strong>Voltar</strong> | <ul><li><strong>Label:</strong> “Voltar”.</li><li><strong>Tipo:</strong> IconButton.</li><li><strong>Componente SIAGE-UI:</strong> SPageHeaderComponent (s-page-header: showBack)</li><li><strong>Formato:</strong> Ação secundária.</li><li><strong>Habilitação:</strong> Sempre disponível.</li><li><strong>Aria-label:</strong> “Voltar”.</li><li><strong>Comportamentos:</strong> Retorna à página Hierarquia de Unidades e Cargos.</li></ul> |
| <strong>Título e descrição</strong> | <ul><li><strong>Título:</strong> “Configurar Secretaria Geral”.</li><li><strong>Tipo:</strong> Título de página e texto descritivo.</li><li><strong>Componente SIAGE-UI:</strong> SPageHeaderComponent (s-page-header: title e description)</li><li><strong>Descrição:</strong> “Gerencie o nível superior da estrutura organizacional do SIAGE-RH, a vinculação de chefia e suas normativas.”</li><li><strong>Comportamentos:</strong> Apresenta o contexto da funcionalidade no bloco inicial da tela.</li></ul> |
| <strong>Adicionar</strong> | <ul><li><strong>Label:</strong> “Adicionar”.</li><li><strong>Tipo:</strong> Button.</li><li><strong>Componente SIAGE-UI:</strong> SButtonComponent (s-button)</li><li><strong>Formato:</strong> Ação primária.</li><li><strong>Visibilidade:</strong> Somente quando o usuário possuir permissão para adicionar.</li><li><strong>Habilitação:</strong> Somente quando não existir Secretaria Geral ativa, independentemente dos filtros aplicados.</li><li><strong>Tooltip:</strong> “Já existe uma Secretaria Geral ativa. Para cadastrar uma nova, é necessário inativar a anterior.”</li><li><strong>Comportamentos:</strong><ul><li>Direciona para a funcionalidade de Adicionar Secretaria Geral.</li><li>Quando existir Secretaria Geral ativa, permanece desabilitado e não permite acessar o formulário.</li></ul></li></ul> |

### <strong>5.2 Bloco de filtros</strong>

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Bloco de filtros</strong> | <ul><li><strong>Tipo:</strong> Bloco de filtros.</li><li><strong>Componente SIAGE-UI:</strong> SFilterCardComponent (s-filter-card)</li><li><strong>Comportamentos:</strong><ul><li>Agrupa Nome, Unidade de Trabalho (UTB), Status, Limpar e Buscar.</li><li>Permanece visualmente separado da tabela de resultados.</li></ul></li></ul> |
| <strong>Nome</strong> | <ul><li><strong>Label:</strong> “Nome”.</li><li><strong>Tipo:</strong> Campo de texto alfanumérico.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field) e SInputComponent (s-input)</li><li><strong>Obrigatoriedade:</strong> Opcional.</li><li><strong>Placeholder:</strong> “Buscar por nome”.</li><li><strong>Limite de caracteres:</strong> 200.</li><li><strong>Comportamentos:</strong><ul><li>Aceita caracteres alfanuméricos e especiais.</li><li>Permite pesquisar por parte da palavra sem distinguir letras maiúsculas de minúsculas.</li><li>Participa da pesquisa ao clicar em Buscar ou pressionar ENTER, desde que exista algum critério informado.</li></ul></li></ul> |
| <strong>Unidade de Trabalho (UTB)</strong> | <ul><li><strong>Label:</strong> “Unidade de Trabalho (UTB)”.</li><li><strong>Tipo:</strong> Select com autocomplete.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field) e SAutocompleteComponent (s-autocomplete)</li><li><strong>Obrigatoriedade:</strong> Opcional.</li><li><strong>Placeholder:</strong> “Selecione ou busque uma unidade de trabalho”.</li><li><strong>Opções:</strong> UTBs já vinculadas às Secretarias Gerais cadastradas, incluindo registros ativos e inativos.</li><li><strong>Apresentação:</strong> Concatenação de Código UTB + Nome da UTB, em ordem crescente de código.</li><li><strong>Comportamentos:</strong><ul><li>Permite localizar as opções digitando parte do código ou do nome da UTB.</li><li>Não apresenta UTBs que não estejam vinculadas a alguma Secretaria Geral cadastrada.</li><li>Permite selecionar ou limpar a seleção e participa da pesquisa ao acionar Buscar ou pressionar ENTER, quando habilitado.</li></ul></li></ul> |
| <strong>Status</strong> | <ul><li><strong>Label:</strong> “Status”.</li><li><strong>Tipo:</strong> Select.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field) e SSelectComponent (s-select)</li><li><strong>Obrigatoriedade:</strong> Opcional.</li><li><strong>Valor inicial:</strong> “Todos”.</li><li><strong>Opções:</strong> “Todos”, “Ativo” e “Inativo”.</li><li><strong>Comportamentos:</strong><ul><li>Filtra os registros conforme a situação selecionada.</li><li>A opção “Todos” não restringe a situação e representa o estado inicial do filtro.</li><li>Participa da pesquisa ao clicar em Buscar.</li></ul></li></ul> |
| <strong>Limpar</strong> | <ul><li><strong>Label:</strong> “Limpar”.</li><li><strong>Tipo:</strong> Button.</li><li><strong>Componente SIAGE-UI:</strong> SFilterCardComponent (s-filter-card) e SButtonComponent (s-button)</li><li><strong>Formato:</strong> Ação secundária.</li><li><strong>Habilitação:</strong> Sempre habilitado.</li><li><strong>Comportamentos:</strong><ul><li>Limpa os campos Nome e Unidade de Trabalho (UTB) e redefine Status para “Todos”.</li><li>Recarrega a listagem completa e retorna à primeira página.</li><li>Quando os filtros já estiverem no estado inicial, não executa alteração adicional.</li></ul></li></ul> |
| <strong>Buscar</strong> | <ul><li><strong>Label:</strong> “Buscar”.</li><li><strong>Tipo:</strong> Button.</li><li><strong>Componente SIAGE-UI:</strong> SFilterCardComponent (s-filter-card) e SButtonComponent (s-button)</li><li><strong>Formato:</strong> Ação primária.</li><li><strong>Habilitação:</strong> Desabilitado enquanto Nome e Unidade de Trabalho (UTB) estiverem vazios e Status permanecer em “Todos”. Habilitado quando houver pelo menos um critério diferente do estado inicial dos filtros.</li><li><strong>Comportamentos:</strong><ul><li>Executa a pesquisa conforme os critérios informados, combinando os filtros preenchidos.</li><li>Pressionar ENTER em um dos campos de pesquisa deverá executar o mesmo comportamento do botão Buscar quando existir ao menos um critério informado.</li><li>Sem critérios de pesquisa, o botão permanece desabilitado e ENTER não executa a busca.</li><li>Quando houver resultado compatível, atualiza a tabela; caso contrário, exibe “Nenhum resultado encontrado”.</li><li>Ao executar uma nova busca, retorna à primeira página da listagem.</li></ul></li></ul> |

### <strong>5.3 Listagem de Secretarias Gerais</strong>

Ações incorporadas à tabela do bloco de listagem.

| Nome do campo | Detalhamento do campo |
| --- | --- |
| **Paginação** | <ul><li><strong>Tipo:</strong> Paginação da listagem.</li><li><strong>Componente SIAGE-UI:</strong> SPaginationComponent (s-pagination), integrado ao STableComponent (s-table).</li><li><strong>Paginação:</strong> Máximo de 10 registros por página.</li><li><strong>Comportamentos:</strong><ul><li>Exibe a quantidade total de registros e a faixa de itens apresentada, com controles para navegar entre páginas. </li><li>Ao realizar nova pesquisa ou limpar os filtros, retorna à primeira página da listagem.</li></ul></li></ul> |
| <strong>Listagem</strong> | <ul><li><strong>Tipo:</strong> Tabela paginada.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table)</li><li><strong>Paginação:</strong> Máximo de 10 registros por página.</li><li><strong>Comportamentos:</strong><ul><li>Apresenta os registros conforme pesquisa e ordenação aplicadas.</li><li>Exibe a quantidade total de registros e a faixa de itens apresentada, com controles para navegar entre páginas.</li><li>Ao realizar nova pesquisa ou limpar os filtros, retorna à primeira página da listagem.</li></ul></li></ul> |
| <strong>Nome da Secretaria Geral</strong> | <ul><li><strong>Label:</strong> “Nome da Secretaria Geral”.</li><li><strong>Tipo:</strong> Coluna textual.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn)</li><li><strong>Ordenação:</strong> Ordenável de A a Z e de Z a A. Na abertura da tela, prevalece a ordenação geral por Data de Criação decrescente.</li><li><strong>Comportamentos:</strong><ul><li>Retorna o nome cadastrado para a Secretaria Geral.</li><li>Valores extensos devem apresentar quebra de linha, sem truncamento ou sobreposição.</li></ul></li></ul> |
| <strong>Unidade de Trabalho (UTB)</strong> | <ul><li><strong>Label:</strong> “Unidade de Trabalho (UTB)”.</li><li><strong>Tipo:</strong> Coluna textual.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn)</li><li><strong>Ordenação:</strong> Ordenável em ordem crescente e decrescente. Na abertura da tela, prevalece Data de Criação decrescente.</li><li><strong>Comportamentos:</strong> Retorna o Código UTB e o Nome da UTB vinculada ao registro de Secretaria Geral.</li></ul> |
| <strong>Criador/Editor</strong> | <ul><li><strong>Label:</strong> “Criador/Editor”.</li><li><strong>Tipo:</strong> Coluna textual.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn)</li><li><strong>Comportamentos:</strong> Retorna o nome do usuário que criou ou editou por último o registro.</li></ul> |
| <strong>Data de Criação</strong> | <ul><li><strong>Label:</strong> “Data de Criação”.</li><li><strong>Tipo:</strong> Coluna de data e hora.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn)</li><li><strong>Ordenação:</strong> A listagem inicia ordenada por Data de Criação em ordem decrescente (registro mais recente primeiro).</li><li><strong>Comportamentos:</strong> Retorna a data e a hora de criação da Secretaria Geral.</li></ul> |
| <strong>Status</strong> | <ul><li><strong>Label:</strong> “Status”.</li><li><strong>Tipo:</strong> Coluna de situação.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn) e SBadgeComponent (s-badge)</li><li><strong>Apresentação:</strong> Badge “Ativo” ou “Inativo”.</li><li><strong>Comportamentos:</strong><ul><li>Representa a situação vigente da Secretaria Geral.</li><li>A alteração de situação deverá ser solicitada somente pela ação Ativar/Inativar da última coluna.</li></ul></li></ul> |
| <strong>Ações</strong> | <ul><li><strong>Label:</strong> “Ações”.</li><li><strong>Tipo:</strong> Coluna de ações.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableAction) e SSwitchComponent (s-switch)</li><li><strong>Ordenação:</strong> Não ordenável.</li><li><strong>Apresentação:</strong> Visualizar e Editar utilizando IconButton em formato ghost, com tooltip e aria-label. Ativar/Inativar utilizando SlideToggle controlado.</li><li><strong>Comportamentos:</strong><ul><li>Apresenta Visualizar, Editar e Ativar/Inativar conforme permissões do usuário.</li><li>Editar não deverá ser disponibilizado para registros inativos.</li><li>Não apresenta a ação Excluir.</li><li>Permanece como última coluna da listagem.</li></ul></li></ul> |
| <strong>Visualizar</strong> | <ul><li><strong>Label:</strong> “Visualizar”.</li><li><strong>Tipo:</strong> IconButton.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableAction) e SIconButtonComponent (s-icon-button)</li><li><strong>Formato:</strong> Ação ghost.</li><li><strong>Visibilidade:</strong> Somente quando o usuário possuir permissão para visualizar.</li><li><strong>Tooltip:</strong> “Visualizar”.</li><li><strong>Aria-label:</strong> “Visualizar Secretaria Geral”.</li><li><strong>Comportamentos:</strong><ul><li>Direciona para a funcionalidade de Visualizar Secretaria Geral do registro selecionado.</li><li>A consulta poderá ser realizada independentemente de o registro estar ativo ou inativo.</li></ul></li></ul> |
| <strong>Ativar/Inativar</strong> | <ul><li><strong>Label:</strong> “Ativar” ou “Inativar”, conforme a situação vigente.</li><li><strong>Tipo:</strong> SlideToggle.</li><li><strong>Componente SIAGE-UI:</strong> SSwitchComponent (s-switch)</li><li><strong>Visibilidade:</strong> Somente quando o usuário possuir permissão para ativar/inativar.</li><li><strong>Tooltip:</strong> “Inativar” para registros ativos e “Ativar” para registros inativos.</li><li><strong>Aria-label:</strong> “Inativar Secretaria Geral” ou “Ativar Secretaria Geral”.</li><li><strong>Comportamentos:</strong><ul><li>Apresenta exclusivamente a situação efetiva do registro, sem alternância visual antecipada.</li><li>Ao acionar Inativar, exibe primeiramente o modal “Inativar registro?”.</li><li>Cancelar ou fechar pelo X não altera o registro.</li><li>Após confirmar, verifica a inexistência de Chefe Imediato e de Secretarias Executivas ou Gerências Regionais subordinadas e exige Normativa de Extinção anexada.</li><li>Quando houver vínculos impeditivos, não conclui a operação e exibe o modal “Não é possível inativar”, com os motivos e as orientações correspondentes.</li><li>Quando a única pendência for a Normativa de Extinção, permite anexá-la no próprio fluxo, respeitando obrigatoriedade dos campos, formatos PDF/JPG/JPEG/PNG e tamanho máximo de 10 MB.</li><li>Somente após a confirmação e o cumprimento das regras de negócio, conclui a inativação, atualiza a situação do registro e movimenta o switch.</li><li>Em cancelamentos, impedimentos ou falhas, o switch permanece na posição original.</li><li>A inativação é irreversível.</li><li>Ao tentar ativar registro inativo, o sistema deverá impedir a operação, apresentar toast de impossibilidade de reativação, sem alterar a situação.</li></ul></li></ul> |
| <strong>Editar</strong> | <ul><li><strong>Label:</strong> “Editar”.</li><li><strong>Tipo:</strong> IconButton.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableAction) e SIconButtonComponent (s-icon-button)</li><li><strong>Formato:</strong> Ação ghost.</li><li><strong>Visibilidade:</strong> Somente quando o usuário possuir permissão de edição e o registro estiver ativo.</li><li><strong>Tooltip:</strong> “Editar”.</li><li><strong>Aria-label:</strong> “Editar Secretaria Geral”.</li><li><strong>Comportamentos:</strong><ul><li>Direciona para a funcionalidade de Editar Secretaria Geral do registro selecionado.</li><li>Não deverá ser disponibilizado quando a Secretaria Geral estiver inativa.</li></ul></li></ul> |

### **5.4 Estados da listagem**

| Nome do campo | Detalhamento do campo |
| --- | --- |
| **Nenhum registro cadastrado** | <ul><li><strong>Label:</strong> “Nenhum registro cadastrado”.</li><li><strong>Tipo:</strong> Estado vazio.</li><li><strong>Componente SIAGE-UI:</strong> SEmptyStateComponent (s-empty-state), integrado ao STableComponent (s-table).</li><li><strong>Comportamentos:</strong> Exibe “Ainda não existem secretarias gerais cadastradas.” quando não houver registros a apresentar.</li></ul> |
| **Nenhum resultado encontrado** | <ul><li><strong>Label:</strong> “Nenhum resultado encontrado”.</li><li><strong>Tipo:</strong> Estado vazio.</li><li><strong>Componente SIAGE-UI:</strong> SEmptyStateComponent (s-empty-state), integrado ao STableComponent (s-table).</li><li><strong>Comportamentos:</strong> Exibe “Nenhum registro corresponde aos filtros aplicados.” quando a busca nos filtros não retornar resultados.</li></ul> |
| **Carregamento** | <ul><li><strong>Tipo:</strong> Estado de carregamento.</li><li><strong>Componente SIAGE-UI:</strong> SSkeletonComponent (s-skeleton), integrado ao STableComponent (s-table).</li><li><strong>Comportamentos:</strong> Durante o carregamento, exibe skeleton no formato da tabela.</li></ul> |
| **Erro ao carregar dados** | <ul><li><strong>Label:</strong> “Erro ao carregar dados”.</li><li><strong>Tipo:</strong> Estado de erro.</li><li><strong>Componente SIAGE-UI:</strong> SEmptyStateComponent (s-empty-state), integrado ao STableComponent (s-table); SButtonComponent (s-button) para a ação “Tentar novamente”.</li><li><strong>Comportamentos:</strong><ul><li>Exibe “Não foi possível carregar as informações desta funcionalidade. Verifique sua conexão e tente novamente.” e a ação “Tentar novamente” quando houver erro ao carregar dados.</li><li>A ação utiliza o botão secundário com contorno disponibilizado pelo componente oficial, sem variante personalizada.</li></ul></li></ul> |

## 6) Modais

| Modal | Quando exibir | Título/Mensagem | Ações/Regras | Imagens |
| --- | --- | --- | --- | --- |
| <strong>Confirmação de inativação</strong> | Ao acionar Inativar no SlideToggle de registro ativo. | Título: Inativar registro?<br>Mensagem: Deseja inativar {Nome da Secretaria Geral}? A inativação é irreversível e o registro não poderá ser reativado. | <ul><li><strong>Componente SIAGE-UI:</strong> SModalService (confirm) e SModalComponent (s-modal).</li><li><strong>Ações/Regras:</strong> Ações: “Cancelar” (secundária), “Sim, inativar” (primária/destrutiva) e X no cabeçalho. Cancelar/X preserva status e switch. Confirmar inicia a verificação de impedimentos.</li></ul> |  |
| <strong>Impossibilidade de inativação</strong> | Após confirmar a inativação, se houver Chefe Imediato e/ou unidades subordinadas. | Título: Não é possível inativar<br>Mensagem: Para continuar, resolva as seguintes pendências: | <ul><li><strong>Componente SIAGE-UI:</strong> SModalComponent (s-modal), aberto por SModalService.</li><li><strong>Ações/Regras:</strong> Apresentar somente as pendências existentes, em tópicos simples: Normativa de Extinção ausente; quantidade de unidades vinculadas e orientação para desvincular; nome da chefia e orientação para remover o vínculo. Ações “Fechar” e X. Situação permanece ativa.</li></ul> |  |
| <strong>Anexar Normativa de Extinção</strong> | Após confirmar a inativação, quando não houver Chefia Imediata nem unidades subordinadas, mas faltar a normativa. | Título: Anexar Normativa de Extinção<br>Mensagem: Informe os dados da normativa e anexe o documento oficial para inativar a {Nome da Secretaria Geral}. | <ul><li><strong>Componente SIAGE-UI:</strong> Modal: SModalComponent (s-modal), aberto por SModalService. Visualizar anexo: SIconButtonComponent (s-icon-button).</li><li><strong>Nome da Normativa</strong><ul><li><strong>Label:</strong> “Nome da Normativa”.</li><li><strong>Tipo:</strong> Campo de texto.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field) e SInputComponent (s-input).</li><li><strong>Obrigatoriedade:</strong> Obrigatório.</li></ul></li><li><strong>Número da Normativa</strong><ul><li><strong>Label:</strong> “Número da Normativa”.</li><li><strong>Tipo:</strong> Campo de texto.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field) e SInputComponent (s-input).</li><li><strong>Obrigatoriedade:</strong> Obrigatório.</li></ul></li><li><strong>Data da Publicação</strong><ul><li><strong>Label:</strong> “Data da Publicação”.</li><li><strong>Tipo:</strong> Campo de data.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field) e SDatepickerComponent (s-datepicker).</li><li><strong>Obrigatoriedade:</strong> Obrigatório.</li></ul></li><li><strong>Arquivo</strong><ul><li><strong>Tipo:</strong> Anexo de arquivo.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field) e SFileUploadComponent (s-file-upload).</li><li><strong>Obrigatoriedade:</strong> Obrigatório.</li><li><strong>Formatos:</strong> PDF, JPG, JPEG ou PNG. <strong>Tamanho máximo:</strong> 10 MB.</li><li><strong>Comportamentos:</strong> Anexação habilitada após campos válidos.</li></ul></li><li><strong>Ações/Regras:</strong> Campos obrigatórios: Nome da Normativa, Número da Normativa, Data da Publicação e arquivo. Anexação habilitada após campos válidos. PDF/JPG/JPEG/PNG, até 10 MB. Ações Cancelar/X e “Sim, inativar”. Sem anexo ou campos válidos, não concluir. Sucesso registra normativa e inativa sem nova confirmação.</li></ul> |  |
| <strong>Visualizar anexo</strong> | Ao acionar Visualizar no arquivo da Normativa de Extinção, durante a etapa de anexação. | Título: Visualizar anexo. | <ul><li><strong>Componente SIAGE-UI:</strong> SModalComponent (s-modal) e SButtonComponent (s-button) para fechar e baixar.</li><li><strong>Visualização do documento</strong><ul><li><strong>Tipo:</strong> Pré-visualização de anexo.</li><li><strong>Componente SIAGE-UI:</strong> Lacuna da biblioteca — LAC-001.</li></ul></li><li><strong>Ações/Regras:</strong> Modal de pré-visualização no padrão do sistema, com X e ações disponíveis de fechar/baixar. Não modifica o anexo nem o status da Secretaria Geral.</li></ul> |  |

## 7) Toast

| Toast | Quando exibir | Título/Mensagem | Ações/Regras | Imagens |
| --- | --- | --- | --- | --- |
| <strong>Inativação concluída</strong> | Após a inativação ser efetivamente concluída, inclusive com anexação da normativa quando necessária. | Título: Secretaria Geral inativada com sucesso.<br>Mensagem: Não se aplica. | <strong>Componente SIAGE-UI</strong>: SToastService (success).<br><strong>Ações/Regras</strong>: Atualiza tabela e SlideToggle após sucesso. Não deve aparecer em cancelamentos, impedimentos ou falha de persistência. Fecha automaticamente conforme padrão global. |  |
| <strong>Impossibilidade de reativação</strong> | Quando o usuário acionar o controle de um registro inativo. | Título: A inativação de uma Secretaria Geral é irreversível. O registro não pode ser reativado. | <strong>Componente SIAGE-UI</strong>: SToastService (warning).<br><strong>Ações/Regras</strong>: Apresenta aviso e modal de impossibilidade. Não altera situação ou switch. |  |
| <strong>Arquivo anexado</strong> | Após seleção bem-sucedida do arquivo da Normativa de Extinção no respectivo modal. | Título: Arquivo “{Nome do arquivo}” anexado. | <strong>Componente SIAGE-UI</strong>: SToastService (success).<br><strong>Ações/Regras</strong>: Indica que o arquivo foi selecionado no fluxo. Não representa ainda a conclusão da inativação. |  |
| <strong>Arquivo acima do limite</strong> | Ao selecionar arquivo com tamanho superior ao permitido. | Título: O arquivo excede o limite máximo permitido de 10 MB. | <strong>Componente SIAGE-UI</strong>: SToastService (warning).<br><strong>Ações/Regras</strong>: Não aceita o arquivo e mantém o formulário para correção. Não altera o registro. |  |
| <strong>Validação dos campos</strong> | Ao tentar prosseguir sem os campos obrigatórios válidos e/ou sem documento. | Título: Verifique os campos obrigatórios destacados no formulário. | <strong>Componente SIAGE-UI</strong>: SToastService (warning).<br><strong>Ações/Regras</strong>: Destaca as restrições diretamente nos campos e direciona o foco ao primeiro campo inválido. Não conclui a inativação. |  |
| <strong>Cadastro bloqueado</strong> | Em tentativa de acesso ao cadastro enquanto já existir Secretaria Geral ativa. | Título: Já existe uma Secretaria Geral ativa. Não é possível cadastrar outra. | <strong>Componente SIAGE-UI</strong>: SToastService (warning).<br><strong>Ações/Regras</strong>: Apresentar somente quando a ação for tentada por fluxo que ultrapasse o botão desabilitado. Não abrir formulário. |  |
| <strong>Erro genérico de requisição</strong> | Quando uma operação falhar e não houver mensagem de negócio específica. | Título: Não foi possível concluir a solicitação.<br>Mensagem: Tente novamente. | <strong>Componente SIAGE-UI</strong>: SToastService (error).<br><strong>Ações/Regras</strong>: Utilizar o padrão global de erro. Não expor endpoint, SQL, stack trace ou código técnico. Manter status e dados originais quando a operação falhar. |  |

## 8) Protótipos

| Listar Secretaria Geral |
| --- |
|  |
| Listar Secretaria Geral - Nenhum resultado encontrado |
|  |
| Listar Secretaria Geral - Nenhum Registro cadastrado |
|  |
| Listar Secretaria Geral - Carregando em skeleton |
|  |
| Listar Secretaria Geral - Erro de carregamento |
|  |
| Listar Secretaria Geral - Sem acesso a funcionalidade |
|  |

## 9) Lacunas da biblioteca SIAGE-UI







| <strong>Identificador</strong> | <strong>Elemento da RF</strong> | <strong>Necessidade não atendida</strong> | <strong>Referência na RF</strong> |
| --- | --- | --- | --- |
| LAC-001 | Pré-visualização do documento no modal Visualizar anexo. | A versão instalada da biblioteca não disponibiliza componente dedicado à pré-visualização de PDF e imagens | 6) Modais: Visualizar anexo. |
