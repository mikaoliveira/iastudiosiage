# [RF005] Buscar Servidor — Funcionalidade Global de Hierarquia

## 1) Histórico

| Data | Versão | Descrição | Autor | Versão mind | Sprint de desenvolvimento |
| --- | --- | --- | --- | --- | --- |
| 28 de out. de 2026 | 1.0 | Criação da funcionalidade | Mikael Oliveira | 01 | SPXXX |

## 2) História de Usuário

Eu, como usuário do SIAGE-RH, na qualidade de Administrador ou usuário com permissão de acesso,

Quero localizar e selecionar um servidor por meio da funcionalidade Buscar Servidor,

Para vinculá-lo à unidade ou função prevista na operação de Hierarquia em andamento, respeitando o contexto da unidade e as regras de elegibilidade aplicáveis.

## 3) Fluxo de acesso à funcionalidade

**Fluxo compartilhado:** Login >> Selecionar Matrícula, quando aplicável >> Página Inicial >> Configurações >> Hierarquia de Unidades e Cargos >> Funcionalidade de origem >> Ação de seleção de servidor >> Buscar Servidor.

**Fluxo documentado para Secretaria Geral:** Login >> Selecionar Matrícula, quando aplicável >> Página Inicial >> Configurações >> Hierarquia de Unidades e Cargos >> Configurar Secretaria Geral >> Adicionar ou Editar >> Chefia Imediata e Ato Governamental >> Adicionar Chefe >> Buscar Servidor.

**Pré-condições:**

- O usuário deverá estar autenticado e autorizado a executar a operação de origem, ou possuir perfil Administrador conforme as regras gerais de permissão.
- A tela de origem deverá fornecer a unidade de referência da consulta e permitir a seleção de servidor naquele contexto.
- Na Secretaria Geral, deverá haver uma Unidade de Trabalho (UTB) válida selecionada e não poderá existir outro Chefe Imediato vinculado no formulário. Para substituição, o chefe atual deverá ser removido antes de adicionar outro.
- O modal é contextual e não possui rota de acesso independente.

## 4) Critérios de Aceite

### 4.1 Acesso e permissões

- O modal deverá ser disponibilizado a partir de uma funcionalidade de Hierarquia que permita selecionar servidor, respeitando as permissões da respectiva operação.
- A aplicação deverá validar as permissões de origem antes de disponibilizar dados dos servidores e a ação de seleção.
- O acesso direto indevido não deverá disponibilizar dados da consulta.
- No contexto da Secretaria Geral, o modal deverá ser aberto exclusivamente pela ação **Adicionar Chefe** das operações Adicionar ou Editar, quando atendidas as pré-condições.

### 4.2 Regras gerais

#### 4.2.1 Estrutura e apresentação

- A funcionalidade deverá abrir o modal **“Buscar Servidor”**, com título simples, botão de fechamento X, filtros de pesquisa, tabela de resultados e ação Cancelar no rodapé.
- O modal não deverá alterar nem persistir dados do registro de origem apenas por ser aberto ou por executar uma pesquisa.
- Os campos deverão apresentar labels externas.
- A interface deverá seguir os padrões de acessibilidade definidos nas Padronizações do SIAGE-RH e os comportamentos acessíveis disponibilizados pelos componentes da biblioteca SIAGE-UI. Particularidades deverão ser especificadas no detalhamento dos respectivos elementos.

#### 4.2.2 Contexto da consulta e filtros

- A pesquisa deverá utilizar o contexto de unidade recebido da funcionalidade de origem. **Na Secretaria Geral, consultar somente servidores vinculados à UTB selecionada.**
- A listagem deverá iniciar vazia e apresentar registros somente depois de uma pesquisa com ao menos um critério.
- Os filtros serão **Matrícula**, **Nome do Servidor** e **CPF**, usados isoladamente ou em combinação.
- Matrícula: numérica, sem máscara, máximo de 7 dígitos; permitir consulta por matrícula inteira ou parcial (por exemplo, “170”).
- Nome do Servidor: texto alfanumérico e caracteres especiais, máximo de 200 caracteres; permitir pesquisa parcial, sem distinguir maiúsculas de minúsculas.
- CPF: somente dígitos, máximo de 11, máscara `000.000.000-00`; permitir pesquisa pelo CPF completo ou por parte dos dígitos informados.
- **Buscar** deverá permanecer desabilitado sem critérios; com ao menos um filtro preenchido, poderá executar a pesquisa pelo botão ou pela tecla ENTER.
- **Limpar** deverá limpar os três filtros, remover os critérios aplicados e restaurar a listagem vazia inicial, retornando à primeira página.

#### 4.2.3 Resultados, ordenação e paginação

- A tabela deverá apresentar as colunas **Nome, CPF, Matrícula, Situação Funcional e Ação**, nessa ordem, sem a coluna Cargo.
- Na aplicação documentada para Secretaria Geral, todos os servidores da UTB correspondentes aos critérios poderão ser consultados, independentemente da Situação Funcional.
- Os servidores com situação **“Em exercício”** deverão aparecer primeiro, em ordem alfabética pelo Nome (A a Z). Os demais servidores permanecerão visíveis para consulta, sem poderem ser selecionados.
- Na Secretaria Geral, até 5 registros por página, com indicação “Exibindo X de Y Registros” e controles para primeira página, anterior, páginas numeradas, próxima e última. A paginação de outras funcionalidades deverá apresentar no máximo 5 registros por página.
- A pesquisa e a limpeza deverão retornar a listagem à primeira página.
- Sem correspondências, a tabela deverá exibir **“Nenhum servidor encontrado para os critérios informados.”**, sem toast para ausência de resultados.

#### 4.2.4 Elegibilidade, seleção e retorno

- Na Secretaria Geral, a ação **Adicionar** deverá estar disponível exclusivamente para servidor vinculado à UTB e com Situação Funcional **“Em exercício”**.
- Servidores em outras situações deverão continuar visíveis na tabela, sem ação de seleção disponível, acompanhados da orientação de que somente servidores “Em exercício” podem ser designados como Chefe Imediato.
- Ao selecionar servidor elegível, o modal deverá ser fechado, devolvendo sua identificação ao formulário de origem.
- Na Secretaria Geral, a seleção deverá preencher o bloco Chefia Imediata com **Nome, Matrícula, CPF, Cargo e Situação Funcional** do servidor escolhido. Apenas um Chefe Imediato poderá estar vinculado por vez, e Número, Data da Publicação e documento do Ato Governamental de Nomeação serão obrigatórios antes de salvar ou atualizar.
- **A seleção no modal não efetua a persistência da Secretaria Geral.** O cadastro ou a edição somente será persistido pela ação correspondente no formulário de origem.
- **Cancelar** e **Fechar (X)** deverão encerrar o modal sem selecionar servidor ou alterar os dados já preenchidos no formulário de origem.

#### 4.2.5 Validações e feedback

- Os filtros deverão respeitar os respectivos formatos e limites. Caracteres não numéricos não deverão integrar a consulta de Matrícula ou CPF.
- Na Secretaria Geral, não deverá ser possível selecionar servidor sem UTB válida ou quando já houver Chefe Imediato vinculado no formulário.
- A seleção bem-sucedida deverá apresentar a comunicação prevista para a operação de origem. Na Secretaria Geral, a mensagem deverá orientar o preenchimento do Ato Governamental de Nomeação.
- Falhas de requisição sem mensagem de negócio deverão utilizar o toast genérico de erro, sem expor informações técnicas e sem alterar o vínculo de chefia.

### 4.3 Aplicação por CRUD

| CRUD / operação | Abertura e unidade de referência | Elegibilidade e destino da seleção | Listagem e paginação | Persistência e retorno |
| --- | --- | --- | --- | --- |
| **Secretaria Geral — Adicionar (RF002)** | Adicionar Chefe; UTB selecionada; nenhum chefe atual | Servidor vinculado à UTB e “Em exercício”; retorna como Chefe Imediato único, com Ato Governamental obrigatório | “Em exercício” primeiro, Nome A–Z; **até 5 por página** | Seleção apenas no formulário; persistência pela ação **Salvar** |
| **Secretaria Geral — Editar (RF004)** | Adicionar Chefe; UTB selecionada; nenhum chefe atual | Servidor vinculado à UTB e “Em exercício”; retorna como Chefe Imediato único, com Ato Governamental obrigatório | “Em exercício” primeiro, Nome A–Z; **até 5 por página** | Seleção apenas no formulário; persistência pela ação **Atualizar** |

## 5) Detalhamento da funcionalidade

### 5.1 Estrutura do modal

| Nome do campo | Detalhamento do campo |
| --- | --- |
| **Modal Buscar Servidor** | <ul><li><strong>Título:</strong> “Buscar Servidor”.</li><li><strong>Tipo:</strong> Modal contextual de seleção.</li><li><strong>Componente SIAGE-UI:</strong> SModalComponent (s-modal), aberto por SModalService (open).</li><li><strong>Comportamentos:</strong><ul><li>Exibe cabeçalho com título e X, filtros de pesquisa, listagem paginada e rodapé com Cancelar.</li><li>Não possui rota independente.</li></ul></li></ul> |
| **Bloco de filtros** | <ul><li><strong>Tipo:</strong> Agrupamento de filtros.</li><li><strong>Componente SIAGE-UI:</strong> SFilterCardComponent (s-filter-card), com SFieldComponent e SButtonComponent.</li><li><strong>Comportamentos:</strong> Organiza Matrícula, Nome do Servidor e CPF com labels externas, além das ações Limpar e Buscar.</li></ul> |
| **Tabela de resultados** | <ul><li><strong>Tipo:</strong> Listagem paginada.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: columns e rows; configuração STableColumn).</li><li><strong>Colunas:</strong> Nome, CPF, Matrícula, Situação Funcional e Ação.</li><li><strong>Comportamentos:</strong><ul><li>Inicialmente sem registros;</li><li>preenche após pesquisa válida, respeitando a unidade e as regras de seleção aplicáveis.</li></ul></li></ul> |
| **Paginação** | <ul><li><strong>Tipo:</strong> Controle de navegação de páginas.</li><li><strong>Componente SIAGE-UI:</strong> SPaginationComponent (s-pagination), integrado ao STableComponent (s-table: page, pageSize e total).</li><li><strong>Apresentação:</strong> “Exibindo X de Y Registros”, primeira/anterior/páginas/próxima/última.</li><li><strong>Comportamentos:</strong><ul><li>Na Secretaria Geral, até 5 registros por página;</li><li>reinicia a página ao pesquisar ou limpar.</li></ul></li></ul> |
| **Rodapé do modal** | <ul><li><strong>Tipo:</strong> Área de ações.</li><li><strong>Componente SIAGE-UI:</strong> SModalFooterDirective (sModalFooter) e SButtonComponent (s-button).</li><li><strong>Comportamentos:</strong> Apresenta Cancelar à direita, encerrando a consulta sem seleção.</li></ul> |

### 5.2 Campos de pesquisa

| Nome do campo | Detalhamento do campo |
| --- | --- |
| **Matrícula** | <ul><li><strong>Label:</strong> “Matrícula”.</li><li><strong>Tipo:</strong> Campo de pesquisa numérico sem máscara.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field) e SInputComponent (s-input: maxlength 7).</li><li><strong>Obrigatoriedade:</strong> Opcional.</li><li><strong>Placeholder:</strong> “Digite a matrícula”.</li><li><strong>Limite:</strong> 7 dígitos.</li><li><strong>Comportamentos:</strong><ul><li>Aceita apenas dígitos, sem pontos, espaços ou hífens.</li><li>Permite pesquisa por matrícula completa ou parcial e combinação com os demais filtros.</li></ul></li></ul> |
| **Nome do Servidor** | <ul><li><strong>Label:</strong> “Nome do Servidor”.</li><li><strong>Tipo:</strong> Campo de texto alfanumérico e caracteres especiais.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field) e SInputComponent (s-input: maxlength 200).</li><li><strong>Obrigatoriedade:</strong> Opcional.</li><li><strong>Placeholder:</strong> “Digite o servidor”.</li><li><strong>Limite:</strong> 200 caracteres.</li><li><strong>Comportamentos:</strong> Pesquisa parcial, sem diferenciar letras maiúsculas e minúsculas, isoladamente ou em combinação com Matrícula e CPF.</li></ul> |
| **CPF** | <ul><li><strong>Label:</strong> “CPF”.</li><li><strong>Tipo:</strong> Campo de pesquisa numérico com máscara.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field) e SInputComponent (s-input: maxlength 14); máscara aplicada pela funcionalidade.</li><li><strong>Obrigatoriedade:</strong> Opcional.</li><li><strong>Placeholder:</strong> “Digite o CPF”.</li><li><strong>Máscara:</strong> <code>000.000.000-00</code>.</li><li><strong>Limite:</strong> 11 dígitos, sem contar a máscara.</li><li><strong>Comportamentos:</strong><ul><li>Aceita somente dígitos e pesquisa por CPF completo ou parcial;</li><li>combinável com os demais filtros.</li></ul></li></ul> |

### 5.3 Resultados e colunas

| Nome do campo | Detalhamento do campo |
| --- | --- |
| **Nome** | <ul><li><strong>Label:</strong> “Nome”.</li><li><strong>Tipo:</strong> Coluna textual.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn).</li><li><strong>Comportamentos:</strong><ul><li>Exibe o nome do servidor;</li><li>na Secretaria Geral, servidores “Em exercício” são priorizados e ordenados alfabeticamente.</li></ul></li></ul> |
| **CPF** | <ul><li><strong>Label:</strong> “CPF”.</li><li><strong>Tipo:</strong> Coluna textual de documento.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn).</li><li><strong>Apresentação:</strong> Máscara <code>000.000.000-00</code>.</li><li><strong>Comportamentos:</strong> Exibe CPF do servidor sem permitir edição.</li></ul> |
| **Matrícula** | <ul><li><strong>Label:</strong> “Matrícula”.</li><li><strong>Tipo:</strong> Coluna numérica.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn).</li><li><strong>Apresentação:</strong> Dígitos sem máscara (ex.: “170”).</li><li><strong>Comportamentos:</strong> Exibe a matrícula do servidor vinculado à unidade consultada.</li></ul> |
| **Situação Funcional** | <ul><li><strong>Label:</strong> “Situação Funcional”.</li><li><strong>Tipo:</strong> Coluna textual.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn).</li><li><strong>Apresentação:</strong> Texto simples, sem badge ou flag.</li><li><strong>Comportamentos:</strong><ul><li>Exibe a situação funcional;</li><li>na Secretaria Geral, somente “Em exercício” permite a ação Adicionar.</li></ul></li></ul> |
| **Ação** | <ul><li><strong>Label:</strong> “Ação”.</li><li><strong>Tipo:</strong> Coluna de ação.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table), STableCellDirective (sTableCell), SIconButtonComponent (s-icon-button) e STooltipDirective (sTooltip).</li><li><strong>Apresentação:</strong> IconButton “+”, tooltip “Adicionar” e aria-label “Adicionar”.</li><li><strong>Comportamentos:</strong><ul><li>Última coluna da tabela.</li><li>A ação fica disponível somente para servidores elegíveis no contexto da origem.</li></ul></li></ul> |

### 5.4 Ações do modal

| Nome do campo | Detalhamento do campo |
| --- | --- |
| **Buscar** | <ul><li><strong>Label:</strong> “Buscar”.</li><li><strong>Tipo:</strong> Button.</li><li><strong>Componente SIAGE-UI:</strong> SButtonComponent (s-button: type submit, variant primary, icon search).</li><li><strong>Formato:</strong> Ação primária.</li><li><strong>Habilitação:</strong> Pelo menos um filtro preenchido.</li><li><strong>Comportamentos:</strong><ul><li>Consulta os servidores da unidade de referência com os critérios informados.</li><li>ENTER equivale ao acionamento de Buscar;</li><li>reinicia a paginação e atualiza os resultados.</li></ul></li></ul> |
| **Limpar** | <ul><li><strong>Label:</strong> “Limpar”.</li><li><strong>Tipo:</strong> Button.</li><li><strong>Componente SIAGE-UI:</strong> SButtonComponent (s-button: variant secondary, outlined).</li><li><strong>Formato:</strong> Ação secundária.</li><li><strong>Habilitação:</strong> Sempre disponível.</li><li><strong>Comportamentos:</strong><ul><li>Limpa os três filtros, remove os critérios, retorna à primeira página e restaura a listagem vazia.</li><li>Se já estiver vazio, não altera o estado.</li></ul></li></ul> |
| **Adicionar servidor** | <ul><li><strong>Label:</strong> “Adicionar”.</li><li><strong>Tipo:</strong> IconButton com “+”.</li><li><strong>Componente SIAGE-UI:</strong> SIconButtonComponent (s-icon-button: icon add, variant primary, text) e STooltipDirective (sTooltip).</li><li><strong>Formato:</strong> Ação ghost.</li><li><strong>Tooltip:</strong> “Adicionar”.</li><li><strong>Aria-label:</strong> “Adicionar”.</li><li><strong>Visibilidade:</strong> Na Secretaria Geral, somente para “Em exercício”.</li><li><strong>Comportamentos:</strong><ul><li>Seleciona o servidor da linha e fecha o modal.</li><li>Na Secretaria Geral, preenche Chefia Imediata e exige Ato Governamental;</li><li>a persistência depende de Salvar ou Atualizar na origem.</li></ul></li></ul> |
| **Cancelar** | <ul><li><strong>Label:</strong> “Cancelar”.</li><li><strong>Tipo:</strong> Button.</li><li><strong>Componente SIAGE-UI:</strong> SButtonComponent (s-button: variant secondary, outlined), no SModalFooterDirective (sModalFooter).</li><li><strong>Formato:</strong> Ação secundária.</li><li><strong>Habilitação:</strong> Sempre disponível.</li><li><strong>Comportamentos:</strong> Fecha o modal e retorna ao formulário, sem seleção ou alteração dos dados.</li></ul> |
| **Fechar (X)** | <ul><li><strong>Label:</strong> “Fechar modal”.</li><li><strong>Tipo:</strong> IconButton no cabeçalho.</li><li><strong>Componente SIAGE-UI:</strong> SModalComponent (s-modal: closable e cancel).</li><li><strong>Aria-label:</strong> “Fechar modal”.</li><li><strong>Comportamentos:</strong> Executa o mesmo comportamento de Cancelar.</li></ul> |

### 5.5 Estados da consulta

| Nome do campo | Detalhamento do campo |
| --- | --- |
| **Inicial, antes de Buscar** | <ul><li><strong>Tipo:</strong> Estado da listagem.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: rows vazias).</li><li><strong>Comportamentos:</strong> Tabela vazia até pesquisa com pelo menos um critério.</li></ul> |
| **Resultados encontrados** | <ul><li><strong>Tipo:</strong> Estado da listagem.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: rows, page, pageSize e total).</li><li><strong>Comportamentos:</strong> Apresenta registros correspondentes à consulta, com paginação, ordenação e ações de acordo com o contexto.</li></ul> |
| **Nenhum resultado** | <ul><li><strong>Tipo:</strong> Estado da listagem.</li><li><strong>Componente SIAGE-UI:</strong> STableComponent (s-table: empty, variant no-results), com SEmptyStateComponent (s-empty-state).</li><li><strong>Mensagem:</strong> “Nenhum servidor encontrado para os critérios informados.”</li><li><strong>Comportamentos:</strong> Apresenta mensagem na própria tabela, sem toast de ausência de resultados.</li></ul> |
| **Servidor não elegível** | <ul><li><strong>Tipo:</strong> Estado da ação na listagem.</li><li><strong>Componente SIAGE-UI:</strong> STableCellDirective (sTableCell) e STooltipDirective (sTooltip).</li><li><strong>Comportamentos:</strong> Na Secretaria Geral, servidores que não estiverem “Em exercício” permanecem visíveis para consulta, sem ação Adicionar disponível.</li></ul> |
| **Erro genérico da consulta** | <ul><li><strong>Tipo:</strong> Falha de requisição.</li><li><strong>Componente SIAGE-UI:</strong> SToastService (error).</li><li><strong>Comportamentos:</strong><ul><li>Não seleciona servidor nem altera o formulário;</li><li>apresenta o toast de erro do item 7.</li></ul></li></ul> |

## 6) Modais

| Modal | Quando exibir | Título/Mensagem | Ações/Regras | Imagens |
| --- | --- | --- | --- | --- |
| <strong>6.1 Buscar Servidor</strong> | Ao acionar a seleção de servidor em uma operação de Hierarquia habilitada. Em Secretaria Geral, pelo botão “Adicionar Chefe”, com UTB válida e sem chefe selecionado. | <strong>Título</strong>: “Buscar Servidor”.<br><strong>Mensagem</strong>: Não se aplica. | <ul><li><strong>Componente SIAGE-UI:</strong> SModalComponent (s-modal), aberto por SModalService (open).</li><li><strong>Ações/Regras:</strong> Contém filtros, resultados, Adicionar, Cancelar e X, conforme seção 5; sem persistir o registro de origem ao selecionar.</li></ul> |  |

## 7) Toast

| Toast | Quando exibir | Título/Mensagem | Ações/Regras | Imagens |
| --- | --- | --- | --- | --- |
| **Servidor selecionado — Secretaria Geral** | Após selecionar, pelo ícone “+”, servidor “Em exercício” e retornar ao formulário de Secretaria Geral. | <strong>Título:</strong> “Servidor {Nome do Servidor} selecionado. Preencha os dados e anexe o Ato Governamental de Nomeação.”<br><strong>Mensagem:</strong> Não se aplica. | Confirma a seleção no formulário; não representa cadastro nem edição concluídos. O Ato Governamental deverá ser preenchido antes de persistir.<br><strong>Componente SIAGE-UI</strong>: SToastService (success). |  |
| **Erro genérico de requisição** | Quando a consulta falhar sem mensagem funcional específica. | <strong>Título:</strong> “Não foi possível concluir a solicitação.”<br><strong>Mensagem:</strong> “Tente novamente.” | Exibe o erro global sem dados técnicos; não seleciona servidor nem altera o formulário de origem.<br><strong>Componente SIAGE-UI</strong>: SToastService (error). |  |

## 8) Protótipos

| Buscar Servidor — Secretaria Geral<br>Modal contextual com filtros, listagem, seleção e rodapé. |
| --- |
|  |
| Buscar Servidor — Sem acesso à funcionalidade<br>Cenário de acesso não autorizado. |
|  |


