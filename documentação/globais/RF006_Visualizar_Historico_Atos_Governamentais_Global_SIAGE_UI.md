# [RF006] Visualizar Histórico de Atos Governamentais — Funcionalidade Global de Hierarquia

## 1) Histórico

| Data | Versão | Descrição | Autor | Versão mind | Sprint de desenvolvimento |
| --- | --- | --- | --- | --- | --- |
| 28 de out. de 2026 | 1.0 | Criação da funcionalidade | Mikael Oliveira | 01 | SPXXX |

## 2) História de Usuário

Eu, como usuário do SIAGE-RH, na qualidade de Administrador ou usuário com permissão de acesso,

Quero visualizar o Histórico de Atos Governamentais da unidade de Hierarquia consultada,

Para consultar os atos de nomeação registrados e os respectivos Chefes Imediatos, incluindo seus documentos, sem alterar as informações.

## 3) Fluxo de acesso à funcionalidade

**Fluxo compartilhado:** Login >> Selecionar Matrícula, quando aplicável >> Página Inicial >> Configurações >> Hierarquia de Unidades e Cargos >> Funcionalidade de origem >> Consultar histórico >> Histórico de Atos Governamentais.

**Fluxo documentado para Secretaria Geral:** Login >> Selecionar Matrícula, quando aplicável >> Página Inicial >> Configurações >> Hierarquia de Unidades e Cargos >> Configurar Secretaria Geral >> Visualizar ou Editar Secretaria Geral >> Consultar histórico.

**Pré-condições:**

- O usuário deverá estar autenticado no SIAGE-RH e possuir matrícula ativa em contexto, quando aplicável.
- O usuário deverá possuir permissão para consultar os dados da funcionalidade de origem, ou perfil Administrador conforme a regra de permissionamento.
- O registro de Hierarquia consultado deverá existir. Na Secretaria Geral, o histórico poderá ser aberto mesmo quando não houver Chefe Imediato atualmente vinculado.
- A consulta será aberta em modal contextual, sem rota independente de cadastro.

## 4) Critérios de Aceite

### 4.1 Acesso e permissões

- O acesso ao histórico deverá respeitar o permissionamento da funcionalidade de origem, com validação antes da disponibilização de dados protegidos.
- Administradores seguirão as regras gerais de acesso da aplicação.
- A tentativa de consulta sem permissão, inclusive por acesso direto indevido, deverá impedir a exposição dos dados e aplicar o padrão global de “Acesso restrito”.
- O modal será exclusivamente consultivo, sem ações para incluir, editar, remover ou substituir atos ou Chefes Imediatos.

### 4.2 Regras gerais

#### 4.2.1 Estrutura e apresentação

- O sistema deverá abrir o modal **“Histórico de Atos Governamentais”**, com cabeçalho, descrição contextual, tabela paginada de atos e ações Fechar e X.
- **Na Secretaria Geral**, a descrição deverá ser: “Consulte os atos governamentais registrados para esta Secretaria Geral.”
- O título não deverá apresentar ícone decorativo.
- O modal deverá conservar o contexto do registro e da tela de origem, mesmo quando não existir Chefe Imediato atual.
- A consulta não deverá disponibilizar filtros de pesquisa, operações de manutenção ou alteração de vínculos.

#### 4.2.2 Listagem, ordenação e paginação

- A tabela deverá apresentar, nesta ordem, as colunas **Número do Ato Governamental, Chefe Imediato, Data da Publicação, Data do Cadastro, Responsável pelo Cadastro e Ações**.
- Cada ato deverá permanecer associado ao respectivo Chefe Imediato, incluindo atos referentes a chefias anteriores, e aos metadados de cadastro.
- Os atos deverão ser exibidos **do mais recente para o mais antigo**, conforme a regra da consulta.
- A paginação deverá apresentar no máximo 5 registros por página, exibindo o total de registros e controles de navegação.
- Quando não houver atos, apresentar **“Nenhum ato governamental encontrado.”** na tabela, mantendo o cabeçalho e o fechamento do modal disponíveis.
- Não deverão existir filtros de busca nem ações para incluir, editar ou excluir registros da tabela.

#### 4.2.3 Visualização de documentos e fechamento

- A coluna Ações deverá permitir **Visualizar anexo** e **Baixar arquivo** do documento correspondente ao ato selecionado.
- Visualizar anexo deverá abrir o modal “Visualizar anexo” com visualizador de PDF ou imagem, sem alterar o ato, a chefia ou o registro de origem.
- Baixar arquivo deverá disponibilizar o documento em seu formato original, conforme as permissões aplicáveis. **O início do download não deverá exibir toast informativo**, conforme a padronização global definida para o protótipo.
- Fechar ou X deverá encerrar somente o modal de histórico e retornar à mesma tela de origem, preservando os dados.
- Ao fechar a pré-visualização de um documento, o usuário deverá retornar ao histórico, sem encerrá-lo.

### 4.3 Aplicação por CRUD

| CRUD / operação | Abertura e contexto da consulta | Regras específicas da aplicação | Retorno |
| --- | --- | --- | --- |
| **Secretaria Geral — Visualizar (RF003)** | Ação “Consultar histórico” no bloco de Chefia Imediata e Ato Governamental da Secretaria Geral selecionada | Disponível **com ou sem Chefe Imediato atual**; relaciona atos ao respectivo chefe; até 5 registros por página, sem manutenção | Fechar/X retorna à visualização da mesma Secretaria Geral |
| **Secretaria Geral — Editar (RF004)** | Ação “Consultar histórico” no bloco de Chefia Imediata e Ato Governamental da Secretaria Geral em edição | Disponível **com ou sem Chefe Imediato atual**; somente consulta; não modifica chefia, atos nem alterações não salvas; até 5 registros por página | Fechar/X retorna à edição e **preserva o formulário preenchido** |

## 5) Detalhamento da funcionalidade

### 5.1 Estrutura do modal

| Nome do campo | Detalhamento do campo |
| --- | --- |
| **Modal Histórico de Atos Governamentais** | <ul><li><strong>Título:</strong> “Histórico de Atos Governamentais”.</li><li><strong>Tipo:</strong> Modal contextual, exclusivamente consultivo.</li><li><strong>Componente SIAGE-UI:</strong> SModalComponent (s-modal: variant result), aberto por SModalService (open).</li><li><strong>Comportamentos:</strong><ul><li>Aberto por “Consultar histórico”, exibe cabeçalho, descrição, tabela de atos e ações Fechar e X.</li><li>Não tem rota independente.</li><li>Mantém a tela de origem durante a consulta.</li></ul></li></ul> |
| **Descrição contextual** | <ul><li><strong>Tipo:</strong> Texto informativo.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Descrição na Secretaria Geral:</strong> “Consulte os atos governamentais registrados para esta Secretaria Geral.”</li><li><strong>Comportamentos:</strong><ul><li>Identifica o registro consultado;</li><li>não adiciona ícone decorativo ao título.</li></ul></li></ul> |
| **Listagem do histórico** | <ul><li><strong>Tipo:</strong> Tabela paginada somente para consulta.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: columns, rows, actions, empty, page, pageSize e total).</li><li><strong>Colunas:</strong> Número do Ato Governamental, Chefe Imediato, Data da Publicação, Data do Cadastro, Responsável pelo Cadastro e Ações.</li><li><strong>Ordenação:</strong> Ato mais recente para mais antigo.</li><li><strong>Comportamentos:</strong><ul><li>Exibe registros e ações de documento, sem filtros nem edição.</li><li>Sem registros, apresenta “Nenhum ato governamental encontrado.”.</li><li>Falha de consulta mantém o contexto do modal e aciona o feedback de erro da seção 7.</li></ul></li></ul> |
| **Paginação do histórico** | <ul><li><strong>Tipo:</strong> Controle de paginação.</li><li><strong>Componente SIAGE-UI:</strong> SPaginationComponent (s-pagination), integrado ao STableComponent (s-table: page, pageSize e total).</li><li><strong>Paginação na Secretaria Geral:</strong> Máximo de 5 registros por página.</li><li><strong>Comportamentos:</strong> Exibe total de registros, faixa de itens e controles para navegar pelas páginas, segundo o padrão do sistema.</li></ul> |

### 5.2 Listagem e colunas do histórico

| Nome do campo | Detalhamento do campo |
| --- | --- |
| **Número do Ato Governamental** | <ul><li><strong>Label:</strong> “Número do Ato Governamental”.</li><li><strong>Tipo:</strong> Coluna textual.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn).</li><li><strong>Comportamentos:</strong> Exibe o número ou identificação do ato associado ao registro consultado, sem edição.</li></ul> |
| **Chefe Imediato** | <ul><li><strong>Label:</strong> “Chefe Imediato”.</li><li><strong>Tipo:</strong> Coluna textual.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn).</li><li><strong>Comportamentos:</strong> Exibe o nome do chefe vinculado àquele ato, inclusive se não for o chefe atualmente vinculado.</li></ul> |
| **Data da Publicação** | <ul><li><strong>Label:</strong> “Data da Publicação”.</li><li><strong>Tipo:</strong> Coluna de data.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn).</li><li><strong>Formato:</strong> DD/MM/AAAA.</li><li><strong>Comportamentos:</strong> Apresenta a data de publicação do respectivo ato.</li></ul> |
| **Data do Cadastro** | <ul><li><strong>Label:</strong> “Data do Cadastro”.</li><li><strong>Tipo:</strong> Coluna de data e hora.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn).</li><li><strong>Formato:</strong> DD/MM/AAAA HH:MM, quando disponível.</li><li><strong>Comportamentos:</strong> Exibe o momento do cadastro do Chefe Imediato relacionado ao ato, conforme os dados existentes.</li></ul> |
| **Responsável pelo Cadastro** | <ul><li><strong>Label:</strong> “Responsável pelo Cadastro”.</li><li><strong>Tipo:</strong> Coluna textual.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn).</li><li><strong>Comportamentos:</strong> Exibe o nome do usuário responsável pelo cadastro do Chefe Imediato correspondente, conforme os metadados registrados.</li></ul> |
| **Ações** | <ul><li><strong>Label:</strong> “Ações”.</li><li><strong>Tipo:</strong> Coluna de ações consultivas.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: actions e actionClick; configuração STableAction), com SIconButtonComponent (s-icon-button).</li><li><strong>Apresentação:</strong> IconButtons Visualizar anexo e Baixar arquivo, com os respectivos tooltips.</li><li><strong>Comportamentos:</strong><ul><li>Última coluna da tabela.</li><li>Apresenta ações referentes ao documento da linha, sem operações de remoção ou alteração.</li></ul></li></ul> |

### 5.3 Ações do modal

| Nome do campo | Detalhamento do campo |
| --- | --- |
| **Visualizar anexo** | <ul><li><strong>Label:</strong> “Visualizar anexo”.</li><li><strong>Tipo:</strong> IconButton com ícone de visualização.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: actions e actionClick; configuração STableAction), com SIconButtonComponent (s-icon-button).</li><li><strong>Formato:</strong> Ação ghost.</li><li><strong>Tooltip:</strong> “Visualizar anexo”.</li><li><strong>Aria-label:</strong> “Visualizar anexo”.</li><li><strong>Comportamentos:</strong><ul><li>Abre o modal “Visualizar anexo” com o documento do ato selecionado.</li><li>Ao fechar o visualizador, retorna à listagem do histórico, sem modificar registros.</li></ul></li></ul> |
| **Baixar arquivo** | <ul><li><strong>Label:</strong> “Baixar arquivo”.</li><li><strong>Tipo:</strong> IconButton com ícone de download.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: actions e actionClick; configuração STableAction), com SIconButtonComponent (s-icon-button).</li><li><strong>Formato:</strong> Ação ghost.</li><li><strong>Tooltip:</strong> “Baixar arquivo”.</li><li><strong>Aria-label:</strong> “Baixar arquivo”.</li><li><strong>Comportamentos:</strong><ul><li>Disponibiliza download do documento da linha no formato original, sem alterar registros.</li><li>Não exibe toast informativo de início de download.</li></ul></li></ul> |
| **Fechar** | <ul><li><strong>Label:</strong> “Fechar”.</li><li><strong>Tipo:</strong> Button.</li><li><strong>Componente SIAGE-UI:</strong> SModalComponent (s-modal: variant result, confirmLabel e confirm), com SButtonComponent (s-button).</li><li><strong>Formato:</strong> Ação primária no rodapé.</li><li><strong>Habilitação:</strong> Sempre disponível.</li><li><strong>Comportamentos:</strong> Fecha apenas o histórico e retorna à mesma tela Visualizar ou Editar, preservando dados e alterações não salvas.</li></ul> |
| **Fechar (X)** | <ul><li><strong>Label:</strong> “Fechar modal”.</li><li><strong>Tipo:</strong> IconButton no cabeçalho.</li><li><strong>Componente SIAGE-UI:</strong> SModalComponent (s-modal: closable e cancel).</li><li><strong>Aria-label:</strong> “Fechar modal”.</li><li><strong>Habilitação:</strong> Sempre disponível.</li><li><strong>Comportamentos:</strong> Tem o mesmo efeito do botão Fechar.</li></ul> |

### 5.4 Estados da consulta

| Nome do campo | Detalhamento do campo |
| --- | --- |
| **Histórico com registros** | <ul><li><strong>Tipo:</strong> Estado da listagem.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: rows, page, pageSize e total).</li><li><strong>Comportamentos:</strong> Exibe atos relacionados ao registro consultado, associados aos respectivos Chefes Imediatos, com paginação, ordenação e ações de documentos.</li></ul> |
| **Sem atos governamentais** | <ul><li><strong>Tipo:</strong> Estado da listagem.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: empty, variant no-results), com SEmptyStateComponent (s-empty-state).</li><li><strong>Mensagem:</strong> “Nenhum ato governamental encontrado.”</li><li><strong>Comportamentos:</strong> Mantém o modal aberto, com cabeçalho e ações de fechamento disponíveis.</li></ul> |
| **Sem Chefe Imediato atual** | <ul><li><strong>Tipo:</strong> Condição da consulta de origem.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; ausência de vínculo atual não impede a abertura do modal.</li><li><strong>Comportamentos:</strong> Na Secretaria Geral, continua permitindo consultar atos associados a chefias anteriores, caso existam.</li></ul> |
| **Falha ao carregar o histórico** | <ul><li><strong>Tipo:</strong> Estado de falha da consulta.</li><li><strong>Componente SIAGE-UI:</strong> SToastService (error).</li><li><strong>Comportamentos:</strong> Preserva o contexto do modal e apresenta o toast genérico da seção 7, sem alterar registros.</li></ul> |
| **Acesso restrito** | <ul><li><strong>Tipo:</strong> Estado de permissão negada.</li><li><strong>Componente SIAGE-UI:</strong> AcessoRestritoComponent (app-acesso-restrito); SEmptyStateComponent (s-empty-state: variant forbidden) está disponível.</li><li><strong>Comportamentos:</strong> A tentativa de consulta sem autorização impede a exposição do histórico e segue a tela/padrão global de acesso restrito.</li></ul> |

## 6) Modais

| Modal | Quando exibir | Título/Mensagem | Ações/Regras | Imagens |
| --- | --- | --- | --- | --- |
| <strong>6.1 Visualizar anexo</strong> | Ao acionar Visualizar anexo na linha de um Ato Governamental do histórico. | <strong>Título</strong>: “Visualizar anexo”. | <ul><li><strong>Componente SIAGE-UI:</strong> SModalComponent (s-modal). A abertura aninhada no protótipo utiliza MatDialog.</li><li><strong>Identificação:</strong> Nome do arquivo, tamanho e data/hora de envio, quando disponíveis.</li><li><strong>Ações/Regras:</strong> Apresenta PDF ou imagem correspondente ao ato, com controles de visualização e fechamento (X / Fechar) e possibilidade de baixar. Fechar retorna ao histórico sem modificar documento, Chefia Imediata ou unidade.</li><li><strong>Pré-visualização do documento:</strong><ul><li><strong>Tipo:</strong> Área de visualização do arquivo PDF ou imagem.</li><li><strong>Componente SIAGE-UI:</strong> Lacuna da biblioteca — LAC-001, já referenciada nas RFs anteriores.</li><li><strong>No protótipo:</strong> ngx-extended-pdf-viewer (PDF) ou elemento img (imagem).</li><li><strong>Comportamentos:</strong> Exibe o conteúdo do documento, sem permitir alteração do arquivo.</li></ul></li><li><strong>Baixar arquivo:</strong><ul><li><strong>Tipo:</strong> Ação de download no modal.</li><li><strong>Componente SIAGE-UI:</strong> SButtonComponent (s-button: variant secondary, outlined, icon download).</li><li><strong>Comportamentos:</strong> Disponibiliza o documento no formato original, sem toast informativo de início.</li></ul></li><li><strong>Fechar / X:</strong><ul><li><strong>Tipo:</strong> Ações de fechamento do visualizador.</li><li><strong>Componente SIAGE-UI:</strong> SModalComponent (s-modal) e SButtonComponent (s-button).</li><li><strong>Comportamentos:</strong> Retorna ao histórico, sem fechar a tela de origem nem alterar os dados.</li></ul></li></ul> |  |

## 7) Toast

| Toast | Quando exibir | Título/Mensagem | Ações/Regras | Imagens |
| --- | --- | --- | --- | --- |
| **Erro genérico de requisição** | Quando a consulta do histórico falhar sem mensagem funcional específica. | <strong>Título:</strong> “Não foi possível concluir a solicitação.”<br><strong>Mensagem:</strong> “Tente novamente.” | Aplica o padrão global de erro, sem expor informações técnicas. Não modifica atos, vínculos, documentos ou os dados da tela de origem.<br>Componente SIAGE-UI: SToastService (error). |  |

## 8) Protótipos

| Visualizar Histórico de Atos Governamentais<br>Modal de histórico com colunas, paginação, ações de documento e botão Fechar, conforme o PDF original. |
| --- |
|  |
| Visualizar Histórico de Atos Governamentais — Sem acesso à funcionalidade<br>Tela de acesso restrito quando não houver permissão. |
|  |

## 9) Lacunas da biblioteca SIAGE-UI

| Identificação | Elemento | Tratamento |
| --- | --- | --- |
| **LAC-001** | Pré-visualização de arquivos PDF e imagem | Reutiliza a lacuna já identificada nas RFs anteriores. A pré-visualização de documentos depende do visualizador de PDF e do elemento de imagem utilizados no protótipo; a ação está detalhada na seção 6.1. |
