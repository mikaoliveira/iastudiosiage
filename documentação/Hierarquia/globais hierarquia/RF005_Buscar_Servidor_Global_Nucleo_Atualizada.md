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

**Fluxo documentado para Secretaria Executiva:** Login >> Selecionar Matrícula, quando aplicável >> Página Inicial >> Configurações >> Hierarquia de Unidades e Cargos >> Configurar Secretaria Executiva >> Adicionar ou Editar >> Chefia Imediata e Ato Governamental >> Adicionar Chefe >> Buscar Servidor.

**Fluxo documentado para Gerência Executiva:** Login >> Selecionar Matrícula, quando aplicável >> Página Inicial >> Configurações >> Hierarquia de Unidades e Cargos >> Configurar Gerência Executiva >> Adicionar ou Editar >> Chefia Imediata e Ato Governamental >> Adicionar Chefe >> Buscar Servidor.

**Fluxo documentado para Gerência Regional:** Login >> Selecionar Matrícula, quando aplicável >> Página Inicial >> Configurações >> Hierarquia de Unidades e Cargos >> Configurar Gerência Regional >> Adicionar ou Editar >> Chefia Imediata e Ato Governamental >> Adicionar Chefe >> Buscar Servidor.

**Fluxo documentado para Subgerência:** Login >> Selecionar Matrícula, quando aplicável >> Página Inicial >> Configurações >> Hierarquia de Unidades e Cargos >> Configurar Subgerência >> Adicionar ou Editar >> Chefia Imediata e Ato Governamental >> Adicionar Chefe >> Buscar Servidor.

**Fluxo documentado para Núcleo:** Login >> Selecionar Matrícula, quando aplicável >> Página Inicial >> Configurações >> Hierarquia de Unidades e Cargos >> Configurar Núcleo >> Adicionar ou Editar >> Chefia Imediata e Ato Governamental >> Adicionar Chefe >> Buscar Servidor.

**Pré-condições:**

- O usuário deverá estar autenticado e autorizado a executar a operação de origem, ou possuir perfil Administrador conforme as regras gerais de permissão.

- A tela de origem deverá fornecer a unidade de referência da consulta e permitir a seleção de servidor naquele contexto.

- Na Secretaria Geral, deverá haver uma Unidade de Trabalho (UTB) válida selecionada e não poderá existir outro Chefe Imediato vinculado no formulário. Para substituição, o chefe atual deverá ser removido antes de adicionar outro.

- Na Secretaria Executiva, deverá haver Secretaria Geral vinculada e uma UTB válida selecionada, sem Chefe Imediato atual no formulário. Para substituição, o chefe atual também deverá ser removido antes de adicionar outro.

- Na Gerência Executiva, deverá haver Secretaria Executiva vinculada e uma UTB válida selecionada, sem Chefe Imediato atual no formulário. Para substituição, o chefe atual deverá ser removido antes de adicionar outro.

- Na Gerência Regional, deverá haver Secretaria Geral vinculada e uma UTB válida selecionada, sem Chefe Imediato atual no formulário. Para substituição, o chefe atual deverá ser removido antes de adicionar outro.

- Na Subgerência, deverá haver Gerência Executiva vinculada e uma UTB válida selecionada, sem Chefe Imediato atual no formulário. Para substituição, o chefe atual deverá ser removido antes de adicionar outro.

- No Núcleo, deverá haver um tipo de vínculo definido (Gerência Regional ou Subgerência), a unidade superior correspondente e uma UTB válida selecionada, sem Chefe Imediato atual no formulário. Para substituição, o chefe atual deverá ser removido antes de adicionar outro.

- O modal é contextual e não possui rota de acesso independente.

## 4) Critérios de Aceite

### 4.1 Acesso e permissões

- O modal deverá ser disponibilizado a partir de uma funcionalidade de Hierarquia que permita selecionar servidor, respeitando as permissões da respectiva operação.

- A aplicação deverá validar as permissões de origem antes de disponibilizar dados dos servidores e a ação de seleção.

- O acesso direto indevido não deverá disponibilizar dados da consulta.

- No contexto da Secretaria Geral, o modal deverá ser aberto exclusivamente pela ação **Adicionar Chefe** das operações Adicionar ou Editar, quando atendidas as pré-condições.

- No contexto da Secretaria Executiva, o modal deverá ser aberto pela ação **Adicionar Chefe** das operações Adicionar ou Editar, observando a permissão da operação, a UTB selecionada e a ausência de chefe já vinculado.

- No contexto da Gerência Executiva, o modal deverá ser aberto pela ação **Adicionar Chefe** das operações Adicionar ou Editar, observando a permissão da operação, a Secretaria Executiva vinculada, a UTB selecionada e a ausência de chefe já vinculado.

- No contexto da Gerência Regional, o modal deverá ser aberto pela ação **Adicionar Chefe** das operações Adicionar ou Editar, observando a permissão da operação, a Secretaria Geral vinculada, a UTB selecionada e a ausência de chefe já vinculado.

- No contexto da Subgerência, o modal deverá ser aberto pela ação **Adicionar Chefe** das operações Adicionar ou Editar, observando a permissão da operação, a Gerência Executiva vinculada, a UTB selecionada e a ausência de chefe já vinculado.

- No contexto do Núcleo, o modal deverá ser aberto pela ação **Adicionar Chefe** das operações Adicionar ou Editar, observando a permissão da operação, o vínculo definido com Gerência Regional ou Subgerência, a UTB selecionada e a ausência de chefe já vinculado.

### 4.2 Regras gerais

#### 4.2.1 Estrutura e apresentação

- A funcionalidade deverá abrir o modal **“Buscar Servidor”**, com título simples, botão de fechamento X, filtros de pesquisa, tabela de resultados e ação Cancelar no rodapé.

- O modal não deverá alterar nem persistir dados do registro de origem apenas por ser aberto ou por executar uma pesquisa.

- A interface deverá seguir os padrões de acessibilidade definidos nas Padronizações do SIAGE-RH e os comportamentos acessíveis disponibilizados pelos componentes da biblioteca SIAGE-UI. Particularidades deverão ser especificadas no detalhamento dos respectivos elementos.

#### 4.2.2 Contexto da consulta e filtros

- A pesquisa deverá utilizar o contexto de unidade recebido da funcionalidade de origem. **Na Secretaria Geral, na Secretaria Executiva, na Gerência Executiva, na Gerência Regional, na Subgerência e no Núcleo, consultar somente servidores vinculados à UTB selecionada.**

- A listagem deverá iniciar vazia e apresentar registros somente depois de uma pesquisa com ao menos um critério.

- Os filtros serão **Matrícula**, **Nome do Servidor** e **CPF**, usados isoladamente ou em combinação.

- Matrícula: numérica, sem máscara, máximo de 7 dígitos; permitir consulta por matrícula inteira ou parcial (por exemplo, “170”).

- Nome do Servidor: texto alfanumérico e caracteres especiais, máximo de 200 caracteres; permitir pesquisa parcial, sem distinguir maiúsculas de minúsculas.

- CPF: somente dígitos, máximo de 11, máscara \`000.000.000-00\`; permitir pesquisa pelo CPF completo ou por parte dos dígitos informados.

- **Buscar** deverá permanecer desabilitado sem critérios; com ao menos um filtro preenchido, poderá executar a pesquisa pelo botão ou pela tecla ENTER.

- **Limpar** deverá limpar os três filtros, remover os critérios aplicados e restaurar a listagem vazia inicial, retornando à primeira página.

#### 4.2.3 Resultados, ordenação e paginação

- A tabela deverá apresentar as colunas **Nome, CPF, Matrícula, Situação Funcional e Ação**, nessa ordem, sem a coluna Cargo.

- Nas aplicações documentadas para Secretaria Geral, Secretaria Executiva, Gerência Executiva, Gerência Regional, Subgerência e Núcleo, todos os servidores da UTB correspondentes aos critérios poderão ser consultados, independentemente da Situação Funcional.

- Os servidores com situação **“Em exercício”** deverão aparecer primeiro, em ordem alfabética pelo Nome (A a Z). Os demais servidores permanecerão visíveis para consulta, sem poderem ser selecionados.

- Na Secretaria Geral, na Secretaria Executiva, na Gerência Executiva, na Gerência Regional, na Subgerência e no Núcleo, até 5 registros por página, com indicação “Exibindo X de Y Registros” e controles para primeira página, anterior, páginas numeradas, próxima e última. A paginação de outras funcionalidades deverá apresentar no máximo 5 registros por página.

- A pesquisa e a limpeza deverão retornar a listagem à primeira página.

- Sem correspondências, a tabela deverá exibir **“Nenhum servidor encontrado para os critérios informados.”**, sem toast para ausência de resultados.

#### 4.2.4 Elegibilidade, seleção e retorno

- Na Secretaria Geral, na Secretaria Executiva, na Gerência Executiva, na Gerência Regional, na Subgerência e no Núcleo, a ação **Adicionar** deverá estar disponível exclusivamente para servidor vinculado à UTB e com Situação Funcional **“Em exercício”**.

- Servidores em outras situações deverão continuar visíveis na tabela, sem ação de seleção disponível, acompanhados da orientação de que somente servidores “Em exercício” podem ser designados como Chefe Imediato.

- Ao selecionar servidor elegível, o modal deverá ser fechado, devolvendo sua identificação ao formulário de origem.

- Na Secretaria Geral, na Secretaria Executiva, na Gerência Executiva, na Gerência Regional, na Subgerência e no Núcleo, a seleção deverá preencher o bloco Chefia Imediata com **Nome, Matrícula, CPF, Cargo e Situação Funcional** do servidor escolhido. Apenas um Chefe Imediato poderá estar vinculado por vez, e Número, Data da Publicação e documento do Ato Governamental de Nomeação serão obrigatórios antes de salvar ou atualizar.

- **A seleção no modal não efetua a persistência da Secretaria Geral, da Secretaria Executiva, da Gerência Executiva, da Gerência Regional, da Subgerência nem do Núcleo.** O cadastro ou a edição somente será persistido pela ação correspondente no formulário de origem.

- **Cancelar** e **Fechar (X)** deverão encerrar o modal sem selecionar servidor ou alterar os dados já preenchidos no formulário de origem.

#### 4.2.5 Validações e feedback

- Os filtros deverão respeitar os respectivos formatos e limites. Caracteres não numéricos não deverão integrar a consulta de Matrícula ou CPF.

- Na Secretaria Geral, na Secretaria Executiva, na Gerência Executiva, na Gerência Regional, na Subgerência e no Núcleo, não deverá ser possível selecionar servidor sem UTB válida ou quando já houver Chefe Imediato vinculado no formulário.

- A seleção bem-sucedida deverá apresentar a comunicação prevista para a operação de origem. Na Secretaria Geral, a mensagem deverá orientar o preenchimento do Ato Governamental de Nomeação. Na Secretaria Executiva, na Gerência Executiva, na Gerência Regional, na Subgerência e no Núcleo, a seleção também exige o preenchimento do Ato Governamental no formulário de origem.

- Falhas de requisição sem mensagem de negócio deverão utilizar o toast genérico de erro, sem expor informações técnicas e sem alterar o vínculo de chefia.

### 4.3 Aplicação por CRUD

| CRUD / operação | Abertura e unidade de referência | Elegibilidade e destino da seleção | Listagem e paginação | Persistência e retorno |
| --- | --- | --- | --- | --- |
| **Secretaria Geral — Adicionar (RF002)** | Adicionar Chefe; UTB selecionada; nenhum chefe atual | Servidor vinculado à UTB e “Em exercício”; retorna como Chefe Imediato único, com Ato Governamental obrigatório | “Em exercício” primeiro, Nome A–Z; **até 5 por página** | Seleção apenas no formulário; persistência pela ação **Salvar** |
| **Secretaria Geral — Editar (RF004)** | Adicionar Chefe; UTB selecionada; nenhum chefe atual | Servidor vinculado à UTB e “Em exercício”; retorna como Chefe Imediato único, com Ato Governamental obrigatório | “Em exercício” primeiro, Nome A–Z; **até 5 por página** | Seleção apenas no formulário; persistência pela ação **Atualizar** |
| **Secretaria Executiva — Adicionar (RF002)** | Adicionar Chefe; Secretaria Geral e UTB selecionadas; nenhum chefe atual | Servidor vinculado à UTB e “Em exercício”; retorna como Chefe Imediato único, com Ato Governamental obrigatório | “Em exercício” primeiro, Nome A–Z; **até 5 por página** | Seleção apenas no formulário; persistência pela ação **Salvar** |
| **Secretaria Executiva — Editar (RF004)** | Adicionar Chefe; UTB selecionada; nenhum chefe atual | Servidor vinculado à UTB e “Em exercício”; retorna como Chefe Imediato único, com Ato Governamental obrigatório | “Em exercício” primeiro, Nome A–Z; **até 5 por página** | Seleção apenas no formulário; persistência pela ação **Atualizar** |
| **Gerência Executiva — Adicionar (RF002)** | Adicionar Chefe; Secretaria Executiva e UTB selecionadas; nenhum chefe atual | Servidor vinculado à UTB e “Em exercício”; retorna como Chefe Imediato único, com Ato Governamental obrigatório | “Em exercício” primeiro, Nome A–Z; **até 5 por página** | Seleção apenas no formulário; persistência pela ação **Salvar** |
| **Gerência Executiva — Editar (RF004)** | Adicionar Chefe; UTB selecionada; nenhum chefe atual | Servidor vinculado à UTB e “Em exercício”; retorna como Chefe Imediato único, com Ato Governamental obrigatório | “Em exercício” primeiro, Nome A–Z; **até 5 por página** | Seleção apenas no formulário; persistência pela ação **Atualizar** |
| **Gerência Regional — Adicionar (RF002)** | Adicionar Chefe; Secretaria Geral e UTB selecionadas; nenhum chefe atual | Servidor vinculado à UTB e “Em exercício”; retorna como Chefe Imediato único, com Ato Governamental obrigatório | “Em exercício” primeiro, Nome A–Z; **até 5 por página** | Seleção apenas no formulário; persistência pela ação **Salvar** |
| **Gerência Regional — Editar (RF004)** | Adicionar Chefe; UTB selecionada; nenhum chefe atual | Servidor vinculado à UTB e “Em exercício”; retorna como Chefe Imediato único, com Ato Governamental obrigatório | “Em exercício” primeiro, Nome A–Z; **até 5 por página** | Seleção apenas no formulário; persistência pela ação **Atualizar** |
| **Subgerência — Adicionar (RF002)** | Adicionar Chefe; Gerência Executiva e UTB selecionadas; nenhum chefe atual | Servidor vinculado à UTB e “Em exercício”; retorna como Chefe Imediato único, com Ato Governamental obrigatório | “Em exercício” primeiro, Nome A–Z; **até 5 por página** | Seleção apenas no formulário; persistência pela ação **Salvar** |
| **Subgerência — Editar (RF004)** | Adicionar Chefe; UTB selecionada; nenhum chefe atual | Servidor vinculado à UTB e “Em exercício”; retorna como Chefe Imediato único, com Ato Governamental obrigatório | “Em exercício” primeiro, Nome A–Z; **até 5 por página** | Seleção apenas no formulário; persistência pela ação **Atualizar** |
| **Núcleo — Adicionar (RF002)** | Adicionar Chefe; tipo de vínculo (Gerência Regional ou Subgerência), unidade superior e UTB selecionadas; nenhum chefe atual | Servidor vinculado à UTB e “Em exercício”; retorna como Chefe Imediato único, com Ato Governamental obrigatório | “Em exercício” primeiro, Nome A–Z; **até 5 por página** | Seleção apenas no formulário; persistência pela ação **Salvar** |
| **Núcleo — Editar (RF004)** | Adicionar Chefe; unidade superior definida e UTB selecionada; nenhum chefe atual | Servidor vinculado à UTB e “Em exercício”; retorna como Chefe Imediato único, com Ato Governamental obrigatório | “Em exercício” primeiro, Nome A–Z; **até 5 por página** | Seleção apenas no formulário; persistência pela ação **Atualizar** |

## 5) Detalhamento da funcionalidade

### 5.1 Estrutura do modal

| Nome do campo | Detalhamento do campo |
| --- | --- |
| **Modal Buscar Servidor** | • <strong>Título:</strong> “Buscar Servidor”.<br>• <strong>Tipo:</strong> Modal contextual de seleção.<br>• <strong>Componente SIAGE-UI:</strong> SModalComponent (s-modal), aberto por SModalService (open).<br>• <strong>Comportamentos:</strong><br>◦ Exibe cabeçalho com título e X, filtros de pesquisa, listagem paginada e rodapé com Cancelar.<br>◦ Não possui rota independente. |
| **Bloco de filtros** | • <strong>Tipo:</strong> Agrupamento de filtros.<br>• <strong>Componente SIAGE-UI:</strong> SFilterCardComponent (s-filter-card), com SFieldComponent e SButtonComponent.<br>• <strong>Comportamentos:</strong> Organiza Matrícula, Nome do Servidor e CPF com labels externas, além das ações Limpar e Buscar. |
| **Tabela de resultados** | • <strong>Tipo:</strong> Listagem paginada.<br>• <strong>Componente SIAGE-UI:</strong> STableComponent (s-table: columns e rows; configuração STableColumn).<br>• <strong>Colunas:</strong> Nome, CPF, Matrícula, Situação Funcional e Ação.<br>• <strong>Comportamentos:</strong><br>◦ Inicialmente sem registros;<br>◦ preenche após pesquisa válida, respeitando a unidade e as regras de seleção aplicáveis. |
| **Paginação** | • <strong>Tipo:</strong> Controle de navegação de páginas.<br>• <strong>Componente SIAGE-UI:</strong> SPaginationComponent (s-pagination), integrado ao STableComponent (s-table: page, pageSize e total).<br>• <strong>Apresentação:</strong> “Exibindo X de Y Registros”, primeira/anterior/páginas/próxima/última.<br>• <strong>Comportamentos:</strong><br>◦ Na Secretaria Geral, na Secretaria Executiva, na Gerência Executiva, na Gerência Regional, na Subgerência e no Núcleo, até 5 registros por página;<br>◦ reinicia a página ao pesquisar ou limpar. |
| **Rodapé do modal** | • <strong>Tipo:</strong> Área de ações.<br>• <strong>Componente SIAGE-UI:</strong> SModalFooterDirective (sModalFooter) e SButtonComponent (s-button).<br>• <strong>Comportamentos:</strong> Apresenta Cancelar à direita, encerrando a consulta sem seleção. |

### 5.2 Campos de pesquisa

| Nome do campo | Detalhamento do campo |
| --- | --- |
| **Matrícula** | • <strong>Label:</strong> “Matrícula”.<br>• <strong>Tipo:</strong> Campo de pesquisa numérico sem máscara.<br>• <strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field) e SInputComponent (s-input: maxlength 7).<br>• <strong>Obrigatoriedade:</strong> Opcional.<br>• <strong>Placeholder:</strong> “Digite a Matrícula”.<br>• <strong>Limite:</strong> 7 dígitos.<br>• <strong>Comportamentos:</strong><br>◦ Aceita apenas dígitos, sem pontos, espaços ou hífens.<br>◦ Permite pesquisa por matrícula completa ou parcial e combinação com os demais filtros. |
| **Nome do Servidor** | • <strong>Label:</strong> “Nome do Servidor”.<br>• <strong>Tipo:</strong> Campo de texto alfanumérico e caracteres especiais.<br>• <strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field) e SInputComponent (s-input: maxlength 200).<br>• <strong>Obrigatoriedade:</strong> Opcional.<br>• <strong>Placeholder:</strong> “Digite o Nome do Servidor”.<br>• <strong>Limite:</strong> 200 caracteres.<br>• <strong>Comportamentos:</strong> Pesquisa parcial, sem diferenciar letras maiúsculas e minúsculas, isoladamente ou em combinação com Matrícula e CPF. |
| **CPF** | • <strong>Label:</strong> “CPF”.<br>• <strong>Tipo:</strong> Campo de pesquisa numérico com máscara.<br>• <strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field) e SInputComponent (s-input: maxlength 14); máscara aplicada pela funcionalidade.<br>• <strong>Obrigatoriedade:</strong> Opcional.<br>• <strong>Placeholder:</strong> “Digite o CPF”.<br>• <strong>Máscara:</strong> <code>000.000.000-00</code>.<br>• <strong>Limite:</strong> 11 dígitos, sem contar a máscara.<br>• <strong>Comportamentos:</strong><br>◦ Aceita somente dígitos e pesquisa por CPF completo ou parcial;<br>◦ combinável com os demais filtros. |

### 5.3 Resultados e colunas

| Nome do campo | Detalhamento do campo |
| --- | --- |
| **Nome** | • <strong>Label:</strong> “Nome”.<br>• <strong>Tipo:</strong> Coluna textual.<br>• <strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn).<br>• <strong>Comportamentos:</strong><br>◦ Exibe o nome do servidor;<br>◦ Na Secretaria Geral, na Secretaria Executiva, na Gerência Executiva, na Gerência Regional, na Subgerência e no Núcleo, servidores “Em exercício” são priorizados e ordenados alfabeticamente. |
| **CPF** | • <strong>Label:</strong> “CPF”.<br>• <strong>Tipo:</strong> Coluna textual de documento.<br>• <strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn).<br>• <strong>Apresentação:</strong> Máscara <code>000.000.000-00</code>.<br>• <strong>Comportamentos:</strong> Exibe CPF do servidor sem permitir edição. |
| **Matrícula** | • <strong>Label:</strong> “Matrícula”.<br>• <strong>Tipo:</strong> Coluna numérica.<br>• <strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn).<br>• <strong>Apresentação:</strong> Dígitos sem máscara (ex.: “170”).<br>• <strong>Comportamentos:</strong> Exibe a matrícula do servidor vinculado à unidade consultada. |
| **Situação Funcional** | • <strong>Label:</strong> “Situação Funcional”.<br>• <strong>Tipo:</strong> Coluna textual.<br>• <strong>Componente SIAGE-UI:</strong> STableComponent (s-table; configuração STableColumn).<br>• <strong>Apresentação:</strong> Texto simples, sem badge ou flag.<br>• <strong>Comportamentos:</strong><br>◦ Exibe a situação funcional;<br>◦ na Secretaria Geral, na Secretaria Executiva, na Gerência Executiva, na Gerência Regional, na Subgerência e no Núcleo, somente “Em exercício” permite a ação Adicionar. |
| **Ação** | • <strong>Label:</strong> “Ação”.<br>• <strong>Tipo:</strong> Coluna de ação.<br>• <strong>Componente SIAGE-UI:</strong> STableComponent (s-table), STableCellDirective (sTableCell), SIconButtonComponent (s-icon-button) e STooltipDirective (sTooltip).<br>• <strong>Apresentação:</strong> IconButton “+”, tooltip “Adicionar” e aria-label “Adicionar”.<br>• <strong>Comportamentos:</strong><br>◦ Última coluna da tabela.<br>◦ A ação fica disponível somente para servidores elegíveis no contexto da origem. |

### 5.4 Ações do modal

| Nome do campo | Detalhamento do campo |
| --- | --- |
| **Buscar** | • <strong>Label:</strong> “Buscar”.<br>• <strong>Tipo:</strong> Button.<br>• <strong>Componente SIAGE-UI:</strong> SButtonComponent (s-button: type submit, variant primary, icon search).<br>• <strong>Formato:</strong> Ação primária.<br>• <strong>Habilitação:</strong> Pelo menos um filtro preenchido.<br>• <strong>Comportamentos:</strong><br>◦ Consulta os servidores da unidade de referência com os critérios informados.<br>◦ ENTER equivale ao acionamento de Buscar;<br>◦ reinicia a paginação e atualiza os resultados. |
| **Limpar** | • <strong>Label:</strong> “Limpar”.<br>• <strong>Tipo:</strong> Button.<br>• <strong>Componente SIAGE-UI:</strong> SButtonComponent (s-button: variant secondary, outlined).<br>• <strong>Formato:</strong> Ação secundária.<br>• <strong>Habilitação:</strong> Sempre disponível.<br>• <strong>Comportamentos:</strong><br>◦ Limpa os três filtros, remove os critérios, retorna à primeira página e restaura a listagem vazia.<br>◦ Se já estiver vazio, não altera o estado. |
| **Adicionar servidor** | • <strong>Label:</strong> “Adicionar”.<br>• <strong>Tipo:</strong> IconButton com “+”.<br>• <strong>Componente SIAGE-UI:</strong> SIconButtonComponent (s-icon-button: icon add, variant primary, text) e STooltipDirective (sTooltip).<br>• <strong>Formato:</strong> Ação ghost.<br>• <strong>Tooltip:</strong> “Adicionar”.<br>• <strong>Aria-label:</strong> “Adicionar”.<br>• <strong>Visibilidade:</strong> Na Secretaria Geral, na Secretaria Executiva, na Gerência Executiva, na Gerência Regional, na Subgerência e no Núcleo, somente para “Em exercício”.<br>• <strong>Comportamentos:</strong><br>◦ Seleciona o servidor da linha e fecha o modal.<br>◦ Na Secretaria Geral, na Secretaria Executiva, na Gerência Executiva, na Gerência Regional, na Subgerência e no Núcleo, preenche Chefia Imediata e exige Ato Governamental;<br>◦ a persistência depende de Salvar ou Atualizar na origem. |
| **Cancelar** | • <strong>Label:</strong> “Cancelar”.<br>• <strong>Tipo:</strong> Button.<br>• <strong>Componente SIAGE-UI:</strong> SButtonComponent (s-button: variant secondary, outlined), no SModalFooterDirective (sModalFooter).<br>• <strong>Formato:</strong> Ação secundária.<br>• <strong>Habilitação:</strong> Sempre disponível.<br>• <strong>Comportamentos:</strong> Fecha o modal e retorna ao formulário, sem seleção ou alteração dos dados. |
| **Fechar (X)** | • <strong>Label:</strong> “Fechar modal”.<br>• <strong>Tipo:</strong> IconButton no cabeçalho.<br>• <strong>Componente SIAGE-UI:</strong> SModalComponent (s-modal: closable e cancel).<br>• <strong>Aria-label:</strong> “Fechar modal”.<br>• <strong>Comportamentos:</strong> Executa o mesmo comportamento de Cancelar. |

### 5.5 Estados da consulta

| Nome do campo | Detalhamento do campo |
| --- | --- |
| **Inicial, antes de Buscar** | • <strong>Tipo:</strong> Estado da listagem.<br>• <strong>Componente SIAGE-UI:</strong> STableComponent (s-table: rows vazias).<br>• <strong>Comportamentos:</strong> Tabela vazia até pesquisa com pelo menos um critério. |
| **Resultados encontrados** | • <strong>Tipo:</strong> Estado da listagem.<br>• <strong>Componente SIAGE-UI:</strong> STableComponent (s-table: rows, page, pageSize e total).<br>• <strong>Comportamentos:</strong> Apresenta registros correspondentes à consulta, com paginação, ordenação e ações de acordo com o contexto. |
| **Nenhum resultado** | • <strong>Tipo:</strong> Estado da listagem.<br>• <strong>Componente SIAGE-UI:</strong> STableComponent (s-table: empty, variant no-results), com SEmptyStateComponent (s-empty-state).<br>• <strong>Mensagem:</strong> “Nenhum servidor encontrado para os critérios informados.”<br>• <strong>Comportamentos:</strong> Apresenta mensagem na própria tabela, sem toast de ausência de resultados. |
| **Servidor não elegível** | • <strong>Tipo:</strong> Estado da ação na listagem.<br>• <strong>Componente SIAGE-UI:</strong> STableCellDirective (sTableCell) e STooltipDirective (sTooltip).<br>• <strong>Comportamentos:</strong> Na Secretaria Geral, na Secretaria Executiva, na Gerência Executiva, na Gerência Regional, na Subgerência e no Núcleo, servidores que não estiverem “Em exercício” permanecem visíveis para consulta, sem ação Adicionar disponível. |
| **Erro genérico da consulta** | • <strong>Tipo:</strong> Falha de requisição.<br>• <strong>Componente SIAGE-UI:</strong> SToastService (error).<br>• <strong>Comportamentos:</strong><br>◦ Não seleciona servidor nem altera o formulário;<br>◦ apresenta o toast de erro do item 6. |

## 6) Toast

| Toast | Quando exibir | Título/Mensagem | Ações/Regras | Imagens |
| --- | --- | --- | --- | --- |
| **Servidor selecionado — Secretaria Geral** | Após selecionar, pelo ícone “+”, servidor “Em exercício” e retornar ao formulário de Secretaria Geral. | <strong>Título:</strong> “Servidor {Nome do Servidor} selecionado. Preencha os dados e anexe o Ato Governamental de Nomeação.”<br><strong>Mensagem:</strong> Não se aplica. | Confirma a seleção no formulário; não representa cadastro nem edição concluídos. O Ato Governamental deverá ser preenchido antes de persistir.<br><strong>Componente SIAGE-UI</strong>: SToastService (success). |  |
| **Erro genérico de requisição** | Quando a consulta falhar sem mensagem funcional específica. | <strong>Título:</strong> “Não foi possível concluir a solicitação.”<br><strong>Mensagem:</strong> “Tente novamente.” | Exibe o erro global sem dados técnicos; não seleciona servidor nem altera o formulário de origem.<br><strong>Componente SIAGE-UI</strong>: SToastService (error). |  |

## 7) Protótipos

| Protótipo |
| --- |
| <strong>Buscar Servidor — Secretaria Geral</strong><br>Modal contextual com filtros, listagem, seleção e rodapé. |
|  |
| <strong>Buscar Servidor — Secretaria Executiva</strong><br>Modal contextual para seleção de Chefe Imediato a partir da UTB selecionada. |
|  |
| <strong>Buscar Servidor — Gerência Executiva</strong><br>Modal contextual para seleção de Chefe Imediato a partir da UTB selecionada. |
|  |
| <strong>Buscar Servidor — Gerência Regional</strong><br>Modal contextual para seleção de Chefe Imediato a partir da UTB selecionada. |
|  |
| <strong>Buscar Servidor — Subgerência</strong><br>Modal contextual para seleção de Chefe Imediato a partir da UTB selecionada. |
| <strong>Buscar Servidor — Núcleo</strong><br>Modal contextual para seleção de Chefe Imediato a partir da UTB selecionada, com vínculo a Gerência Regional ou Subgerência. |
|  |
|  |
| <strong>Buscar Servidor — Sem acesso à funcionalidade</strong><br>Cenário de acesso não autorizado. |
|  |
