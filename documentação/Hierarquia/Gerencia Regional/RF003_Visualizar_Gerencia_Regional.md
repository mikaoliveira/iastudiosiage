# [RF003] Visualizar - Configurar Gerência Regional

## 1) Histórico

| Data | Versão | Descrição | Autor | Versão mind | Sprint de desenvolvimento |
| --- | --- | --- | --- | --- | --- |
| 16 de nov. de 2026 | 1.0 | Criação da funcionalidade | A definir | 01 | A definir |

## 2) História de Usuário

Eu, como usuário do SIAGE-RH, na qualidade de Administrador ou usuário com permissão de acesso,

Quero acessar a funcionalidade de Visualizar Gerência Regional,

Para consultar os dados cadastrais, a Secretaria Geral vinculada, a Chefia Imediata, os Atos Governamentais, as unidades subordinadas e as normativas, sem alterá-los.

## 3) Fluxo de acesso à funcionalidade

Login >> Selecionar Matrícula, quando aplicável >> Página Inicial >> Configurações >> Hierarquia de Unidades e Cargos >> Configurar Gerência Regional >> Visualizar

**Pré-condições:**

- O usuário deverá possuir permissão de visualização ou perfil Administrador.
- O registro deverá existir e estar acessível, independentemente de sua situação Ativo ou Inativo.

## 4) Critérios de Aceite

### 4.1 Acesso e permissões

- O acesso deverá ser permitido ao Administrador e aos usuários com permissão específica para Visualizar Gerência Regional.
- O sistema deverá verificar a permissão antes de disponibilizar dados e ações da funcionalidade; o perfil Administrador seguirá as regras gerais de permissionamento.
- A tentativa de acesso direto sem permissão deverá apresentar a tela global de “Acesso restrito”, sem expor dados protegidos.

### 4.2 Regras gerais

#### 4.2.1 Estrutura e apresentação da tela

- A tela deverá apresentar breadcrumbs, Voltar, título “Visualizar Gerência Regional”, descrição, ação Editar quando permitida e quatro cards informativos.
- Sequência dos cards: 1. Identificação da Gerência Regional; 2. Chefia Imediata e Ato Governamental; 3. Núcleos e Escolas Vinculados; 4. Gestão de Normativas.
- Dados cadastrais e normativos deverão ser apresentados somente para leitura, com quebra de linha para textos longos e sem indicação de obrigatoriedade.
- A interface deverá seguir os padrões de acessibilidade definidos nas Padronizações do SIAGE-RH e os comportamentos acessíveis disponibilizados pelos componentes da biblioteca SIAGE-UI. Particularidades deverão ser especificadas no detalhamento dos respectivos elementos.

#### 4.2.2 Identificação da Gerência Regional

- Apresentar Nome da Gerência Regional, Secretaria Geral vinculada e UTB na mesma linha, seguidos por Situação, Criador/Editor e Data de Criação.
- Exibir UTB no formato Código + Nome e Situação como “Ativo” ou “Inativo”, sem permitir mudança. A consulta será possível para registros ativos e inativos quando o usuário estiver autorizado.

#### 4.2.3 Chefia Imediata, Ato Governamental e histórico

- Apresentar Nome, Matrícula, CPF, Cargo e Situação Funcional do Chefe Imediato, em texto comum, quando houver.
- Exibir Ato Governamental associado com Número, Data da Publicação e documento; Visualizar e Baixar estarão disponíveis quando existir arquivo.
- Sem chefe atual, apresentar “Nenhum Chefe Imediato vinculado no momento.” e manter a ação Consultar histórico, que não exige chefia vigente.
- O histórico do Ato Governamental deverá seguir a RF006 global, com até 5 registros por página e sem alteração de atos ou chefias.

#### 4.2.4 Núcleos e Escolas Vinculados

- Exibir apenas Núcleos e Escolas vinculados à Gerência Regional selecionada.
- Permitir filtros Nome (pesquisa parcial, até 200 caracteres) e UTB (somente unidades vinculadas), isolados ou combinados.
- Apresentar as colunas Tipo / Unidade Vinculada, Chefia Imediata e Unidade de Trabalho (UTB). A primeira coluna deverá exibir o tipo “Núcleo” ou “Escola” e o nome da unidade, ordenada alfabeticamente pelo Nome, independentemente do tipo.
- Paginar em até 10 registros por página. Na ausência de vínculos ou resultados, exibir “Nenhum vínculo foi encontrado.”

#### 4.2.5 Gestão de Normativas e anexos

- Exibir Normativa de Criação com Nome, Número, Data da Publicação e documento, sem permitir edição.
- Exibir Normativa de Extinção somente quando houver documento cadastrado; na ausência, ocultar todo o bloco de Extinção.
- Permitir Visualizar e Baixar cada arquivo disponível no formato original; a pré-visualização utiliza modal de PDF ou imagem, conforme LAC-001.

#### 4.2.6 Ações, navegação e feedback

- Voltar no cabeçalho e rodapé retorna à RF001 sem modificar dados.
- Editar, quando disponível e autorizado, direciona à RF004 apenas para registro ativo.
- Consulta por registro inexistente deve comunicar a indisponibilidade e retornar à listagem, sem expor dados de outro registro. Erro de requisição seguirá o toast global.

## 5) Detalhamento da funcionalidade

### 5.1 Cabeçalho e navegação

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Breadcrumbs</strong> | <ul><li><strong>Tipo:</strong> Navegação contextual.</li><li><strong>Componente SIAGE-UI:</strong> SPageHeaderComponent (s-page-header: breadcrumbs).</li><li><strong>Exibição:</strong> Início / Configurações / Hierarquia de Unidades e Cargos / Configurar Gerência Regional / Visualizar.</li><li><strong>Comportamentos:</strong><ul><li>Os níveis anteriores deverão ser navegáveis e o último nível representará a página atual.</li></ul></li></ul> |
| <strong>Voltar</strong> | <ul><li><strong>Label:</strong> “Voltar”.</li><li><strong>Tipo:</strong> IconButton.</li><li><strong>Componente SIAGE-UI:</strong> SPageHeaderComponent (s-page-header: showBack).</li><li><strong>Formato:</strong> Ação secundária.</li><li><strong>Habilitação:</strong> Sempre disponível.</li><li><strong>Comportamentos:</strong><ul><li>Retorna à listagem Configurar Gerência Regional.</li></ul></li></ul> |
| <strong>Título e descrição</strong> | <ul><li><strong>Título:</strong> “Visualizar Gerência Regional”.</li><li><strong>Tipo:</strong> Título de página e texto descritivo.</li><li><strong>Componente SIAGE-UI:</strong> SPageHeaderComponent (s-page-header: title e description).</li><li><strong>Descrição:</strong> “Consulte as informações, dados de chefia, normativas e núcleos e escolas vinculados da Gerência Regional.”</li><li><strong>Comportamentos:</strong><ul><li>Apresenta o contexto da funcionalidade no cabeçalho da página.</li></ul></li></ul> |

### 5.2 Bloco 1 — Identificação da Gerência Regional

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Card de Identificação</strong> | <ul><li><strong>Tipo:</strong> Bloco informativo somente leitura.</li><li><strong>Componente SIAGE-UI:</strong> Agrupamento visual com rótulos e informações textuais.</li><li><strong>Comportamentos:</strong><ul><li>Apresenta Nome, Secretaria Geral, UTB, Situação, Criador/Editor e Data de Criação.</li></ul></li></ul> |
| <strong>Nome da Gerência Regional</strong> | <ul><li><strong>Label:</strong> “Nome da Gerência Regional”.</li><li><strong>Tipo:</strong> Campo informativo textual.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong><ul><li>Exibe o nome cadastrado sem permitir alteração; informações extensas deverão quebrar linha.</li></ul></li></ul> |
| <strong>Secretaria Geral</strong> | <ul><li><strong>Label:</strong> “Secretaria Geral”.</li><li><strong>Tipo:</strong> Campo informativo textual.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong><ul><li>Exibe o nome da Secretaria Geral à qual a Gerência Regional está vinculada; não permite mudança nesta tela.</li></ul></li></ul> |
| <strong>Unidade de Trabalho (UTB)</strong> | <ul><li><strong>Label:</strong> “Unidade de Trabalho (UTB)”.</li><li><strong>Tipo:</strong> Campo informativo textual.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong><ul><li>Exibe Código + Nome da UTB vinculada à Gerência Regional; informação somente leitura.</li></ul></li></ul> |
| <strong>Situação</strong> | <ul><li><strong>Label:</strong> “Situação”.</li><li><strong>Tipo:</strong> Campo informativo textual.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong><ul><li>Retorna “Ativo” ou “Inativo” como texto comum, sem oferecer alteração na visualização.</li></ul></li></ul> |
| <strong>Criador/Editor</strong> | <ul><li><strong>Label:</strong> “Criador/Editor”.</li><li><strong>Tipo:</strong> Campo informativo textual.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong><ul><li>Exibe o responsável pelo cadastro ou última edição.</li></ul></li></ul> |
| <strong>Data de Criação</strong> | <ul><li><strong>Label:</strong> “Data de Criação”.</li><li><strong>Tipo:</strong> Campo informativo textual.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Formato:</strong> DD/MM/AAAA HH:MM</li><li><strong>Comportamentos:</strong><ul><li>Exibe a data/hora do cadastro.</li></ul></li></ul> |

### 5.3 Bloco 2 — Chefia Imediata e Ato Governamental

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Card de Chefia Imediata e Ato Governamental</strong> | <ul><li><strong>Tipo:</strong> Bloco informativo somente leitura.</li><li><strong>Componente SIAGE-UI:</strong> Agrupamento visual com textos, SButtonComponent e SFileUploadComponent.</li><li><strong>Comportamentos:</strong><ul><li>Reúne Chefe Imediato e Ato atual, sem campos editáveis.</li></ul></li></ul> |
| <strong>Chefia Imediata</strong> | <ul><li><strong>Tipo:</strong> Identificação do servidor vinculado.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong><ul><li>Quando houver chefe, apresenta Nome, Matrícula, CPF, Cargo e Situação Funcional.</li><li>Na ausência, exibe “Nenhum Chefe Imediato vinculado no momento.”, mantendo Consultar histórico.</li></ul></li></ul> |
| <strong>Nome do Chefe Imediato</strong> | <ul><li><strong>Label:</strong> “Nome do Chefe Imediato”.</li><li><strong>Tipo:</strong> Campo informativo textual.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong><ul><li>Exibe a informação cadastral/funcional do Chefe Imediato, sem permitir alteração.</li></ul></li></ul> |
| <strong>Matrícula</strong> | <ul><li><strong>Label:</strong> “Matrícula”.</li><li><strong>Tipo:</strong> Campo informativo textual.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong><ul><li>Exibe a informação cadastral/funcional do Chefe Imediato, sem permitir alteração.</li></ul></li></ul> |
| <strong>CPF</strong> | <ul><li><strong>Label:</strong> “CPF”.</li><li><strong>Tipo:</strong> Campo informativo textual.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong><ul><li>Exibe a informação cadastral/funcional do Chefe Imediato, sem permitir alteração.</li></ul></li></ul> |
| <strong>Cargo</strong> | <ul><li><strong>Label:</strong> “Cargo”.</li><li><strong>Tipo:</strong> Campo informativo textual.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong><ul><li>Exibe a informação cadastral/funcional do Chefe Imediato, sem permitir alteração.</li></ul></li></ul> |
| <strong>Situação Funcional</strong> | <ul><li><strong>Label:</strong> “Situação Funcional”.</li><li><strong>Tipo:</strong> Campo informativo textual.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong><ul><li>Exibe a informação cadastral/funcional do Chefe Imediato, sem permitir alteração.</li></ul></li></ul> |
| <strong>Número do Ato Governamental</strong> | <ul><li><strong>Label:</strong> “Número do Ato Governamental”.</li><li><strong>Tipo:</strong> Campo informativo textual.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong><ul><li>Exibe a identificação do Ato de Nomeação vinculado à chefia atual.</li></ul></li></ul> |
| <strong>Data da Publicação — Ato Governamental</strong> | <ul><li><strong>Label:</strong> “Data da Publicação”.</li><li><strong>Tipo:</strong> Campo informativo de data.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Formato:</strong> DD/MM/AAAA.</li><li><strong>Comportamentos:</strong><ul><li>Exibe a data de publicação do Ato Governamental atual.</li></ul></li></ul> |
| <strong>Documento do Ato Governamental</strong> | <ul><li><strong>Tipo:</strong> Documento anexado somente para consulta.</li><li><strong>Componente SIAGE-UI:</strong> SFileUploadComponent (s-file-upload: fileName, fileId, allowDownload true e allowRemove false).</li><li><strong>Apresentação:</strong> Nome do arquivo, tamanho e data/hora de envio, quando disponíveis.</li><li><strong>Comportamentos:</strong><ul><li>Disponibiliza Visualizar anexo e Baixar arquivo; não permite alterar, substituir ou remover o documento.</li><li>O download disponibiliza o arquivo em seu formato original.</li></ul></li></ul> |
| <strong>Visualizar anexo — Ato Governamental</strong> | <ul><li><strong>Label:</strong> “Visualizar anexo”.</li><li><strong>Tipo:</strong> IconButton.</li><li><strong>Componente SIAGE-UI:</strong> SIconButtonComponent (s-icon-button: icon visibility, variant info, text) e STooltipDirective (sTooltip).</li><li><strong>Formato:</strong> Ação ghost.</li><li><strong>Visibilidade:</strong> Quando houver documento cadastrado.</li><li><strong>Comportamentos:</strong><ul><li>Abre o modal “Visualizar anexo” com pré-visualização de PDF ou imagem, sem alterar o arquivo.</li></ul></li></ul> |
| <strong>Baixar anexo — Ato Governamental</strong> | <ul><li><strong>Label:</strong> “Baixar arquivo”.</li><li><strong>Tipo:</strong> Ação integrada de download.</li><li><strong>Componente SIAGE-UI:</strong> SFileUploadComponent (s-file-upload: allowDownload true).</li><li><strong>Visibilidade:</strong> Quando houver documento cadastrado.</li><li><strong>Comportamentos:</strong><ul><li>Disponibiliza o arquivo no formato original, sem toast de início de download.</li></ul></li></ul> |
| <strong>Consultar histórico</strong> | <ul><li><strong>Label:</strong> “Consultar histórico”.</li><li><strong>Tipo:</strong> Button.</li><li><strong>Componente SIAGE-UI:</strong> SButtonComponent (s-button: variant secondary, outlined, icon history).</li><li><strong>Habilitação:</strong> Disponível com ou sem chefe atual.</li><li><strong>Comportamentos:</strong><ul><li>Abre a RF006 — Histórico de Atos Governamentais, preservando o contexto da tela de visualização.</li></ul></li></ul> |

### 5.4 Bloco 3 — Núcleos e Escolas Vinculados

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Card de Núcleos e Escolas Vinculados</strong> | <ul><li><strong>Tipo:</strong> Bloco de consulta de unidades subordinadas.</li><li><strong>Componente SIAGE-UI:</strong> Agrupamento visual com SFieldComponent, SAutocompleteComponent, SButtonComponent e STableComponent.</li><li><strong>Comportamentos:</strong><ul><li>Apresenta Núcleos e Escolas vinculados à Gerência Regional, sem alterar seus vínculos nesta tela.</li></ul></li></ul> |
| <strong>Buscar por</strong> | <ul><li><strong>Label:</strong> “Buscar por:”.</li><li><strong>Tipo:</strong> Texto indicativo do grupo de filtros.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong><ul><li>Identifica os filtros Nome e Unidade de Trabalho (UTB).</li></ul></li></ul> |
| <strong>Nome — filtro</strong> | <ul><li><strong>Label:</strong> “Nome”.</li><li><strong>Tipo:</strong> Campo de texto alfanumérico e caracteres especiais.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field) e SInputComponent (s-input)</li><li><strong>Obrigatoriedade:</strong> Opcional.</li><li><strong>Placeholder:</strong> “Digite o Nome”.</li><li><strong>Limite de caracteres:</strong> 200.</li><li><strong>Comportamentos:</strong><ul><li>Pesquisa parcial por Nome dos Núcleos e Escolas vinculados, sem diferenciar maiúsculas/minúsculas.</li></ul></li></ul> |
| <strong>Unidade de Trabalho (UTB) — filtro</strong> | <ul><li><strong>Label:</strong> “Unidade de Trabalho (UTB)”.</li><li><strong>Tipo:</strong> Select com autocomplete.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field) e SAutocompleteComponent (s-autocomplete)</li><li><strong>Obrigatoriedade:</strong> Opcional.</li><li><strong>Placeholder:</strong> “Selecione ou busque uma unidade de trabalho”.</li><li><strong>Opções:</strong> Somente UTBs dos Núcleos e Escolas vinculados à Gerência Regional consultada.</li><li><strong>Comportamentos:</strong><ul><li>Apresenta Código + Nome da UTB, em ordem crescente do código; permite pesquisar por código ou nome.</li></ul></li></ul> |
| <strong>Buscar</strong> | <ul><li><strong>Label:</strong> “Buscar”.</li><li><strong>Tipo:</strong> Button.</li><li><strong>Componente SIAGE-UI:</strong> SButtonComponent (s-button: variant primary, icon search).</li><li><strong>Formato:</strong> Ação primária.</li><li><strong>Habilitação:</strong> Ao informar pelo menos um filtro.</li><li><strong>Comportamentos:</strong><ul><li>Executa pesquisa por Nome e/ou UTB; ENTER equivale ao clique em Buscar quando houver critério.</li><li>Reinicia a listagem na primeira página.</li></ul></li></ul> |
| <strong>Limpar</strong> | <ul><li><strong>Label:</strong> “Limpar”.</li><li><strong>Tipo:</strong> Button.</li><li><strong>Componente SIAGE-UI:</strong> SButtonComponent (s-button: variant primary conforme tela).</li><li><strong>Comportamentos:</strong><ul><li>Limpa os dois filtros, restaura todos os vínculos e retorna à primeira página.</li></ul></li></ul> |
| <strong>Listagem de unidades vinculadas</strong> | <ul><li><strong>Tipo:</strong> Tabela paginada somente para consulta.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn e paginação integrada).</li><li><strong>Paginação:</strong> Até 10 registros por página.</li><li><strong>Ordenação:</strong> Núcleos e Escolas ordenados pelo Nome em ordem alfabética (A a Z), independentemente do tipo.</li><li><strong>Comportamentos:</strong><ul><li>Apresenta exclusivamente unidades subordinadas à Gerência Regional atual, sem ações de edição.</li><li>Sem vínculos ou correspondências, apresentar “Nenhum vínculo foi encontrado.”</li></ul></li></ul> |
| <strong>Tipo / Unidade Vinculada</strong> | <ul><li><strong>Label:</strong> “Tipo / Unidade Vinculada”.</li><li><strong>Tipo:</strong> Coluna textual.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn)</li><li><strong>Comportamentos:</strong><ul><li>Exibe o tipo “Núcleo” ou “Escola” e o nome da unidade vinculada à Gerência Regional, na mesma célula.</li><li>Não disponibiliza manutenção do vínculo nesta tela.</li></ul></li></ul> |
| <strong>Chefia Imediata</strong> | <ul><li><strong>Label:</strong> “Chefia Imediata”.</li><li><strong>Tipo:</strong> Coluna textual.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn)</li><li><strong>Comportamentos:</strong><ul><li>Exibe o nome do chefe da unidade subordinada, quando existir; caso contrário, mantém sem identificação de servidor.</li></ul></li></ul> |
| <strong>Unidade de Trabalho (UTB)</strong> | <ul><li><strong>Label:</strong> “Unidade de Trabalho (UTB)”.</li><li><strong>Tipo:</strong> Coluna textual.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn)</li><li><strong>Comportamentos:</strong><ul><li>Exibe a UTB cadastrada da unidade vinculada, no formato Código + Nome.</li></ul></li></ul> |
| <strong>Paginação — vínculos</strong> | <ul><li><strong>Tipo:</strong> Controle de paginação.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: page, pageSize, total).</li><li><strong>Paginação:</strong> Até 10 registros por página.</li><li><strong>Comportamentos:</strong><ul><li>Permite trocar de página e apresenta o total; pesquisar ou limpar retorna à primeira página.</li></ul></li></ul> |

### 5.5 Bloco 4 — Gestão de Normativas

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Card de Gestão de Normativas</strong> | <ul><li><strong>Tipo:</strong> Bloco informativo de documentos.</li><li><strong>Componente SIAGE-UI:</strong> Agrupamento visual com SFileUploadComponent e SIconButtonComponent.</li><li><strong>Comportamentos:</strong><ul><li>Normativa de Criação sempre exibida; Normativa de Extinção somente quando houver documento.</li></ul></li></ul> |
| <strong>Normativa de Criação</strong> | <ul><li><strong>Tipo:</strong> Sub-bloco informativo.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; valores textuais.</li><li><strong>Comportamentos:</strong><ul><li>Exibe Nome, Número, Data da Publicação e documento anexado.</li></ul></li></ul> |
| <strong>Nome da Normativa — Criação</strong> | <ul><li><strong>Label:</strong> “Nome da Normativa”.</li><li><strong>Tipo:</strong> Campo informativo textual.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong><ul><li>Exibe Nome da Normativa — Criação da Normativa de Criação, sem edição.</li></ul></li></ul> |
| <strong>Número da Normativa — Criação</strong> | <ul><li><strong>Label:</strong> “Número da Normativa”.</li><li><strong>Tipo:</strong> Campo informativo textual.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong><ul><li>Exibe Número da Normativa — Criação da Normativa de Criação, sem edição.</li></ul></li></ul> |
| <strong>Data da Publicação</strong> | <ul><li><strong>Label:</strong> “Data da Publicação”.</li><li><strong>Tipo:</strong> Campo informativo de data.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Formato:</strong> DD/MM/AAAA.</li><li><strong>Comportamentos:</strong><ul><li>Exibe Data da Publicação da Normativa de Criação, sem edição.</li></ul></li></ul> |
| <strong>Documento da Normativa de Criação</strong> | <ul><li><strong>Tipo:</strong> Documento anexado somente para consulta.</li><li><strong>Componente SIAGE-UI:</strong> SFileUploadComponent (s-file-upload: fileName, fileId, allowDownload true e allowRemove false).</li><li><strong>Apresentação:</strong> Nome do arquivo, tamanho e data/hora de envio, quando disponíveis.</li><li><strong>Comportamentos:</strong><ul><li>Disponibiliza Visualizar anexo e Baixar arquivo; não permite alterar, substituir ou remover o documento.</li><li>O download disponibiliza o arquivo em seu formato original.</li></ul></li></ul> |
| <strong>Visualizar anexo — Normativa de Criação</strong> | <ul><li><strong>Label:</strong> “Visualizar anexo”.</li><li><strong>Tipo:</strong> IconButton.</li><li><strong>Componente SIAGE-UI:</strong> SIconButtonComponent (s-icon-button: icon visibility, variant info, text) e STooltipDirective (sTooltip).</li><li><strong>Formato:</strong> Ação ghost.</li><li><strong>Visibilidade:</strong> Quando houver documento cadastrado.</li><li><strong>Comportamentos:</strong><ul><li>Abre o modal “Visualizar anexo” com pré-visualização de PDF ou imagem, sem alterar o arquivo.</li></ul></li></ul> |
| <strong>Baixar anexo — Normativa de Criação</strong> | <ul><li><strong>Label:</strong> “Baixar arquivo”.</li><li><strong>Tipo:</strong> Ação integrada de download.</li><li><strong>Componente SIAGE-UI:</strong> SFileUploadComponent (s-file-upload: allowDownload true).</li><li><strong>Visibilidade:</strong> Quando houver documento cadastrado.</li><li><strong>Comportamentos:</strong><ul><li>Disponibiliza o arquivo no formato original, sem toast de início de download.</li></ul></li></ul> |
| <strong>Normativa de Extinção</strong> | <ul><li><strong>Tipo:</strong> Sub-bloco informativo.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; valores textuais.</li><li><strong>Exibição:</strong> Somente quando houver documento da Normativa de Extinção cadastrado.</li><li><strong>Comportamentos:</strong><ul><li>Quando não existir documento, oculta o bloco completo.</li><li>Quando existir, exibe Nome, Número, Data e documento, sem edição.</li></ul></li></ul> |
| <strong>Nome da Normativa — Extinção</strong> | <ul><li><strong>Label:</strong> “Nome da Normativa”.</li><li><strong>Tipo:</strong> Campo informativo textual.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong><ul><li>Exibe Nome da Normativa — Extinção da Normativa de Extinção, sem edição.</li></ul></li></ul> |
| <strong>Número da Normativa — Extinção</strong> | <ul><li><strong>Label:</strong> “Número da Normativa”.</li><li><strong>Tipo:</strong> Campo informativo textual.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong><ul><li>Exibe Número da Normativa — Extinção da Normativa de Extinção, sem edição.</li></ul></li></ul> |
| <strong>Data da Publicação — Extinção</strong> | <ul><li><strong>Label:</strong> “Data da Publicação”.</li><li><strong>Tipo:</strong> Campo informativo de data.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Formato:</strong> DD/MM/AAAA.</li><li><strong>Comportamentos:</strong><ul><li>Exibe Data da Publicação — Extinção da Normativa de Extinção, sem edição.</li></ul></li></ul> |
| <strong>Documento da Normativa de Extinção</strong> | <ul><li><strong>Tipo:</strong> Documento anexado somente para consulta.</li><li><strong>Componente SIAGE-UI:</strong> SFileUploadComponent (s-file-upload: fileName, fileId, allowDownload true e allowRemove false).</li><li><strong>Apresentação:</strong> Nome do arquivo, tamanho e data/hora de envio, quando disponíveis.</li><li><strong>Comportamentos:</strong><ul><li>Disponibiliza Visualizar anexo e Baixar arquivo; não permite alterar, substituir ou remover o documento.</li><li>O download disponibiliza o arquivo em seu formato original.</li></ul></li></ul> |
| <strong>Visualizar anexo — Normativa de Extinção</strong> | <ul><li><strong>Label:</strong> “Visualizar anexo”.</li><li><strong>Tipo:</strong> IconButton.</li><li><strong>Componente SIAGE-UI:</strong> SIconButtonComponent (s-icon-button: icon visibility, variant info, text) e STooltipDirective (sTooltip).</li><li><strong>Formato:</strong> Ação ghost.</li><li><strong>Visibilidade:</strong> Quando houver documento cadastrado.</li><li><strong>Comportamentos:</strong><ul><li>Abre o modal “Visualizar anexo” com pré-visualização de PDF ou imagem, sem alterar o arquivo.</li></ul></li></ul> |
| <strong>Baixar anexo — Normativa de Extinção</strong> | <ul><li><strong>Label:</strong> “Baixar arquivo”.</li><li><strong>Tipo:</strong> Ação integrada de download.</li><li><strong>Componente SIAGE-UI:</strong> SFileUploadComponent (s-file-upload: allowDownload true).</li><li><strong>Visibilidade:</strong> Quando houver documento cadastrado.</li><li><strong>Comportamentos:</strong><ul><li>Disponibiliza o arquivo no formato original, sem toast de início de download.</li></ul></li></ul> |

### 5.6 Ações gerais da página

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Editar</strong> | <ul><li><strong>Label:</strong> “Editar”.</li><li><strong>Tipo:</strong> Button.</li><li><strong>Componente SIAGE-UI:</strong> SButtonComponent (s-button: variant primary, icon edit) projetado no SPageHeaderComponent.</li><li><strong>Formato:</strong> Ação primária.</li><li><strong>Visibilidade:</strong> Somente quando houver permissão de edição e registro ativo.</li><li><strong>Comportamentos:</strong><ul><li>Direciona à RF004 — Editar Gerência Regional.</li></ul></li></ul> |
| <strong>Voltar — rodapé</strong> | <ul><li><strong>Label:</strong> “Voltar”.</li><li><strong>Tipo:</strong> Button.</li><li><strong>Componente SIAGE-UI:</strong> SButtonComponent (s-button).</li><li><strong>Comportamentos:</strong><ul><li>Retorna à listagem sem modificar dados.</li></ul></li></ul> |
| <strong>Informações de auditoria</strong> | <ul><li><strong>Tipo:</strong> Informações textuais.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica.</li><li><strong>Comportamentos:</strong><ul><li>Exibe data e responsável pelo cadastro; quando houver edição, data e responsável pela última atualização.</li></ul></li></ul> |

### 5.7 Estados da listagem de unidades vinculadas

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Sem unidades vinculadas</strong> | <ul><li><strong>Tipo:</strong> Estado de listagem vazia.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: empty) e SEmptyStateComponent (s-empty-state).</li><li><strong>Mensagem:</strong> “Nenhum vínculo foi encontrado.”</li><li><strong>Comportamentos:</strong><ul><li>Exibe quando não houver Núcleos e Escolas vinculados à Gerência Regional.</li></ul></li></ul> |
| <strong>Busca sem resultados</strong> | <ul><li><strong>Tipo:</strong> Estado de pesquisa sem correspondência.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: empty) e SEmptyStateComponent (s-empty-state).</li><li><strong>Mensagem:</strong> “Nenhum vínculo foi encontrado.”</li><li><strong>Comportamentos:</strong><ul><li>Exibe quando Nome e/ou UTB não retornarem vínculos.</li></ul></li></ul> |

## 6) Modais

| Modal | Quando exibir | Título/Mensagem | Ações/Regras | Imagens |
| --- | --- | --- | --- | --- |
| <strong>6.1 Histórico de Atos Governamentais</strong> | Ao acionar Consultar histórico, com ou sem Chefe Imediato atual. | Título: “Histórico de Atos Governamentais”. | <ul><li><strong>Consulta:</strong><ul><li>Apresenta os atos associados à Gerência Regional e aos seus respectivos Chefes Imediatos; Data do Cadastro e Responsável pelo Cadastro.</li><li>Paginação de até 5 registros por página, ações Visualizar/Baixar e fechamento sem alteração.</li><li>Reutiliza as regras da RF006 global — Histórico de Atos Governamentais.</li></ul></li></ul> |  |
| <strong>6.2 Visualizar anexo</strong> | Ao acionar Visualizar no Ato Governamental, Normativa de Criação, Extinção ou histórico. | Título: “Visualizar anexo”. | <ul><li><strong>Pré-visualização:</strong><ul><li>Modal PDF/imagem; lacuna de biblioteca LAC-001; sem edição do arquivo.</li></ul></li><li><strong>Baixar arquivo:</strong><ul><li>Permite o download do formato original.</li></ul></li><li><strong>Fechar / X:</strong><ul><li>Fecha a pré-visualização e retorna ao contexto de consulta, sem modificar dados.</li></ul></li></ul> |  |

## 7) Toast

| Toast | Quando exibir | Título/Mensagem | Ações/Regras | Imagens |
| --- | --- | --- | --- | --- |
| <strong>Registro não encontrado</strong> | Ao acessar Gerência Regional inexistente ou indisponível. | Título: “Gerência Regional não encontrada.” Mensagem: Não se aplica. | <ul><li><strong>Componente SIAGE-UI:</strong><ul><li>SToastService (error).</li></ul></li><li><strong>Ações/Regras:</strong><ul><li>Comunica a indisponibilidade e retorna à listagem, sem expor outro registro.</li></ul></li></ul> |  |
| <strong>Erro genérico de requisição</strong> | Quando a consulta falhar sem mensagem funcional específica. | Título: “Não foi possível concluir a solicitação.” Mensagem: “Tente novamente.” | <ul><li><strong>Componente SIAGE-UI:</strong><ul><li>SToastService (error).</li></ul></li><li><strong>Ações/Regras:</strong><ul><li>Aplica o padrão global de erro e preserva navegação segura.</li></ul></li></ul> |  |

## 8) Protótipos

| Protótipo |
| --- |
| <strong>Visualizar Gerência Regional — com chefia e normativas</strong> |
|  |
| <strong>Visualizar Gerência Regional — sem chefe imediato</strong> |
|  |
| <strong>Visualizar Gerência Regional — unidades vinculadas</strong> |
|  |
| <strong>Visualizar Gerência Regional — sem Normativa de Extinção</strong> |
|  |

## 9) Lacunas da biblioteca SIAGE-UI

Aplica-se a LAC-001 já documentada em Hierarquia para a pré-visualização de PDF e imagens. Nenhuma nova lacuna foi identificada.

| Identificador | Elemento da RF | Necessidade não atendida | Referência na RF |
| --- | --- | --- | --- |
| LAC-001 (referência existente) | Pré-visualização de PDFs e imagens. | A biblioteca SIAGE-UI não oferece visualizador dedicado de PDF/imagem; aplica-se a lacuna já documentada nas RFs de Hierarquia. | Seção 6 — Visualizar anexo. |
