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

**Fluxo documentado para Secretaria Executiva:** Login >> Selecionar Matrícula, quando aplicável >> Página Inicial >> Configurações >> Hierarquia de Unidades e Cargos >> Configurar Secretaria Executiva >> Visualizar ou Editar Secretaria Executiva >> Consultar histórico.

**Fluxo documentado para Gerência Executiva:** Login >> Selecionar Matrícula, quando aplicável >> Página Inicial >> Configurações >> Hierarquia de Unidades e Cargos >> Configurar Gerência Executiva >> Visualizar ou Editar Gerência Executiva >> Consultar histórico.

**Fluxo documentado para Gerência Regional:** Login >> Selecionar Matrícula, quando aplicável >> Página Inicial >> Configurações >> Hierarquia de Unidades e Cargos >> Configurar Gerência Regional >> Visualizar ou Editar Gerência Regional >> Consultar histórico.

**Fluxo documentado para Subgerência:** Login >> Selecionar Matrícula, quando aplicável >> Página Inicial >> Configurações >> Hierarquia de Unidades e Cargos >> Configurar Subgerência >> Visualizar ou Editar Subgerência >> Consultar histórico.

**Fluxo documentado para Núcleo:** Login >> Selecionar Matrícula, quando aplicável >> Página Inicial >> Configurações >> Hierarquia de Unidades e Cargos >> Configurar Núcleo >> Visualizar ou Editar Núcleo >> Consultar histórico.

**Pré-condições:**

- O usuário deverá estar autenticado no SIAGE-RH e possuir matrícula ativa em contexto, quando aplicável.

- O usuário deverá possuir permissão para consultar os dados da funcionalidade de origem, ou perfil Administrador conforme a regra de permissionamento.

- O registro de Hierarquia consultado deverá existir. Na Secretaria Geral, na Secretaria Executiva, na Gerência Executiva, na Gerência Regional, na Subgerência e no Núcleo, o histórico poderá ser aberto mesmo quando não houver Chefe Imediato atualmente vinculado.

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

- **Na Secretaria Executiva**, a descrição deverá identificar a unidade consultada: “Consulte os atos governamentais registrados para esta Secretaria Executiva.”

- **Na Gerência Executiva**, a descrição deverá identificar a unidade consultada: “Consulte os atos governamentais registrados para esta Gerência Executiva.”

- **Na Gerência Regional**, a descrição deverá identificar a unidade consultada: “Consulte os atos governamentais registrados para esta Gerência Regional.”

- **Na Subgerência**, a descrição deverá identificar a unidade consultada: “Consulte os atos governamentais registrados para esta Subgerência.”

- **No Núcleo**, a descrição deverá identificar a unidade consultada: “Consulte os atos governamentais registrados para este Núcleo.”

- O título não deverá apresentar ícone decorativo.

- O modal deverá conservar o contexto do registro e da tela de origem, mesmo quando não existir Chefe Imediato atual.

- A consulta não deverá disponibilizar filtros de pesquisa, operações de manutenção ou alteração de vínculos.

- A interface deverá seguir os padrões de acessibilidade definidos nas Padronizações do SIAGE-RH e os comportamentos acessíveis disponibilizados pelos componentes da biblioteca SIAGE-UI. Particularidades deverão ser especificadas no detalhamento dos respectivos elementos.

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

- Baixar arquivo deverá disponibilizar o documento em seu formato original, conforme as permissões aplicáveis. **O início do download não deverá exibir toast informativo**.

- Fechar ou X deverá encerrar somente o modal de histórico e retornar à mesma tela de origem, preservando os dados.

- Ao fechar a pré-visualização de um documento, o usuário deverá retornar ao histórico, sem encerrá-lo.

### 4.3 Aplicação por CRUD

| CRUD / operação | Abertura e contexto da consulta | Regras específicas da aplicação | Retorno |
| --- | --- | --- | --- |
| **Secretaria Geral — Visualizar (RF003)** | Ação “Consultar histórico” no bloco de Chefia Imediata e Ato Governamental da Secretaria Geral selecionada | Disponível **com ou sem Chefe Imediato atual**; relaciona atos ao respectivo chefe; até 5 registros por página, sem manutenção | Fechar/X retorna à visualização da mesma Secretaria Geral |
| **Secretaria Geral — Editar (RF004)** | Ação “Consultar histórico” no bloco de Chefia Imediata e Ato Governamental da Secretaria Geral em edição | Disponível **com ou sem Chefe Imediato atual**; somente consulta; não modifica chefia, atos nem alterações não salvas; até 5 registros por página | Fechar/X retorna à edição e **preserva o formulário preenchido** |
| **Secretaria Executiva — Visualizar (RF003)** | Ação “Consultar histórico” no bloco de Chefia Imediata e Ato Governamental da Secretaria Executiva selecionada | Disponível **com ou sem Chefe Imediato atual**; relaciona os atos aos respectivos chefes; até 5 registros por página, sem manutenção | Fechar/X retorna à visualização da mesma Secretaria Executiva |
| **Secretaria Executiva — Editar (RF004)** | Ação “Consultar histórico” no bloco de Chefia Imediata e Ato Governamental da Secretaria Executiva em edição | Disponível **com ou sem Chefe Imediato atual**; somente consulta; não modifica chefia, atos nem alterações não salvas; até 5 registros por página | Fechar/X retorna à edição e **preserva o formulário preenchido** |
| **Gerência Executiva — Visualizar (RF003)** | Ação “Consultar histórico” no bloco de Chefia Imediata e Ato Governamental da Gerência Executiva selecionada | Disponível **com ou sem Chefe Imediato atual**; relaciona os atos aos respectivos chefes; até 5 registros por página, sem manutenção | Fechar/X retorna à visualização da mesma Gerência Executiva |
| **Gerência Executiva — Editar (RF004)** | Ação “Consultar histórico” no bloco de Chefia Imediata e Ato Governamental da Gerência Executiva em edição | Disponível **com ou sem Chefe Imediato atual**; somente consulta; não modifica chefia, atos nem alterações não salvas; até 5 registros por página | Fechar/X retorna à edição e **preserva o formulário preenchido** |
| **Gerência Regional — Visualizar (RF003)** | Ação “Consultar histórico” no bloco de Chefia Imediata e Ato Governamental da Gerência Regional selecionada | Disponível **com ou sem Chefe Imediato atual**; relaciona os atos aos respectivos chefes; até 5 registros por página, sem manutenção | Fechar/X retorna à visualização da mesma Gerência Regional |
| **Gerência Regional — Editar (RF004)** | Ação “Consultar histórico” no bloco de Chefia Imediata e Ato Governamental da Gerência Regional em edição | Disponível **com ou sem Chefe Imediato atual**; somente consulta; não modifica chefia, atos nem alterações não salvas; até 5 registros por página | Fechar/X retorna à edição e **preserva o formulário preenchido** |
| **Subgerência — Visualizar (RF003)** | Ação “Consultar histórico” no bloco de Chefia Imediata e Ato Governamental da Subgerência selecionada | Disponível **com ou sem Chefe Imediato atual**; relaciona os atos aos respectivos chefes; até 5 registros por página, sem manutenção | Fechar/X retorna à visualização da mesma Subgerência |
| **Subgerência — Editar (RF004)** | Ação “Consultar histórico” no bloco de Chefia Imediata e Ato Governamental da Subgerência em edição | Disponível **com ou sem Chefe Imediato atual**; somente consulta; não modifica chefia, atos nem alterações não salvas; até 5 registros por página | Fechar/X retorna à edição e **preserva o formulário preenchido** |
| **Núcleo — Visualizar (RF003)** | Ação “Consultar histórico” no bloco de Chefia Imediata e Ato Governamental do Núcleo selecionado | Disponível **com ou sem Chefe Imediato atual**; relaciona os atos aos respectivos chefes; até 5 registros por página, sem manutenção | Fechar/X retorna à visualização do mesmo Núcleo |
| **Núcleo — Editar (RF004)** | Ação “Consultar histórico” no bloco de Chefia Imediata e Ato Governamental do Núcleo em edição | Disponível **com ou sem Chefe Imediato atual**; somente consulta; não modifica chefia, atos nem alterações não salvas; até 5 registros por página | Fechar/X retorna à edição e **preserva o formulário preenchido** |

## 5) Detalhamento da funcionalidade

### 5.1 Estrutura do modal

| Nome do campo | Detalhamento do campo |
| --- | --- |
| **Modal Histórico de Atos Governamentais** | • <strong>Título:</strong> “Histórico de Atos Governamentais”.<br>• <strong>Tipo:</strong> Modal contextual, exclusivamente consultivo.<br>• <strong>Componente SIAGE-UI:</strong> SModalComponent (s-modal: variant result), aberto por SModalService (open).<br>• <strong>Comportamentos:</strong><br>◦ Aberto por “Consultar histórico”, exibe cabeçalho, descrição, tabela de atos e ações Fechar e X.<br>◦ Não tem rota independente.<br>◦ Mantém a tela de origem durante a consulta. |
| **Descrição contextual** | • <strong>Tipo:</strong> Texto informativo.<br>• <strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.<br>• <strong>Descrição na Secretaria Geral:</strong> “Consulte os atos governamentais registrados para esta Secretaria Geral.”<br>• <strong>Descrição na Secretaria Executiva:</strong> “Consulte os atos governamentais registrados para esta Secretaria Executiva.”<br>• <strong>Descrição na Gerência Executiva:</strong> “Consulte os atos governamentais registrados para esta Gerência Executiva.”<br>• <strong>Descrição na Gerência Regional:</strong> “Consulte os atos governamentais registrados para esta Gerência Regional.”<br>• <strong>Descrição na Subgerência:</strong> “Consulte os atos governamentais registrados para esta Subgerência.”<br>• <strong>Descrição no Núcleo:</strong> “Consulte os atos governamentais registrados para este Núcleo.”<br>• <strong>Comportamentos:</strong><br>◦ Identifica o registro consultado;<br>◦ não adiciona ícone decorativo ao título. |
| **Listagem do histórico** | • <strong>Tipo:</strong> Tabela paginada somente para consulta.<br>• <strong>Componente SIAGE-UI:</strong> STableComponent (s-table: columns, rows, actions, empty, page, pageSize e total).<br>• <strong>Colunas:</strong> Número do Ato Governamental, Chefe Imediato, Data da Publicação, Data do Cadastro, Responsável pelo Cadastro e Ações.<br>• <strong>Ordenação:</strong> Ato mais recente para mais antigo.<br>• <strong>Comportamentos:</strong><br>◦ Exibe registros e ações de documento, sem filtros nem edição.<br>◦ Sem registros, apresenta “Nenhum ato governamental encontrado.”.<br>◦ Falha de consulta mantém o contexto do modal e aciona o feedback de erro da seção 7. |
| **Paginação do histórico** | • <strong>Tipo:</strong> Controle de paginação.<br>• <strong>Componente SIAGE-UI:</strong> SPaginationComponent (s-pagination), integrado ao STableComponent (s-table: page, pageSize e total).<br>• <strong>Paginação na Secretaria Geral, na Secretaria Executiva, na Gerência Executiva, na Gerência Regional, na Subgerência e no Núcleo:</strong> Máximo de 5 registros por página.<br>• <strong>Comportamentos:</strong> Exibe total de registros, faixa de itens e controles para navegar pelas páginas, segundo o padrão do sistema. |

### 5.2 Listagem e colunas do histórico

| Nome do campo | Detalhamento do campo |
| --- | --- |
| **Número do Ato Governamental** | • <strong>Label:</strong> “Número do Ato Governamental”.<br>• <strong>Tipo:</strong> Coluna textual.<br>• <strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn).<br>• <strong>Comportamentos:</strong> Exibe o número ou identificação do ato associado ao registro consultado, sem edição. |
| **Chefe Imediato** | • <strong>Label:</strong> “Chefe Imediato”.<br>• <strong>Tipo:</strong> Coluna textual.<br>• <strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn).<br>• <strong>Comportamentos:</strong> Exibe o nome do chefe vinculado àquele ato, inclusive se não for o chefe atualmente vinculado. |
| **Data da Publicação** | • <strong>Label:</strong> “Data da Publicação”.<br>• <strong>Tipo:</strong> Coluna de data.<br>• <strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn).<br>• <strong>Formato:</strong> DD/MM/AAAA.<br>• <strong>Comportamentos:</strong> Apresenta a data de publicação do respectivo ato. |
| **Data do Cadastro** | • <strong>Label:</strong> “Data do Cadastro”.<br>• <strong>Tipo:</strong> Coluna de data e hora.<br>• <strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn).<br>• <strong>Formato:</strong> DD/MM/AAAA HH:MM, quando disponível.<br>• <strong>Comportamentos:</strong> Exibe o momento do cadastro do Chefe Imediato relacionado ao ato, conforme os dados existentes. |
| **Responsável pelo Cadastro** | • <strong>Label:</strong> “Responsável pelo Cadastro”.<br>• <strong>Tipo:</strong> Coluna textual.<br>• <strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn).<br>• <strong>Comportamentos:</strong> Exibe o nome do usuário responsável pelo cadastro do Chefe Imediato correspondente, conforme os metadados registrados. |
| **Ações** | • <strong>Label:</strong> “Ações”.<br>• <strong>Tipo:</strong> Coluna de ações consultivas.<br>• <strong>Componente SIAGE-UI:</strong> STableComponent (s-table: actions e actionClick; configuração STableAction), com SIconButtonComponent (s-icon-button).<br>• <strong>Apresentação:</strong> IconButtons Visualizar anexo e Baixar arquivo, com os respectivos tooltips.<br>• <strong>Comportamentos:</strong><br>◦ Última coluna da tabela.<br>◦ Apresenta ações referentes ao documento da linha, sem operações de remoção ou alteração. |

### 5.3 Ações do modal

| Nome do campo | Detalhamento do campo |
| --- | --- |
| **Visualizar anexo** | • <strong>Label:</strong> “Visualizar anexo”.<br>• <strong>Tipo:</strong> IconButton com ícone de visualização.<br>• <strong>Componente SIAGE-UI:</strong> STableComponent (s-table: actions e actionClick; configuração STableAction), com SIconButtonComponent (s-icon-button).<br>• <strong>Formato:</strong> Ação ghost.<br>• <strong>Tooltip:</strong> “Visualizar anexo”.<br>• <strong>Aria-label:</strong> “Visualizar anexo”.<br>• <strong>Comportamentos:</strong><br>◦ Abre o modal “Visualizar anexo” com o documento do ato selecionado.<br>◦ Ao fechar o visualizador, retorna à listagem do histórico, sem modificar registros. |
| **Baixar arquivo** | • <strong>Label:</strong> “Baixar arquivo”.<br>• <strong>Tipo:</strong> IconButton com ícone de download.<br>• <strong>Componente SIAGE-UI:</strong> STableComponent (s-table: actions e actionClick; configuração STableAction), com SIconButtonComponent (s-icon-button).<br>• <strong>Formato:</strong> Ação ghost.<br>• <strong>Tooltip:</strong> “Baixar arquivo”.<br>• <strong>Aria-label:</strong> “Baixar arquivo”.<br>• <strong>Comportamentos:</strong><br>◦ Disponibiliza download do documento da linha no formato original, sem alterar registros.<br>◦ Não exibe toast informativo de início de download. |
| **Fechar** | • <strong>Label:</strong> “Fechar”.<br>• <strong>Tipo:</strong> Button.<br>• <strong>Componente SIAGE-UI:</strong> SModalComponent (s-modal: variant result, confirmLabel e confirm), com SButtonComponent (s-button).<br>• <strong>Formato:</strong> Ação primária no rodapé.<br>• <strong>Habilitação:</strong> Sempre disponível.<br>• <strong>Comportamentos:</strong> Fecha apenas o histórico e retorna à mesma tela Visualizar ou Editar, preservando dados e alterações não salvas. |
| **Fechar (X)** | • <strong>Label:</strong> “Fechar modal”.<br>• <strong>Tipo:</strong> IconButton no cabeçalho.<br>• <strong>Componente SIAGE-UI:</strong> SModalComponent (s-modal: closable e cancel).<br>• <strong>Aria-label:</strong> “Fechar modal”.<br>• <strong>Habilitação:</strong> Sempre disponível.<br>• <strong>Comportamentos:</strong> Tem o mesmo efeito do botão Fechar. |

### 5.4 Estados da consulta

| Nome do campo | Detalhamento do campo |
| --- | --- |
| **Histórico com registros** | • <strong>Tipo:</strong> Estado da listagem.<br>• <strong>Componente SIAGE-UI:</strong> STableComponent (s-table: rows, page, pageSize e total).<br>• <strong>Comportamentos:</strong> Exibe atos relacionados ao registro consultado, associados aos respectivos Chefes Imediatos, com paginação, ordenação e ações de documentos. |
| **Sem atos governamentais** | • <strong>Tipo:</strong> Estado da listagem.<br>• <strong>Componente SIAGE-UI:</strong> STableComponent (s-table: empty, variant no-results), com SEmptyStateComponent (s-empty-state).<br>• <strong>Mensagem:</strong> “Nenhum ato governamental encontrado.”<br>• <strong>Comportamentos:</strong> Mantém o modal aberto, com cabeçalho e ações de fechamento disponíveis. |
| **Sem Chefe Imediato atual** | • <strong>Tipo:</strong> Condição da consulta de origem.<br>• <strong>Componente SIAGE-UI:</strong> Não se aplica; ausência de vínculo atual não impede a abertura do modal.<br>• <strong>Comportamentos:</strong> Na Secretaria Geral, na Secretaria Executiva, na Gerência Executiva, na Gerência Regional, na Subgerência e no Núcleo, continua permitindo consultar atos associados a chefias anteriores, caso existam. |
| **Falha ao carregar o histórico** | • <strong>Tipo:</strong> Estado de falha da consulta.<br>• <strong>Componente SIAGE-UI:</strong> SToastService (error).<br>• <strong>Comportamentos:</strong> Preserva o contexto do modal e apresenta o toast genérico da seção 7, sem alterar registros. |
| **Acesso restrito** | • <strong>Tipo:</strong> Estado de permissão negada.<br>• <strong>Componente SIAGE-UI:</strong> AcessoRestritoComponent (app-acesso-restrito); SEmptyStateComponent (s-empty-state: variant forbidden) está disponível.<br>• <strong>Comportamentos:</strong> A tentativa de consulta sem autorização impede a exposição do histórico e segue a tela/padrão global de acesso restrito. |

## 6) Modais

| Modal | Quando exibir | Título/Mensagem | Ações/Regras | Imagens |
| --- | --- | --- | --- | --- |
| <strong>6.1 Visualizar anexo</strong> | Ao acionar Visualizar anexo na linha de um Ato Governamental do histórico. | <strong>Título</strong>: “Visualizar anexo”. | • <strong>Componente SIAGE-UI:</strong> SModalComponent (s-modal).<br>• <strong>Identificação:</strong> Nome do arquivo, tamanho e data/hora de envio, quando disponíveis.<br>• <strong>Ações/Regras:</strong> Apresenta PDF ou imagem correspondente ao ato, com controles de visualização e fechamento (X / Fechar) e possibilidade de baixar. Fechar retorna ao histórico sem modificar documento, Chefia Imediata ou unidade.<br>• <strong>Pré-visualização do documento:</strong><br>◦ <strong>Tipo:</strong> Área de visualização do arquivo PDF ou imagem.<br>◦ <strong>Componente SIAGE-UI:</strong> Lacuna da biblioteca — LAC-001, já referenciada nas RFs anteriores.<br>◦ <strong>Comportamentos:</strong> Exibe o conteúdo do documento, sem permitir alteração do arquivo.<br>• <strong>Baixar arquivo:</strong><br>◦ <strong>Tipo:</strong> Ação de download no modal.<br>◦ <strong>Componente SIAGE-UI:</strong> SButtonComponent (s-button: variant secondary, outlined, icon download).<br>◦ <strong>Comportamentos:</strong> Disponibiliza o documento no formato original, sem toast informativo de início.<br>• <strong>Fechar / X:</strong><br>◦ <strong>Tipo:</strong> Ações de fechamento do visualizador.<br>◦ <strong>Componente SIAGE-UI:</strong> SModalComponent (s-modal) e SButtonComponent (s-button).<br>◦ <strong>Comportamentos:</strong> Retorna ao histórico, sem fechar a tela de origem nem alterar os dados. |  |

## 7) Toast

| Toast | Quando exibir | Título/Mensagem | Ações/Regras | Imagens |
| --- | --- | --- | --- | --- |
| **Erro genérico de requisição** | Quando a consulta do histórico falhar sem mensagem funcional específica. | <strong>Título:</strong> “Não foi possível concluir a solicitação.”<br><strong>Mensagem:</strong> “Tente novamente.” | Aplica o padrão global de erro, sem expor informações técnicas. Não modifica atos, vínculos, documentos ou os dados da tela de origem.<br>Componente SIAGE-UI: SToastService (error). |  |

## 8) Protótipos

| Protótipo |
| --- |
| <strong>Visualizar Histórico de Atos Governamentais — Secretaria Geral</strong><br>Modal de histórico com colunas, paginação, ações de documento e botão Fechar. |
|  |
| <strong>Visualizar Histórico de Atos Governamentais — Secretaria Executiva</strong><br>Consulta de atos por Chefia Imediata, com paginação e ações de documento. |
|  |
| <strong>Visualizar Histórico de Atos Governamentais — Gerência Executiva</strong><br>Consulta dos atos vinculados aos respectivos Chefes Imediatos, com paginação e ações de documento. |
|  |
| <strong>Visualizar Histórico de Atos Governamentais — Gerência Regional</strong><br>Consulta dos atos vinculados aos respectivos Chefes Imediatos, com paginação e ações de documento. |
|  |
| <strong>Visualizar Histórico de Atos Governamentais — Subgerência</strong><br>Consulta dos atos vinculados aos respectivos Chefes Imediatos, com paginação e ações de documento. |
| <strong>Visualizar Histórico de Atos Governamentais — Núcleo</strong><br>Consulta dos atos vinculados aos respectivos Chefes Imediatos, com paginação e ações de documento. |
|  |
|  |
| <strong>Visualizar Histórico de Atos Governamentais — Sem acesso à funcionalidade</strong><br>Tela de acesso restrito quando não houver permissão. |
|  |

## 9) Lacunas da biblioteca SIAGE-UI

| Identificação | Elemento | Tratamento |
| --- | --- | --- |
| **LAC-001** | Pré-visualização de arquivos PDF e imagem | Reutiliza a lacuna já identificada nas RFs anteriores. A pré-visualização de documentos depende do visualizador de PDF e do elemento de imagem utilizados no protótipo; a ação está detalhada na seção 6.1. |
