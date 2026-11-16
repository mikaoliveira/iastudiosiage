# [RF003] Selecionar Matrícula

## 1) Histórico

| Data | Versão | Descrição | Autor | Versão mind | Sprint de desenvolvimento |
| --- | --- | --- | --- | --- | --- |
| 16 de nov. de 2026 | 1.0 | Atualização da funcionalidade | A definir | 01 | A definir |

## 2) História de Usuário

Eu, como usuário do SIAGE-RH, na qualidade de Administrador ou Servidor,

Quero escolher uma matrícula elegível entre os vínculos associados à minha conta,

Para definir corretamente o contexto de atuação, as responsabilidades e as abrangências do acesso.

## 3) Fluxo de acesso à funcionalidade

Login >> Autenticação e autorização >> Selecionar Matrícula (quando duas ou mais elegíveis) >> Página Inicial

**Pré-condições:**

- O usuário deverá estar autenticado e autorizado no AUTH, com a condição de Primeiro Acesso já resolvida.
- A tela só deverá ser apresentada quando houver duas ou mais matrículas elegíveis para a conta.
- A listagem de matrículas elegíveis deve ser obtida da base funcional e respeitar regras de gestão de acesso, sem mesclar vínculos.

## 4) Critérios de Aceite

### 4.1 Acesso e permissões

- A rota /selecionar-matricula deverá ficar restrita a sessão autenticada e sem matrícula definida; acesso direto sem sessão deverá redirecionar ao Login.
- Quando houver uma única matrícula elegível, o sistema deverá ativá-la e acessar /inicio sem apresentar esta tela; com duas ou mais, exigir escolha explícita do usuário.
- O perfil Administrador ou Servidor permanece associado ao AUTH. Responsabilidades, visões de atuação e abrangência decorrem do contexto da matrícula escolhida e das regras de acesso do SIAGE-RH.

### 4.2 Regras gerais

#### 4.2.1 Estrutura de seleção e identidade institucional

- Exibir cabeçalho fixo com logomarca, botão de tema e Sair; abaixo, o título “Selecione sua matrícula” e a orientação “Encontramos mais de uma matrícula vinculada ao seu CPF. Escolha com qual deseja acessar o sistema.”.
- A área principal terá lista vertical de cards, um por matrícula elegível. Cada card apresenta Matrícula, Função, nome da UTB e ação “Acessar”, sempre associada visualmente àquele registro.
- Em desktop a ação fica à direita e, em telas menores, abaixo dos dados, ocupando a largura disponível; cards não devem exigir rolagem horizontal. Rodapé institucional consistente com as páginas de acesso.
- Não apresentar seleção de perfil, rádio para escolher vínculo ou seleção de visão: a escolha se dá exclusivamente pelo botão “Acessar” do card.
- A visualização de erro/simulação existente no protótipo é recurso de demonstração; não é comando disponível na funcionalidade definitiva.

#### 4.2.2 Elegibilidade e construção de contexto

- Somente matrículas retornadas como elegíveis pelas regras vigentes de acesso podem aparecer; cada registro deve manter Matrícula, Função e UTB do mesmo vínculo.
- Os dados de dois vínculos diferentes não deverão ser mesclados. O sistema não poderá escolher matrícula automaticamente quando houver mais de uma elegível, nem inferir abrangência de outro vínculo.
- Acionar “Acessar” deverá gravar a matrícula escolhida como contexto ativo da sessão e aplicar sua UTB, responsabilidades sistêmicas, condições de negócio, permissões, visões e abrangências conforme as regras de Gestão de Acessos e de Hierarquia, antes de navegar a /inicio.
- O perfil mantido no AUTH não mudará com a troca de matrícula. Possuir perfil Administrador não dispensa seleção quando houver mais de um vínculo elegível.
- Alterações futuras de vínculo e contexto exigem processo autorizado próprio; esta RF somente define a matrícula inicial da sessão, sem editar dados funcionais.

#### 4.2.3 Falhas, ausência de matrículas e navegação

- Quando a consulta falhar, substituir os cards pelo estado de falha com título “Não foi possível carregar suas matrículas.”, descrição “Verifique sua conexão e tente novamente.” e ações “Tentar novamente” e “Voltar para o login”.
- “Tentar novamente” deverá recarregar somente as matrículas elegíveis; durante a tentativa, bloquear repetição e exibir carregamento “Carregando...”. Caso recupere dados, remover o estado de falha e apresentar a lista.
- Quando a sessão for inválida ou não houver matrícula elegível retornada, não permitir acessar /inicio. Exibir estado informativo “Nenhuma matrícula encontrada ou sessão expirada.” e orientação “Por favor, retorne ao login e faça a autenticação novamente.”, com “Voltar para o login”.
- “Voltar para o login” e “Sair” deverão encerrar a sessão e limpar qualquer contexto temporário; encaminhar para /login. Se a sessão expirar durante a escolha, impedir criação de contexto ativo.
- Os erros de carregamento terão estado visual próprio; não mostrar toast adicional em paralelo ao estado de erro sem justificativa funcional.

## 5) Detalhamento da funcionalidade

### 5.1 Cabeçalho, título e rodapé

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Cabeçalho institucional</strong> | <ul><li><strong>Tipo:</strong> Barra fixa com logo, tema e Sair.</li><li><strong>Componente SIAGE-UI:</strong> MatToolbarModule, MatIcon e botões HTML no protótipo; composição institucional própria, com SIconButtonComponent e SButtonComponent como alternativas para as ações.</li><li><strong>Comportamentos:</strong> Logo varia conforme tema; cabeçalho permanece fixo durante rolagem.</li></ul> |
| <strong>Alternar tema</strong> | <ul><li><strong>Tipo:</strong> Botão iconográfico.</li><li><strong>Componente SIAGE-UI:</strong> Botão HTML e MatIcon no protótipo; alternativa oficial: SIconButtonComponent (s-icon-button: icon e label).</li><li><strong>Comportamentos:</strong> Alterna temas claro/escuro, comunica a ação por label e título acessíveis.</li></ul> |
| <strong>Sair</strong> | <ul><li><strong>Label:</strong> “Sair”.</li><li><strong>Tipo:</strong> Ação global de sessão com ícone logout.</li><li><strong>Componente SIAGE-UI:</strong> Botão HTML próprio e MatIcon no protótipo; alternativa oficial: SButtonComponent (s-button: icon).</li><li><strong>Comportamentos:</strong> Encerra sessão e contexto temporário, depois navega para /login.</li></ul> |
| <strong>Título e orientação</strong> | <ul><li><strong>Título:</strong> “Selecione sua matrícula”.</li><li><strong>Orientação:</strong> “Encontramos mais de uma matrícula vinculada ao seu CPF. Escolha com qual deseja acessar o sistema.”</li><li><strong>Componente SIAGE-UI:</strong> Textos próprios da aplicação, sem componente específico.</li><li><strong>Comportamentos:</strong> Posicionado acima dos cards e centralizado.</li></ul> |
| <strong>Rodapé institucional</strong> | <ul><li><strong>Tipo:</strong> Bloco institucional.</li><li><strong>Componente SIAGE-UI:</strong> Layout HTML próprio com imagens.</li><li><strong>Comportamentos:</strong> Exibe logo da SEE-PB, link “Governo da Paraíba” e direitos autorais.</li></ul> |

### 5.2 Lista de matrículas e ações

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Lista de matrículas</strong> | <ul><li><strong>Tipo:</strong> Lista vertical de cards.</li><li><strong>Componente SIAGE-UI:</strong> Agrupamentos HTML próprios no protótipo; alternativa oficial: SCardComponent (s-card) para cada matrícula, em lista controlada pela aplicação.</li><li><strong>Conteúdo:</strong> Cada card representa uma matrícula elegível distinta.</li><li><strong>Comportamentos:</strong> Ajustar altura à quantidade; rolar verticalmente; não mesclar dados de outros vínculos.</li></ul> |
| <strong>Card de matrícula</strong> | <ul><li><strong>Tipo:</strong> Bloco de seleção de vínculo.</li><li><strong>Componente SIAGE-UI:</strong> HTML e MatIcon no protótipo; alternativas oficiais: SCardComponent (s-card), SIconComponent (s-icon) e SButtonComponent (s-button).</li><li><strong>Apresentação:</strong> Número da matrícula, Função, UTB e botão Acessar no mesmo card.</li><li><strong>Comportamentos:</strong> Permitir ação individual para o card correspondente, sem seleção prévia.</li></ul> |
| <strong>Matrícula</strong> | <ul><li><strong>Label:</strong> Número da matrícula.</li><li><strong>Tipo:</strong> Texto de destaque.</li><li><strong>Origem:</strong> Matrícula elegível retornada pelo serviço funcional.</li><li><strong>Comportamentos:</strong> Deverá corresponder ao mesmo vínculo da função e UTB exibidas.</li></ul> |
| <strong>Função</strong> | <ul><li><strong>Label:</strong> Função.</li><li><strong>Tipo:</strong> Texto informativo.</li><li><strong>Origem:</strong> Função vinculada à matrícula do card.</li><li><strong>Comportamentos:</strong> Não combinar função de outra matrícula.</li></ul> |
| <strong>Unidade de Trabalho (UTB)</strong> | <ul><li><strong>Label:</strong> UTB.</li><li><strong>Tipo:</strong> Texto informativo.</li><li><strong>Origem:</strong> Nome da Unidade de Trabalho associada à matrícula.</li><li><strong>Comportamentos:</strong> Define parte do contexto funcional quando “Acessar” for confirmado.</li></ul> |
| <strong>Acessar</strong> | <ul><li><strong>Label:</strong> “Acessar”.</li><li><strong>Tipo:</strong> Botão de ação primária por card.</li><li><strong>Componente SIAGE-UI:</strong> MatButtonModule e MatIcon no protótipo; alternativa oficial: SButtonComponent (s-button: variant=primary, iconRight, disabled e loading).</li><li><strong>Habilitação:</strong> Exclusivamente para vínculos elegíveis em sessão autenticada; desabilitar durante ativação para evitar duplicidade.</li><li><strong>Comportamentos:</strong> Ativar a matrícula do card, montar contexto/abrangência e encaminhar para /inicio.</li></ul> |

### 5.3 Estados e recuperação

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Falha de carregamento</strong> | <ul><li><strong>Tipo:</strong> Estado de erro no lugar da lista.</li><li><strong>Componente SIAGE-UI:</strong> HTML e controles Angular Material no protótipo; alternativa oficial: SEmptyStateComponent (s-empty-state: variant=error, title, description e actionLabel vazio) combinado a dois SButtonComponent.</li><li><strong>Título:</strong> “Não foi possível carregar suas matrículas.”</li><li><strong>Mensagem:</strong> “Verifique sua conexão e tente novamente.”</li><li><strong>Comportamentos:</strong> Não permitir seleção enquanto falha persistir; oferecer recarga ou saída.</li></ul> |
| <strong>Tentar novamente</strong> | <ul><li><strong>Label:</strong> “Tentar novamente”.</li><li><strong>Tipo:</strong> Botão secundário.</li><li><strong>Componente SIAGE-UI:</strong> MatButtonModule no protótipo; alternativa oficial: SButtonComponent (s-button: variant=secondary, outlined, loading e loadingText), com estado de erro configurado sem ação interna.</li><li><strong>Carregamento:</strong> “Carregando...”.</li><li><strong>Comportamentos:</strong> Repete consulta mantendo a sessão; em êxito, exibe cards; em falha, mantém estado de erro.</li></ul> |
| <strong>Voltar para o login</strong> | <ul><li><strong>Label:</strong> “Voltar para o login”.</li><li><strong>Tipo:</strong> Botão secundário.</li><li><strong>Componente SIAGE-UI:</strong> MatButtonModule e botão HTML no protótipo; alternativa oficial: SButtonComponent (s-button: variant=secondary).</li><li><strong>Comportamentos:</strong> Encerra sessão e retorna a /login; disponível no estado de falha ou ausência de matrícula.</li></ul> |
| <strong>Nenhuma matrícula encontrada</strong> | <ul><li><strong>Tipo:</strong> Estado vazio de conta ou sessão.</li><li><strong>Componente SIAGE-UI:</strong> HTML e MatIcon no protótipo; alternativa oficial: SEmptyStateComponent (s-empty-state: variant=no-data, title, description, actionLabel e action).</li><li><strong>Título:</strong> “Nenhuma matrícula encontrada ou sessão expirada.”</li><li><strong>Mensagem:</strong> “Por favor, retorne ao login e faça a autenticação novamente.”</li><li><strong>Comportamentos:</strong> Não ativa matrícula nem apresenta botão Acessar.</li></ul> |

## 6) Modais

| Modal | Quando exibir | Título/Mensagem | Ações/Regras | Imagens |
| --- | --- | --- | --- | --- |
| Não se aplica | Não há modal funcional nesta RF. | Não se aplica. | Os feedbacks previstos são apresentados por mensagem inline, toast ou estado de tela, conforme seu cenário. |  |

## 7) Toast

| Toast | Quando exibir | Título/Mensagem | Ações/Regras | Imagens |
| --- | --- | --- | --- | --- |
| Não se aplica | A RF não possui toast próprio no fluxo regular. | Não se aplica. | Erros de carregamento com estado dedicado permanecem na própria tela. |  |

## 8) Protótipos

| Protótipo |
| --- |
| <strong>Selecionar Matrícula — lista de dois vínculos e ações Acessar</strong> |
|  |
| <strong>Selecionar Matrícula — estados desktop e mobile</strong> |
|  |
| <strong>Selecionar Matrícula — falha de carregamento e Tentar novamente</strong> |
|  |
| <strong>Selecionar Matrícula — nenhuma matrícula / sessão expirada</strong> |
|  |

## 9) Lacunas da biblioteca SIAGE-UI

Não foi identificada lacuna para esta RF na versão 20.0.5. SCardComponent, SIconButtonComponent, SButtonComponent e SEmptyStateComponent oferecem alternativas para cartões, ações e estados; a composição institucional permanece própria. O estado de erro pode combinar o estado vazio sem ação interna com dois botões da biblioteca. LAC-001, LAC-002 e LAC-003 não se aplicam a esta RF.
