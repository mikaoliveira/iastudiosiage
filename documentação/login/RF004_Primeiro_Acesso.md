# [RF004] Primeiro Acesso

## 1) Histórico

| Data | Versão | Descrição | Autor | Versão mind | Sprint de desenvolvimento |
| --- | --- | --- | --- | --- | --- |
| 16 de nov. de 2026 | 1.0 | Atualização da funcionalidade | A definir | 01 | A definir |

## 2) História de Usuário

Eu, como usuário do SIAGE-RH, na qualidade de Administrador ou Servidor,

Quero alterar a senha provisória exigida na primeira autenticação,

Para concluir a ativação obrigatória da credencial e acessar o SIAGE-RH posteriormente com minha senha pessoal.

## 3) Fluxo de acesso à funcionalidade

Login (autenticação inicial) >> Primeiro Acesso (/primeiro-acesso) >> Definir nova senha >> Encerramento da sessão >> Login >> Selecionar Matrícula, quando aplicável >> Página Inicial

**Pré-condições:**

- O usuário deverá ter autenticado com credencial provisória válida, possuir sessão restrita de primeiro acesso e estar marcado pelo AUTH como obrigado a alterar a senha.
- O serviço de autenticação deverá validar a senha atual e persistir a nova credencial.
- Antes da conclusão não deverá existir matrícula ativa, nem acesso a funcionalidades internas.

## 4) Critérios de Aceite

### 4.1 Acesso e permissões

- A rota /primeiro-acesso só deve ser acessível durante o fluxo autenticado de primeiro acesso obrigatório; usuário não autenticado ou com sessão expirada retorna a /login.
- Usuário autenticado sem a obrigação não poderá permanecer nesta página; seguirá o fluxo regular de definição de matrícula e Página Inicial.
- Enquanto o AUTH não confirmar a alteração, bloquear a navegação para /selecionar-matricula ou /inicio. A validação deverá ocorrer na sessão/servidor, não apenas na visibilidade dos botões da página.

### 4.2 Regras gerais

#### 4.2.1 Estrutura e apresentação

- Cabeçalho institucional fixo com logomarca SIAGE-RH, alternância de tema e Sair; card central com título “Primeiro acesso”, orientação “Para continuar, defina uma nova senha para o seu acesso ao SIAGE-RH.” e aviso de segurança.
- O aviso permanente informativo será “Por segurança, sua senha provisória deve ser alterada antes de acessar o sistema.” e não será tratado como banner de erro.
- Formulário inclui Senha atual, Crie uma nova senha, Confirme a nova senha, checklist de segurança e ação “Definir nova senha”. Rodapé institucional permanece presente.
- Manter a página responsiva em desktop, tablet e smartphone, inclusive 1366×768 e 1024×768, sem rolagem horizontal. Simulador de falhas e preenchimentos automáticos de teste não integram produção.

#### 4.2.2 Campos de senha e critérios de segurança

- Senha atual é obrigatória, oculta inicialmente, com limite de entrada de 32 caracteres no protótipo, e validada pelo AUTH contra a credencial provisória em uso. Vazio: “Senha é obrigatória.”; senha incorreta: “Senha atual incorreta. Verifique a informação e tente novamente.” junto ao campo.
- Crie uma nova senha é obrigatória, aceita de 8 a 16 caracteres, exige ao menos uma letra maiúscula, uma minúscula, um número e um caractere especial. Não aceita nenhum espaço; excedente a 16 não deve ser inserido.
- Confirme a nova senha é obrigatória e deve reproduzir exatamente a nova senha, inclusive maiúsculas, minúsculas e caracteres especiais. Vazia: “Confirmação de senha é obrigatória.”; diferente: “As senhas não coincidem.”.
- Nova senha vazia: “Senha é obrigatória.”; com critérios não atendidos: “A senha informada não atende aos critérios de segurança.”. Mensagens são apresentadas abaixo do campo após perda de foco ou envio, preservando espaço de feedback.
- A validação visual do protótipo reconhece como caracteres especiais os símbolos ASCII de pontuação, incluindo !, @, #, $, %, ^, &, *, parênteses, sinais matemáticos, colchetes, chaves, ponto, vírgula, barra e aspas. A persistência deverá aplicar a política vigente do AUTH, não apenas a avaliação visual do checklist.

- Checklist atualiza dinamicamente: Mínimo de 8 caracteres; Uma letra maiúscula; Uma letra minúscula; Um número; Um caractere especial; As senhas devem ser iguais. Não acrescentar itens para limite máximo ou proibição de espaço.
- Os três campos começam com caracteres ocultos e deverão oferecer ação individual de mostrar/ocultar senha, preservando valor e foco. A definição do componente adequado deverá ser validada na API SIAGE-UI, mas o comportamento é obrigatório para a funcionalidade.

#### 4.2.3 Validação, processamento e conclusão

- A ação “Definir nova senha” será permitida somente com Senha atual preenchida e critérios da nova senha e confirmação atendidos; o salvamento também revalida o formulário.
- Enquanto a requisição estiver em processamento, mostrar carregamento “Salvando...” e bloquear envios repetidos e saídas que possam resultar em concorrência da alteração.
- Em senha atual incorreta, permanecer na página, apresentar erro específico no campo correspondente, manter as demais entradas para correção e não finalizar o primeiro acesso.
- Quando o AUTH confirmar a alteração, encerrar a sessão restrita, marcar primeiro acesso como concluído e navegar automaticamente para /login. Mostrar toast success no Login “Senha alterada com sucesso. Entre no SIAGE-RH utilizando sua nova senha.”, uma única vez, sem banner ou modal.
- O usuário deverá autenticar-se novamente. Não encaminhar diretamente para Selecionar Matrícula nem Página Inicial depois de trocar a senha.
- Quando a mudança de senha falhar por motivo técnico sem campo específico, exibir toast de erro “Não foi possível concluir a solicitação. Tente novamente.”, permanecer no formulário e não alterar a credencial no AUTH.

#### 4.2.4 Saída, sessão e identidade visual

- “Sair” no cabeçalho encerra a sessão provisória e retorna a /login, sem concluir a exigência do primeiro acesso; no login seguinte, o AUTH continuará exigindo a alteração.
- Se a sessão expirar antes do envio, remover contexto provisório e redirecionar a /login sem persistir novos valores.
- Exibir labels sempre acima dos controles e erros junto ao respectivo campo. Usar o tema global claro/escuro e preservar a preferência na navegação.
- Não exibir banner para falha genérica. O aviso fixo sobre a senha provisória é informativo e não deve ser confundido com mensagem de erro.

## 5) Detalhamento da funcionalidade

### 5.1 Cabeçalho e estrutura

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Cabeçalho institucional</strong> | <ul><li><strong>Tipo:</strong> Barra fixa com marca, tema e Sair.</li><li><strong>Componente SIAGE-UI:</strong> Estrutura HTML própria; SIconButtonComponent na alternância de tema.</li><li><strong>Comportamentos:</strong> Permanece disponível no fluxo de primeiro acesso; não libera acesso interno.</li></ul> |
| <strong>Alternância de tema</strong> | <ul><li><strong>Tipo:</strong> Botão iconográfico.</li><li><strong>Componente SIAGE-UI:</strong> SIconButtonComponent (s-icon-button: icon e label).</li><li><strong>Comportamentos:</strong> Alterna tema claro e escuro, mantendo preferência global.</li></ul> |
| <strong>Sair</strong> | <ul><li><strong>Label:</strong> “Sair”.</li><li><strong>Tipo:</strong> Ação de encerramento de sessão.</li><li><strong>Componente SIAGE-UI:</strong> Botão HTML próprio com MatIcon no protótipo; alternativa oficial: SButtonComponent (s-button: icon).</li><li><strong>Comportamentos:</strong> Encerra sessão temporária, preservando a pendência de primeiro acesso no AUTH, e volta a /login.</li></ul> |
| <strong>Card Primeiro acesso</strong> | <ul><li><strong>Tipo:</strong> Contêiner de formulário obrigatório.</li><li><strong>Componente SIAGE-UI:</strong> SCardComponent (s-card: padding 24, elevation 2).</li><li><strong>Título:</strong> “Primeiro acesso”.</li><li><strong>Orientação:</strong> “Para continuar, defina uma nova senha para o seu acesso ao SIAGE-RH.”</li><li><strong>Comportamentos:</strong> Agrupa aviso, campos, checklist e ação.</li></ul> |
| <strong>Aviso de segurança</strong> | <ul><li><strong>Tipo:</strong> Faixa informativa persistente, não usada para erro.</li><li><strong>Componente SIAGE-UI:</strong> Composição própria de HTML e MatIcon no protótipo; alternativa oficial: SAlertComponent (s-alert: type=info, dismissible=false, duration=0).</li><li><strong>Mensagem:</strong> “Por segurança, sua senha provisória deve ser alterada antes de acessar o sistema.”</li></ul> |
| <strong>Rodapé institucional</strong> | <ul><li><strong>Tipo:</strong> Bloco institucional com marca, link do Governo e direitos autorais.</li><li><strong>Componente SIAGE-UI:</strong> Estrutura própria HTML e imagem.</li><li><strong>Comportamentos:</strong> Exibe marca e informação institucional ao final da página.</li></ul> |

### 5.2 Formulário de Primeiro Acesso

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Senha atual</strong> | <ul><li><strong>Label:</strong> “Senha atual”.</li><li><strong>Tipo:</strong> Input de senha.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field: error) e SInputComponent (s-input: type=password, maxlength=32); mostrar/ocultar integrado, com limitação de foco LAC-003.</li><li><strong>Obrigatoriedade:</strong> Obrigatório.</li><li><strong>Placeholder:</strong> “Digite sua senha atual”.</li><li><strong>Mensagem obrigatório:</strong> “Senha é obrigatória.”</li><li><strong>Mensagem credencial inválida:</strong> “Senha atual incorreta. Verifique a informação e tente novamente.”</li><li><strong>Comportamentos:</strong> Campo oculto inicialmente; validado no AUTH; quando incorreto, destacar o controle, preservar nova senha e confirmação e impedir conclusão.</li></ul> |
| <strong>Crie uma nova senha</strong> | <ul><li><strong>Label:</strong> “Crie uma nova senha”.</li><li><strong>Tipo:</strong> Input de senha.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field: error) e SInputComponent (s-input: type=password, maxlength=16); mostrar/ocultar integrado, com limitação de foco LAC-003.</li><li><strong>Obrigatoriedade:</strong> Obrigatório.</li><li><strong>Placeholder:</strong> “Digite a nova senha”.</li><li><strong>Limite:</strong> 8–16 caracteres; nenhum espaço.</li><li><strong>Regra de composição:</strong> No mínimo 1 maiúscula, 1 minúscula, 1 número e 1 especial.</li><li><strong>Mensagem obrigatório:</strong> “Senha é obrigatória.”</li><li><strong>Mensagem critérios:</strong> “A senha informada não atende aos critérios de segurança.”</li><li><strong>Comportamentos:</strong> Impedir espaços e excedente; marcar erro ao sair do campo ou tentar salvar; atualizar checklist enquanto digita.</li></ul> |
| <strong>Confirme a nova senha</strong> | <ul><li><strong>Label:</strong> “Confirme a nova senha”.</li><li><strong>Tipo:</strong> Input de senha.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent e SInputComponent (s-input: type=password, maxlength=16); mostrar/ocultar integrado, com limitação de foco LAC-003.</li><li><strong>Obrigatoriedade:</strong> Obrigatório.</li><li><strong>Placeholder:</strong> “Digite novamente a nova senha”.</li><li><strong>Mensagem obrigatório:</strong> “Confirmação de senha é obrigatória.”</li><li><strong>Mensagem divergência:</strong> “As senhas não coincidem.”</li><li><strong>Comportamentos:</strong> Comparar com Crie uma nova senha, respeitando capitalização, após perda de foco ou envio.</li></ul> |
| <strong>Critérios de segurança</strong> | <ul><li><strong>Tipo:</strong> Checklist informativo não editável.</li><li><strong>Componente SIAGE-UI:</strong> HTML e MatIcon próprios no protótipo; alternativa oficial: SPasswordRequirementsComponent (s-password-requirements: value e rules), com regras da aplicação, inclusive a comparação com a confirmação.</li><li><strong>Itens:</strong> Mínimo de 8 caracteres; Uma letra maiúscula; Uma letra minúscula; Um número; Um caractere especial; As senhas devem ser iguais.</li><li><strong>Comportamentos:</strong> Atualiza em tempo real; mantém status legível sem depender apenas da cor.</li></ul> |
| <strong>Definir nova senha</strong> | <ul><li><strong>Label:</strong> “Definir nova senha”.</li><li><strong>Tipo:</strong> Ação primária.</li><li><strong>Componente SIAGE-UI:</strong> SButtonComponent (s-button: fullWidth, loading, loadingText).</li><li><strong>Habilitação:</strong> Senha atual preenchida e nova senha/confirmada válidas; bloquear durante processamento.</li><li><strong>Carregamento:</strong> “Salvando...”.</li><li><strong>Comportamentos:</strong> Valida credencial provisória no AUTH e persiste senha; sucesso encerra sessão e redireciona Login.</li></ul> |

### 5.3 Validações e conclusão

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Senha atual não informada</strong> | <ul><li><strong>Tipo:</strong> Erro inline.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field: error).</li><li><strong>Mensagem:</strong> “Senha é obrigatória.”</li><li><strong>Comportamentos:</strong> Impede alteração; deve ser apresentado após blur ou envio.</li></ul> |
| <strong>Senha atual incorreta</strong> | <ul><li><strong>Tipo:</strong> Erro do AUTH associado ao campo.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field: error).</li><li><strong>Mensagem:</strong> “Senha atual incorreta. Verifique a informação e tente novamente.”</li><li><strong>Comportamentos:</strong> Não encerrar a sessão nem concluir primeiro acesso; permitir corrigir o campo.</li></ul> |
| <strong>Nova senha fora da política</strong> | <ul><li><strong>Tipo:</strong> Erro inline da nova senha.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent e checklist próprio no protótipo; alternativa para a lista: SPasswordRequirementsComponent com rules da aplicação.</li><li><strong>Mensagem:</strong> “A senha informada não atende aos critérios de segurança.”</li><li><strong>Comportamentos:</strong> Bloqueia conclusão até regularização.</li></ul> |
| <strong>Confirmação divergente</strong> | <ul><li><strong>Tipo:</strong> Erro inline de confirmação.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field: error).</li><li><strong>Mensagem:</strong> “As senhas não coincidem.”</li><li><strong>Comportamentos:</strong> Bloqueia conclusão até igualdade exata.</li></ul> |
| <strong>Falha do serviço</strong> | <ul><li><strong>Tipo:</strong> Falha técnica não vinculada a campo.</li><li><strong>Componente SIAGE-UI:</strong> SToastService (error) é a alternativa oficial; o ToastService próprio aparece na simulação de falha do protótipo, não em integração real.</li><li><strong>Mensagem:</strong> “Não foi possível concluir a solicitação. Tente novamente.”</li><li><strong>Comportamentos:</strong> Manter formulário e exigência de primeiro acesso sem persistência parcial.</li></ul> |

## 6) Modais

| Modal | Quando exibir | Título/Mensagem | Ações/Regras | Imagens |
| --- | --- | --- | --- | --- |
| Não se aplica | Não há modal funcional nesta RF. | Não se aplica. | Os feedbacks previstos são apresentados por mensagem inline, toast ou estado de tela, conforme seu cenário. |  |

## 7) Toast

| Toast | Quando exibir | Título/Mensagem | Ações/Regras | Imagens |
| --- | --- | --- | --- | --- |
| <strong>Falha genérica ao alterar senha</strong> | Serviço falha sem motivo de campo específico. | “Não foi possível concluir a solicitação. Tente novamente.” | <ul><li><strong>Componente SIAGE-UI:</strong> SToastService (error) como alternativa oficial; o protótipo usa ToastService próprio apenas na simulação dessa falha.</li><li><strong>Comportamentos:</strong> Permanecer na RF004, preservar preenchimento e permitir tentar novamente.</li></ul> |  |
| <strong>Senha alterada com sucesso</strong> | AUTH confirmou a mudança e a navegação retornou à RF001. | “Senha alterada com sucesso. Entre no SIAGE-RH utilizando sua nova senha.” | <ul><li><strong>Componente SIAGE-UI:</strong> SToastService (success) na tela Login.</li><li><strong>Comportamentos:</strong> Exibir apenas uma vez, depois da sessão ser encerrada; sem banner ou modal.</li></ul> |  |

## 8) Protótipos

| Protótipo |
| --- |
| <strong>Primeiro Acesso — cabeçalho, aviso e formulário</strong> |
|  |
| <strong>Primeiro Acesso — validações inline de três senhas</strong> |
|  |
| <strong>Primeiro Acesso — checklist de segurança</strong> |
|  |
| <strong>Primeiro Acesso — senha atual incorreta</strong> |
|  |
| <strong>Primeiro Acesso — sucesso no Login / falha genérica por toast</strong> |
|  |

## 9) Lacunas da biblioteca SIAGE-UI

**LAC-003 — Foco ao mostrar ou ocultar senha.** Componente afetado: SInputComponent (s-input: type=password), versão 20.0.5. O botão integrado altera a visibilidade e preserva o valor, mas o clique transfere o foco do campo para o botão e dispara a perda de foco; não há propriedade pública para conservar o foco no campo. Solução para a implementação: tratar o foco na aplicação ao acionar por ponteiro, sem prejudicar o acesso por teclado; o protótipo ainda não implementa esse tratamento.

O checklist e o aviso informativo têm alternativas oficiais, respectivamente SPasswordRequirementsComponent e SAlertComponent. LAC-001 e LAC-002 não se aplicam a esta RF.
