# [RF003] Visualizar - Configurar Núcleo

## 1) Histórico

| Data | Versão | Descrição | Autor | Versão mind | Sprint de desenvolvimento |
| --- | --- | --- | --- | --- | --- |
| 16 de nov. de 2026 | 1.0 | Criação da funcionalidade | A definir | 01 | A definir |

## 2) História de Usuário

Eu, como usuário do SIAGE-RH, na qualidade de Administrador ou usuário com permissão de acesso,

Quero acessar a funcionalidade de Visualizar Núcleo,

Para consultar os dados cadastrais, o vínculo com Gerência Regional ou Subgerência, o endereço, a Chefia Imediata, os Atos Governamentais e as normativas, sem alterá-los.

## 3) Fluxo de acesso à funcionalidade

Login >> Selecionar Matrícula, quando aplicável >> Página Inicial >> Configurações >> Hierarquia de Unidades e Cargos >> Configurar Núcleo >> Visualizar

**Pré-condições:**

- O usuário deverá possuir permissão de visualização ou perfil Administrador.
- O registro deverá existir e estar acessível, independentemente de sua situação Ativo ou Inativo.

## 4) Critérios de Aceite

### 4.1 Acesso e permissões

- O acesso deverá ser permitido ao Administrador e aos usuários com permissão específica para Visualizar Núcleo.
- O sistema deverá verificar a permissão antes de disponibilizar dados e ações da funcionalidade; o perfil Administrador seguirá as regras gerais de permissionamento.
- A tentativa de acesso direto sem permissão deverá apresentar a tela global de “Acesso restrito”, sem expor dados protegidos.

### 4.2 Regras gerais

#### 4.2.1 Estrutura e apresentação da tela

- A tela deverá apresentar breadcrumbs, Voltar, título “Visualizar Núcleo”, descrição, ação Editar quando permitida e três cards informativos.
- Sequência dos cards: 1. Identificação do Núcleo (com Endereço); 2. Chefia Imediata e Ato Governamental; 3. Gestão de Normativas. O Núcleo não possui bloco de unidades subordinadas.
- Dados cadastrais, endereço e normativas serão apresentados somente para leitura, com quebra de linha para textos longos e sem indicação de obrigatoriedade.
- A interface deverá seguir os padrões de acessibilidade definidos nas Padronizações do SIAGE-RH e os comportamentos acessíveis disponibilizados pelos componentes da biblioteca SIAGE-UI. Particularidades deverão ser especificadas no detalhamento dos respectivos elementos.

#### 4.2.2 Identificação do Núcleo

- Apresentar Nome do Núcleo, Tipo de Vínculo e Unidade Superior na primeira linha; Unidade de Trabalho (UTB), Situação e Criador/Editor na segunda; Data de Criação na sequência.
- Tipo de Vínculo deverá informar “Gerência Regional” ou “Subgerência” e Unidade Superior exibirá o nome da entidade efetivamente vinculada. Apenas um desses vínculos será apresentado como vínculo vigente.
- Exibir a UTB em Código + Nome e a situação como “Ativo” ou “Inativo”, sem permitir mudança. Permitir consulta de registros ativos e inativos a usuários autorizados.
- A subseção Endereço apresentará CEP, Município, Rua, Número, Bairro e Complemento cadastrados, sem edição. CEP será exibido com máscara 00000-000; eventual Complemento não informado será apresentado como “-”.

#### 4.2.3 Chefia Imediata, Ato Governamental e histórico

- Apresentar Nome, Matrícula, CPF, Cargo e Situação Funcional do Chefe Imediato, em texto comum, quando houver.
- Exibir Ato Governamental associado com Número, Data da Publicação e documento; Visualizar e Baixar estarão disponíveis quando existir arquivo.
- Sem chefe atual, apresentar “Nenhum Chefe Imediato vinculado no momento.” e manter a ação Consultar histórico, que não exige chefia vigente.
- O histórico do Ato Governamental deverá seguir a RF006 global, com até 5 registros por página e sem alteração de atos ou chefias.

#### 4.2.4 Gestão de Normativas e anexos

- Exibir Normativa de Criação com Nome, Número, Data da Publicação e documento, sem permitir edição.
- Exibir Normativa de Extinção somente quando houver documento cadastrado; na ausência, ocultar todo o bloco de Extinção.
- Permitir Visualizar e Baixar cada arquivo disponível no formato original; a pré-visualização utiliza modal de PDF ou imagem, conforme LAC-001.

#### 4.2.5 Ações, navegação e feedback

- Voltar no cabeçalho e rodapé retorna à RF001 sem modificar dados.
- Editar, quando disponível e autorizado, direciona à RF004 apenas para registro ativo.
- Consulta por registro inexistente deve comunicar a indisponibilidade e retornar à listagem, sem expor dados de outro registro. Erro de requisição seguirá o toast global.

## 5) Detalhamento da funcionalidade

### 5.1 Cabeçalho e navegação

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Breadcrumbs</strong> | <ul><li><strong>Tipo:</strong> Navegação contextual.</li><li><strong>Componente SIAGE-UI:</strong> SPageHeaderComponent (s-page-header: breadcrumbs).</li><li><strong>Exibição:</strong> Início / Configurações / Hierarquia de Unidades e Cargos / Configurar Núcleo / Visualizar.</li><li><strong>Comportamentos:</strong><ul><li>Os níveis anteriores deverão ser navegáveis e o último nível representará a página atual.</li></ul></li></ul> |
| <strong>Voltar</strong> | <ul><li><strong>Label:</strong> “Voltar”.</li><li><strong>Tipo:</strong> IconButton.</li><li><strong>Componente SIAGE-UI:</strong> SPageHeaderComponent (s-page-header: showBack).</li><li><strong>Formato:</strong> Ação secundária.</li><li><strong>Habilitação:</strong> Sempre disponível.</li><li><strong>Comportamentos:</strong><ul><li>Retorna à listagem Configurar Núcleo.</li></ul></li></ul> |
| <strong>Título e descrição</strong> | <ul><li><strong>Título:</strong> “Visualizar Núcleo”.</li><li><strong>Tipo:</strong> Título de página e texto descritivo.</li><li><strong>Componente SIAGE-UI:</strong> SPageHeaderComponent (s-page-header: title e description).</li><li><strong>Descrição:</strong> “Consulte as informações cadastrais, endereço, chefia e normativas desta unidade.”</li><li><strong>Comportamentos:</strong><ul><li>Apresenta o contexto da funcionalidade no cabeçalho da página.</li></ul></li></ul> |

### 5.2 Bloco 1 — Identificação do Núcleo

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Card de Identificação</strong> | <ul><li><strong>Tipo:</strong> Bloco informativo somente leitura.</li><li><strong>Componente SIAGE-UI:</strong> Agrupamento visual com rótulos e informações textuais.</li><li><strong>Comportamentos:</strong><ul><li>Apresenta Nome do Núcleo, Tipo de Vínculo, Unidade Superior, UTB, Situação, Criador/Editor, Data de Criação e subseção Endereço.</li><li>A identificação conserva o vínculo com a unidade superior efetivamente selecionada.</li></ul></li></ul> |
| <strong>Nome do Núcleo</strong> | <ul><li><strong>Label:</strong> “Nome do Núcleo”.</li><li><strong>Tipo:</strong> Campo informativo textual.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong><ul><li>Exibe o nome cadastrado sem permitir alteração; informações extensas deverão quebrar linha.</li></ul></li></ul> |
| <strong>Tipo de Vínculo</strong> | <ul><li><strong>Label:</strong> “Tipo de Vínculo”.</li><li><strong>Tipo:</strong> Campo informativo textual.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong> Exibe “Gerência Regional” ou “Subgerência”, conforme o vínculo cadastrado, sem permitir alteração.</li></ul> |
| <strong>Unidade Superior</strong> | <ul><li><strong>Label:</strong> “Unidade Superior”.</li><li><strong>Tipo:</strong> Campo informativo textual.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong><ul><li>Exibe o nome da Gerência Regional ou Subgerência escolhida no cadastro; não exibe dois vínculos superiores simultaneamente.</li><li>Apresenta o valor como somente leitura.</li></ul></li></ul> |
| <strong>Unidade de Trabalho (UTB)</strong> | <ul><li><strong>Label:</strong> “Unidade de Trabalho (UTB)”.</li><li><strong>Tipo:</strong> Campo informativo textual.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong><ul><li>Exibe Código + Nome da UTB vinculada ao Núcleo; informação somente leitura.</li></ul></li></ul> |
| <strong>Situação</strong> | <ul><li><strong>Label:</strong> “Situação”.</li><li><strong>Tipo:</strong> Campo informativo textual.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong><ul><li>Retorna “Ativo” ou “Inativo” como texto comum, sem oferecer alteração na visualização.</li></ul></li></ul> |
| <strong>Criador/Editor</strong> | <ul><li><strong>Label:</strong> “Criador/Editor”.</li><li><strong>Tipo:</strong> Campo informativo textual.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong><ul><li>Exibe o responsável pelo cadastro ou última edição.</li></ul></li></ul> |
| <strong>Data de Criação</strong> | <ul><li><strong>Label:</strong> “Data de Criação”.</li><li><strong>Tipo:</strong> Campo informativo textual.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Formato:</strong> DD/MM/AAAA HH:MM</li><li><strong>Comportamentos:</strong><ul><li>Exibe a data/hora do cadastro.</li></ul></li></ul> |
| <strong>Endereço</strong> | <ul><li><strong>Tipo:</strong> Subseção somente leitura do cadastro do Núcleo.</li><li><strong>Componente SIAGE-UI:</strong> Rótulos e informações textuais agrupados no card Identificação.</li><li><strong>Comportamentos:</strong> Apresenta CEP, Município, Rua, Número, Bairro e Complemento, sem edição. Quando o Complemento não estiver cadastrado, apresentar “-”, sem inventar informação.</li></ul> |
| <strong>CEP</strong> | <ul><li><strong>Label:</strong> “CEP”.</li><li><strong>Tipo:</strong> Informação textual somente leitura.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong> Exibe o CEP cadastrado com a máscara 00000-000, quando disponível.</li></ul> |
| <strong>Município</strong> | <ul><li><strong>Label:</strong> “Município”.</li><li><strong>Tipo:</strong> Informação textual somente leitura.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong> Exibe o município da Paraíba associado ao endereço cadastrado.</li></ul> |
| <strong>Rua</strong> | <ul><li><strong>Label:</strong> “Rua”.</li><li><strong>Tipo:</strong> Informação textual somente leitura.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong> Exibe a Rua cadastrada, com quebra de linha quando necessário.</li></ul> |
| <strong>Número</strong> | <ul><li><strong>Label:</strong> “Número”.</li><li><strong>Tipo:</strong> Informação textual somente leitura.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong> Exibe o Número do endereço cadastrado, quando informado.</li></ul> |
| <strong>Bairro</strong> | <ul><li><strong>Label:</strong> “Bairro”.</li><li><strong>Tipo:</strong> Informação textual somente leitura.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong> Exibe o Bairro cadastrado, com quebra de linha para textos longos.</li></ul> |
| <strong>Complemento</strong> | <ul><li><strong>Label:</strong> “Complemento”.</li><li><strong>Tipo:</strong> Informação textual somente leitura.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica; informação textual.</li><li><strong>Comportamentos:</strong> Exibe o Complemento cadastrado, com quebra de linha para textos longos.</li></ul> |

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

### 5.4 Bloco 3 — Gestão de Normativas

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

### 5.5 Ações gerais da página

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Editar</strong> | <ul><li><strong>Label:</strong> “Editar”.</li><li><strong>Tipo:</strong> Button.</li><li><strong>Componente SIAGE-UI:</strong> SButtonComponent (s-button: variant primary, icon edit) projetado no SPageHeaderComponent.</li><li><strong>Formato:</strong> Ação primária.</li><li><strong>Visibilidade:</strong> Somente quando houver permissão de edição e registro ativo.</li><li><strong>Comportamentos:</strong><ul><li>Direciona à RF004 — Editar Núcleo.</li></ul></li></ul> |
| <strong>Voltar — rodapé</strong> | <ul><li><strong>Label:</strong> “Voltar”.</li><li><strong>Tipo:</strong> Button.</li><li><strong>Componente SIAGE-UI:</strong> SButtonComponent (s-button).</li><li><strong>Comportamentos:</strong><ul><li>Retorna à listagem sem modificar dados.</li></ul></li></ul> |
| <strong>Informações de auditoria</strong> | <ul><li><strong>Tipo:</strong> Informações textuais.</li><li><strong>Componente SIAGE-UI:</strong> Não se aplica.</li><li><strong>Comportamentos:</strong><ul><li>Exibe data e responsável pelo cadastro; quando houver edição, data e responsável pela última atualização.</li></ul></li></ul> |

## 6) Modais

| Modal | Quando exibir | Título/Mensagem | Ações/Regras | Imagens |
| --- | --- | --- | --- | --- |
| <strong>6.1 Histórico de Atos Governamentais</strong> | Ao acionar Consultar histórico, com ou sem Chefe Imediato atual. | Título: “Histórico de Atos Governamentais”. | <ul><li><strong>Consulta:</strong><ul><li>Apresenta os atos associados ao Núcleo e aos seus respectivos Chefes Imediatos; Data do Cadastro e Responsável pelo Cadastro.</li><li>Paginação de até 5 registros por página, ações Visualizar/Baixar e fechamento sem alteração.</li><li>Reutiliza as regras da RF006 global — Histórico de Atos Governamentais.</li></ul></li></ul> |  |
| <strong>6.2 Visualizar anexo</strong> | Ao acionar Visualizar no Ato Governamental, Normativa de Criação, Extinção ou histórico. | Título: “Visualizar anexo”. | <ul><li><strong>Pré-visualização:</strong><ul><li>Modal PDF/imagem; lacuna de biblioteca LAC-001; sem edição do arquivo.</li></ul></li><li><strong>Baixar arquivo:</strong><ul><li>Permite o download do formato original.</li></ul></li><li><strong>Fechar / X:</strong><ul><li>Fecha a pré-visualização e retorna ao contexto de consulta, sem modificar dados.</li></ul></li></ul> |  |

## 7) Toast

| Toast | Quando exibir | Título/Mensagem | Ações/Regras | Imagens |
| --- | --- | --- | --- | --- |
| <strong>Registro não encontrado</strong> | Ao acessar Núcleo inexistente ou indisponível. | Título: “Núcleo não encontrada.” Mensagem: Não se aplica. | <ul><li><strong>Componente SIAGE-UI:</strong><ul><li>SToastService (error).</li></ul></li><li><strong>Ações/Regras:</strong><ul><li>Comunica a indisponibilidade e retorna à listagem, sem expor outro registro.</li></ul></li></ul> |  |
| <strong>Erro genérico de requisição</strong> | Quando a consulta falhar sem mensagem funcional específica. | Título: “Não foi possível concluir a solicitação.” Mensagem: “Tente novamente.” | <ul><li><strong>Componente SIAGE-UI:</strong><ul><li>SToastService (error).</li></ul></li><li><strong>Ações/Regras:</strong><ul><li>Aplica o padrão global de erro e preserva navegação segura.</li></ul></li></ul> |  |

## 8) Protótipos

| Protótipo |
| --- |
| <strong>Visualizar Núcleo — identificação, vínculo e normativas</strong> |
|  |
| <strong>Visualizar Núcleo — sem chefe imediato</strong> |
|  |
| <strong>Visualizar Núcleo — identificação e endereço</strong> |
|  |
| <strong>Visualizar Núcleo — sem Normativa de Extinção</strong> |
|  |

## 9) Lacunas da biblioteca SIAGE-UI

Aplica-se a LAC-001 já documentada em Hierarquia para a pré-visualização de PDF e imagens. Nenhuma nova lacuna foi identificada.

| Identificador | Elemento da RF | Necessidade não atendida | Referência na RF |
| --- | --- | --- | --- |
| LAC-001 (referência existente) | Pré-visualização de PDFs e imagens. | A biblioteca SIAGE-UI não oferece visualizador dedicado de PDF/imagem; aplica-se a lacuna já documentada nas RFs de Hierarquia. | Seção 6 — Visualizar anexo. |
