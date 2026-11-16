# [RF002] Redefinir Senha

## 1) Histórico

| Data | Versão | Descrição | Autor | Versão mind | Sprint de desenvolvimento |
| --- | --- | --- | --- | --- | --- |
| 16 de nov. de 2026 | 1.0 | Atualização da funcionalidade | A definir | 01 | A definir |

## 2) História de Usuário

Eu, como usuário do SIAGE-RH, na qualidade de Administrador ou Servidor,

Quero redefinir minha senha a partir da identificação por CPF e da validação de código enviado ao e-mail cadastrado,

Para recuperar o acesso à conta do AUTH sem alterar meus vínculos ou permissões.

## 3) Fluxo de acesso à funcionalidade

Login >> Esqueceu a senha? >> Identificação (CPF) >> Verificação (código recebido por e-mail) >> Nova Senha >> Login

**Pré-condições:**

- A recuperação deverá estar disponível sem sessão autenticada.
- O usuário deverá possuir CPF cadastrado no AUTH, permissão de acesso ao SIAGE-RH e e-mail válido associado à conta para receber o código.
- Cada etapa depende da conclusão da anterior; identificação e verificação aprovadas não substituem a autenticação necessária no Login após redefinir.

## 4) Critérios de Aceite

### 4.1 Acesso e permissões

- Disponibilizar pela ação “Esqueceu a senha?” em /login e pela rota /login/esqueci-senha, sem exigir sessão.
- A rotina deverá consultar o AUTH, utilizar o serviço de e-mail institucional e persistir a senha no AUTH; não cadastrar e-mail alternativo por esta tela.
- A página compartilha cabeçalho/rodapé e alternância de tema com Login; não exibe módulos da apresentação pública durante o fluxo.

### 4.2 Regras gerais

#### 4.2.1 Sequência e estrutura da recuperação

- O processo será dividido em três etapas sequenciais: 1 Identificação, 2 Verificação, 3 Nova Senha. O indicador visual deve informar etapa atual, concluídas e futuras, sem permitir avanço direto por clique.
- Identificação solicita CPF, não e-mail. O e-mail da conta deve aparecer mascarado apenas na Verificação, para indicar o destino do código enviado.
- Se o usuário voltar para Identificação, a tentativa atual e o código vigente deverão ser invalidados; voltar ao Login encerra o processo e invalida código restante. A etapa Nova Senha também permite retornar à Identificação.
- O indicador de etapas, os links de retorno e os formulários devem permanecer acessíveis por teclado, com foco e labels visíveis. Simuladores e controles de demonstração não são parte do fluxo de produção.

#### 4.2.2 Etapa 1 — Identificação por CPF

- CPF é obrigatório e usa máscara 000.000.000-00, entrada de até 11 dígitos, validada pelo algoritmo oficial de CPF (ambos os dígitos verificadores e proibição de sequências iguais).

- A verificação matemática do CPF deverá considerar os nove primeiros dígitos, multiplicá-los por pesos de 10 a 2 e obter o primeiro DV (resto da soma por 11; resto menor que 2 resulta em 0, caso contrário 11 menos o resto). Repetir com os dez primeiros dígitos e pesos de 11 a 2 para obter o segundo DV. Ambos devem coincidir com os dois dígitos informados.
- Se vazio, exibir “CPF é obrigatório.”; se incompleto ou matematicamente inválido, “CPF é inválido.”, abaixo do campo após perda de foco. “Continuar” só habilita com CPF válido.
- Ao continuar, consultar AUTH com 11 dígitos sem pontuação. Conta inexistente: toast error “Cadastro não encontrado. Verifique os dados informados.”; conta sem autorização à aplicação: toast error “Seu usuário não possui permissão para acessar o SIAGE-RH.”. Manter na etapa e não enviar código nesses casos.
- Conta habilitada com e-mail cadastrado: gerar código e solicitar envio ao e-mail da própria conta; avançar para Verificação após confirmação da solicitação. Falha de comunicação: não avançar nem informar que o envio ocorreu.

#### 4.2.3 Etapa 2 — Código e disponibilidade

- O código terá exatamente seis dígitos numéricos, vigência de 10 minutos contados de sua emissão e uso único; verificar no AUTH antes de permitir acesso à Nova Senha.
- O e-mail deve ser mascarado mantendo domínio visível, sem revelar endereço integral a terceiros; apresentar “Enviamos um código para o e-mail cadastrado {e-mail mascarado}.”. O envio deverá usar o assunto “Código de Verificação - SIAGE-RH” e informar o código, a validade de 10 minutos, a orientação de não compartilhá-lo e o descarte da mensagem caso a solicitação não tenha sido feita pelo destinatário.
- Apenas o contador de espera para reenvio será exibido na interface: “Não recebeu o código? Reenviar em 00:SS”. A vigência de 10 minutos será verificada sem contador de expiração visível.
- “Validar código” habilita após informar seis dígitos; durante a validação, bloquear novo envio. Código inválido consome uma tentativa, exibindo abaixo do campo “Código inválido. Tentativas restantes: X.”.
- Após três tentativas incorretas, invalidar o código e bloquear a validação por uma hora para a conta, exibindo modal de limite de tentativas. Reiniciar o fluxo não deve contornar o bloqueio do AUTH.
- Código expirado não avança; apresentar toast error “Código expirado. Solicite o reenvio e tente novamente.”, permitindo reenvio somente se demais limites forem atendidos.
- O primeiro reenvio só poderá ser realizado 60 segundos após o envio anterior; novos reenvios reiniciam o intervalo de 60 segundos. Limitar a três reenvios na janela de uma hora, além do envio inicial; quando excedido, modal de bloqueio por uma hora.
- Cada novo código invalida imediatamente o anterior, reinicia seus 10 minutos de vigência e zera o número de tentativas daquela emissão, sem apagar o histórico de reenvios na janela de uma hora.
- “Não tenho acesso a esse e-mail” abre modal informativo Atualização de Dados, sem permitir informar e-mail alternativo ou avançar sem o código.

#### 4.2.4 Etapa 3 — Nova Senha e validações

- “Crie uma nova senha” e “Confirme a nova senha” são obrigatórios, caracteres ocultos inicialmente, com 8 a 16 caracteres, sem nenhum espaço (inclusive espaços internos). Exigir pelo menos uma letra maiúscula A–Z, uma minúscula a–z, um dígito 0–9 e um dos caracteres especiais aceitos pela política do AUTH.
- A validação visual do protótipo reconhece como caracteres especiais os símbolos ASCII de pontuação, incluindo !, @, #, $, %, ^, &, *, parênteses, sinais matemáticos, colchetes, chaves, ponto, vírgula, barra e aspas. A persistência deverá aplicar a política vigente do AUTH; não considerar apenas a indicação visual do checklist como confirmação de aceite pelo serviço.

- Checklist atualiza durante preenchimento: Mínimo de 8 caracteres; Uma letra maiúscula; Uma letra minúscula; Um número; Um caractere especial; As senhas devem ser iguais. A contagem máxima de 16 e a proibição de espaços são validações do campo, não itens adicionais do checklist.
- Nova senha vazia: “Senha é obrigatória.”; não conforme: “A senha informada não atende aos critérios de segurança.”. Confirmação vazia: “Confirmação de senha é obrigatória.”; diferente: “As senhas não coincidem.”.
- “Redefinir senha” deverá habilitar somente após todos os critérios e a confirmação estarem válidos. Durante processamento, desabilitar para evitar novas requisições; o AUTH deverá invalidar o código após redefinição bem-sucedida.
- Senha centralizada no AUTH: alteração é válida para outras aplicações que compartilhem aquela conta; não altera perfil, matrícula, situação funcional, permissões ou abrangências.

#### 4.2.5 Conclusão, falhas e feedback

- Após sucesso, encerrar tentativa de recuperação, navegar automaticamente para /login e exibir uma única vez toast success “Senha alterada com sucesso. Entre no SIAGE-RH utilizando sua nova senha.”; sem modal de sucesso.
- Em erro da persistência da senha, não alterar a credencial, manter a etapa Nova Senha e os campos, encerrar loading e exibir toast error “Não foi possível alterar sua senha. Tente novamente.”.
- Falhas não relacionadas a campo deverão usar toast; validações de CPF, código, nova senha e confirmação deverão usar mensagens junto ao controle correspondente, com exceção do código expirado, tratado por toast.
- Não exibir ícone de crachá no campo CPF; o campo de Código de segurança utiliza ícone de identificação numérica. Não exibir contador público de expiração do código.

## 5) Detalhamento da funcionalidade

### 5.1 Cabeçalho e estrutura

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Cabeçalho institucional</strong> | <ul><li><strong>Tipo:</strong> Área fixa de identificação da aplicação.</li><li><strong>Componente SIAGE-UI:</strong> Estrutura de layout própria com elementos de imagem e navegação; usa SIconButtonComponent nas telas públicas e no Primeiro Acesso.</li><li><strong>Comportamentos:</strong> Exibe logomarca do SIAGE-RH à esquerda e ações da etapa à direita; mantém-se visível na rolagem e não concede acesso interno.</li></ul> |
| <strong>Alternar tema</strong> | <ul><li><strong>Tipo:</strong> IconButton.</li><li><strong>Componente SIAGE-UI:</strong> SIconButtonComponent (s-icon-button) nas telas públicas e Primeiro Acesso.</li><li><strong>Acessibilidade:</strong> Nome acessível “Alternar para tema claro” ou “Alternar para tema escuro”, conforme o tema atual.</li><li><strong>Comportamentos:</strong> Alterna claro/escuro e mantém a preferência no fluxo, inclusive quando o usuário navega entre Login e Redefinir Senha.</li></ul> |
| <strong>Card de redefinição</strong> | <ul><li><strong>Tipo:</strong> Card único de formulário, apresentação exclusiva por etapa.</li><li><strong>Componente SIAGE-UI:</strong> SCardComponent (s-card: padding 24, elevation 2).</li><li><strong>Comportamentos:</strong> Agrupa indicador, título/orientação, formulário e ações; não sobrepõe campos com banner.</li></ul> |
| <strong>Indicador de etapas</strong> | <ul><li><strong>Tipo:</strong> Stepper visual não interativo com três posições.</li><li><strong>Componente SIAGE-UI:</strong> Composição própria com MatIcon no protótipo; alternativa oficial: SStepsComponent (s-steps: steps, activeId e clickable=false).</li><li><strong>Etapas:</strong> 1 Identificação; 2 Verificação; 3 Nova Senha.</li><li><strong>Comportamentos:</strong> Etapa atual em destaque; anteriores concluídas; etapas posteriores não clicáveis e não acessíveis sem validação.</li></ul> |
| <strong>Rodapé institucional</strong> | <ul><li><strong>Tipo:</strong> Bloco informativo e navegação externa.</li><li><strong>Componente SIAGE-UI:</strong> Estrutura textual e imagens próprias da aplicação.</li><li><strong>Comportamentos:</strong> Exibe marca do Governo da Paraíba / Secretaria da Educação, link externo “Governo da Paraíba” e © 2026 SIAGE. Secretaria de Estado da Educação da Paraíba.; link abre nova aba com proteção rel=noopener noreferrer.</li></ul> |

### 5.2 Etapa 1 — Identificação

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Título e orientação</strong> | <ul><li><strong>Título:</strong> “Identificação”.</li><li><strong>Orientação:</strong> “Informe seu CPF para receber o código de segurança.”</li><li><strong>Comportamentos:</strong> Informar a finalidade da etapa sem exibir dados de conta antes da consulta ao AUTH.</li></ul> |
| <strong>CPF</strong> | <ul><li><strong>Label:</strong> “CPF”.</li><li><strong>Tipo:</strong> Input texto com entrada numérica e máscara.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field: required e error), SInputComponent (s-input: maxlength=14) e SMaskDirective (sMask=cpf, maskValue=raw) como alternativa à máscara própria; validação matemática pela aplicação.</li><li><strong>Obrigatoriedade:</strong> Obrigatório.</li><li><strong>Placeholder:</strong> “000.000.000-00”.</li><li><strong>Validação:</strong> Até 11 dígitos; CPF matematicamente válido com dois DVs e sem sequências repetidas; consulta sem pontuação.</li><li><strong>Mensagem obrigatório:</strong> “CPF é obrigatório.”</li><li><strong>Mensagem inválido:</strong> “CPF é inválido.”</li><li><strong>Comportamentos:</strong> Validar ao sair do campo; o input não terá ícone de crachá; não permite avançar com CPF inválido.</li></ul> |
| <strong>Continuar</strong> | <ul><li><strong>Label:</strong> “Continuar”.</li><li><strong>Tipo:</strong> Button primário.</li><li><strong>Componente SIAGE-UI:</strong> SButtonComponent (s-button: fullWidth/loading).</li><li><strong>Habilitação:</strong> Somente com CPF válido e fora de processamento.</li><li><strong>Carregamento:</strong> “Verificando...”.</li><li><strong>Comportamentos:</strong> Consulta AUTH e autorização; com conta válida envia código e avança; com erro permanece.</li></ul> |
| <strong>Voltar para o login</strong> | <ul><li><strong>Label:</strong> “Voltar para o login”.</li><li><strong>Tipo:</strong> Link de navegação com ícone de retorno.</li><li><strong>Componente SIAGE-UI:</strong> RouterLink e MatIcon em estrutura própria; SIconComponent (s-icon: name) é alternativa oficial para o ícone.</li><li><strong>Comportamentos:</strong> Encerra tentativa e volta à RF001 em /login.</li></ul> |

### 5.3 Etapa 2 — Verificação

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Título e e-mail de destino</strong> | <ul><li><strong>Título:</strong> “Verificação”.</li><li><strong>Orientação:</strong> “Enviamos um código para o e-mail cadastrado {e-mail mascarado}.”</li><li><strong>Tipo:</strong> Texto informativo.</li><li><strong>Comportamentos:</strong> Mascarar a parte local e manter domínio para reconhecimento, sem exibir e-mail integral.</li></ul> |
| <strong>Código de segurança</strong> | <ul><li><strong>Label:</strong> “Código de segurança”.</li><li><strong>Tipo:</strong> Campo texto com teclado numérico.</li><li><strong>Componente SIAGE-UI:</strong> MatFormField e MatInput com ícone sufixo no protótipo; alternativa oficial: SFieldComponent (error), SInputComponent (s-input: type=tel, maxlength=6, icon=pin, autocomplete=one-time-code) e SOnlyDigitsDirective (sOnlyDigits). O ícone do s-input é à esquerda.</li><li><strong>Obrigatoriedade:</strong> Obrigatório.</li><li><strong>Placeholder:</strong> “000000”.</li><li><strong>Máximo:</strong> 6 dígitos numéricos.</li><li><strong>Mensagem código inválido:</strong> “Código inválido. Tentativas restantes: X.”</li><li><strong>Mensagem limite tentativas:</strong> “Número máximo de tentativas atingido.”</li><li><strong>Comportamentos:</strong> Descarta caracteres não numéricos; apresenta erro abaixo; código expirado gera toast, não contagem regressiva na tela.</li></ul> |
| <strong>Não recebeu o código?</strong> | <ul><li><strong>Tipo:</strong> Texto + temporizador de reenvio.</li><li><strong>Componente SIAGE-UI:</strong> Apresentação própria com botão e contador; sem timer de validade visível.</li><li><strong>Tempo:</strong> 60 segundos desde o envio anterior.</li><li><strong>Texto:</strong> “Não recebeu o código? Reenviar em 00:SS”.</li><li><strong>Comportamentos:</strong> Durante a espera, o reenvio permanece indisponível; ao zerar, mostra “Reenviar código”.</li></ul> |
| <strong>Reenviar código</strong> | <ul><li><strong>Label:</strong> “Reenviar código”.</li><li><strong>Tipo:</strong> Ação textual secundária.</li><li><strong>Componente SIAGE-UI:</strong> Botão próprio com MatIcon no protótipo; alternativa oficial: SButtonComponent (s-button: variant=link, icon e disabled); a lógica de reenvio é da aplicação.</li><li><strong>Habilitação:</strong> Contador de 60 segundos concluído, sem bloqueio e dentro do limite de três reenvios/hora.</li><li><strong>Comportamentos:</strong> Invalida código anterior, cria outro, reinicia validade e contador e retorna a três tentativas para nova emissão.</li></ul> |
| <strong>Não tenho acesso a esse e-mail</strong> | <ul><li><strong>Label:</strong> “Não tenho acesso a esse e-mail”.</li><li><strong>Tipo:</strong> Botão textual.</li><li><strong>Componente SIAGE-UI:</strong> Botão próprio no protótipo; alternativa oficial: SButtonComponent (s-button: variant=link) com SModalService.</li><li><strong>Comportamentos:</strong> Abre Atualização de Dados, sem mudar endereço cadastrado.</li></ul> |
| <strong>Validar código</strong> | <ul><li><strong>Label:</strong> “Validar código”.</li><li><strong>Tipo:</strong> Button primário.</li><li><strong>Componente SIAGE-UI:</strong> SButtonComponent (s-button: fullWidth/loading).</li><li><strong>Habilitação:</strong> 6 dígitos e tentativas disponíveis; processamento desabilita ação.</li><li><strong>Carregamento:</strong> “Validando...”.</li><li><strong>Comportamentos:</strong> Verificar código vigente com AUTH; em sucesso avança para Nova Senha; falha consome tentativa segundo regra.</li></ul> |
| <strong>Corrigir identificação</strong> | <ul><li><strong>Label:</strong> “Corrigir identificação”.</li><li><strong>Tipo:</strong> Ação secundária com ícone de edição.</li><li><strong>Componente SIAGE-UI:</strong> Controle próprio com MatIcon no protótipo; alternativa oficial: SButtonComponent (s-button: variant=link e icon).</li><li><strong>Comportamentos:</strong> Volta à Identificação e invalida código ativo; permite atualizar CPF.</li></ul> |
| <strong>Voltar para o login — etapa 2</strong> | <ul><li><strong>Label:</strong> “Voltar para o login”.</li><li><strong>Tipo:</strong> Link.</li><li><strong>Comportamentos:</strong> Encerra tentativa e invalida o código, retornando à RF001.</li></ul> |

### 5.4 Etapa 3 — Nova Senha

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Título e orientação</strong> | <ul><li><strong>Título:</strong> “Nova Senha”.</li><li><strong>Orientação:</strong> “Crie uma senha que atenda a todos os critérios de segurança abaixo.”</li></ul> |
| <strong>Crie uma nova senha</strong> | <ul><li><strong>Label:</strong> “Crie uma nova senha”.</li><li><strong>Tipo:</strong> Input de senha.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field: error) e SInputComponent (s-input: type=password, maxlength=16).</li><li><strong>Obrigatoriedade:</strong> Obrigatório.</li><li><strong>Placeholder:</strong> “Digite a nova senha”.</li><li><strong>Limite:</strong> 8 a 16 caracteres, sem espaços.</li><li><strong>Critérios:</strong> Mínimo 1 maiúscula, 1 minúscula, 1 número e 1 especial conforme AUTH.</li><li><strong>Mensagem vazio:</strong> “Senha é obrigatória.”</li><li><strong>Mensagem critério:</strong> “A senha informada não atende aos critérios de segurança.”</li><li><strong>Comportamentos:</strong> Oculta inicialmente; rejeitar espaços; não exibir erro antes de saída ou envio; checklist é informativo e atualizado em tempo real.</li></ul> |
| <strong>Confirme a nova senha</strong> | <ul><li><strong>Label:</strong> “Confirme a nova senha”.</li><li><strong>Tipo:</strong> Input de senha.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent e SInputComponent (s-input: type=password, maxlength=16).</li><li><strong>Obrigatoriedade:</strong> Obrigatório.</li><li><strong>Placeholder:</strong> “Digite novamente a nova senha”.</li><li><strong>Mensagem vazio:</strong> “Confirmação de senha é obrigatória.”</li><li><strong>Mensagem divergência:</strong> “As senhas não coincidem.”</li><li><strong>Comportamentos:</strong> Exigir identidade exata com nova senha; rejeitar espaços; validar ao sair ou enviar.</li></ul> |
| <strong>Checklist de segurança</strong> | <ul><li><strong>Tipo:</strong> Lista de seis condições, exclusivamente informativa.</li><li><strong>Componente SIAGE-UI:</strong> HTML e MatIcon próprios no protótipo; alternativa oficial: SPasswordRequirementsComponent (s-password-requirements: value e rules), com regras da aplicação, inclusive a comparação com a confirmação.</li><li><strong>Itens:</strong> Mínimo de 8 caracteres; Uma letra maiúscula; Uma letra minúscula; Um número; Um caractere especial; As senhas devem ser iguais.</li><li><strong>Comportamentos:</strong> Atualização em tempo real; requisito atendido indicado visual e textualmente, sem depender somente da cor; máximo e espaços não são itens adicionais.</li></ul> |
| <strong>Redefinir senha</strong> | <ul><li><strong>Label:</strong> “Redefinir senha”.</li><li><strong>Tipo:</strong> Button primário.</li><li><strong>Componente SIAGE-UI:</strong> SButtonComponent (s-button: fullWidth/loading).</li><li><strong>Habilitação:</strong> Todos os seis critérios atendidos, campos válidos e processamento ausente.</li><li><strong>Carregamento:</strong> “Redefinindo senha...”.</li><li><strong>Comportamentos:</strong> Persiste a nova senha no AUTH; sucesso encaminha Login com toast; erro mantém etapa atual sem alterar a credencial.</li></ul> |
| <strong>Voltar para identificação</strong> | <ul><li><strong>Label:</strong> “Voltar para identificação”.</li><li><strong>Tipo:</strong> Ação de retorno.</li><li><strong>Componente SIAGE-UI:</strong> Estrutura própria com MatIcon no protótipo; alternativas oficiais: SButtonComponent (s-button: variant=link e icon) ou SIconComponent para o ícone.</li><li><strong>Comportamentos:</strong> Invalida a tentativa de recuperação anterior e zera os valores dos campos de nova senha.</li></ul> |

### 5.5 Estados e tratamento de falhas

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Usuário inexistente</strong> | <ul><li><strong>Tipo:</strong> Erro funcional da consulta ao AUTH.</li><li><strong>Componente SIAGE-UI:</strong> SToastService (error).</li><li><strong>Mensagem:</strong> “Cadastro não encontrado. Verifique os dados informados.”</li><li><strong>Comportamentos:</strong> Permanece na Identificação; não envia código.</li></ul> |
| <strong>Usuário sem acesso</strong> | <ul><li><strong>Tipo:</strong> Erro de autorização.</li><li><strong>Componente SIAGE-UI:</strong> SToastService (error).</li><li><strong>Mensagem:</strong> “Seu usuário não possui permissão para acessar o SIAGE-RH.”</li><li><strong>Comportamentos:</strong> Permanece na Identificação; não envia código.</li></ul> |
| <strong>Código expirado</strong> | <ul><li><strong>Tipo:</strong> Validação temporal do código.</li><li><strong>Componente SIAGE-UI:</strong> SToastService (error).</li><li><strong>Mensagem:</strong> “Código expirado. Solicite o reenvio e tente novamente.”</li><li><strong>Comportamentos:</strong> Não avança para Nova Senha; reenvio sujeito a limites.</li></ul> |
| <strong>Falha de alteração</strong> | <ul><li><strong>Tipo:</strong> Falha técnica de persistência.</li><li><strong>Componente SIAGE-UI:</strong> SToastService (error).</li><li><strong>Mensagem:</strong> “Não foi possível alterar sua senha. Tente novamente.”</li><li><strong>Comportamentos:</strong> Mantém senha anterior e a etapa corrente.</li></ul> |

## 6) Modais

| Modal | Quando exibir | Título/Mensagem | Ações/Regras | Imagens |
| --- | --- | --- | --- | --- |
| <strong>6.1 Limite de tentativas</strong> | Após três códigos incorretos para a conta dentro da tentativa de verificação. | Título: “Atenção!”. Mensagem: “Número máximo de tentativas atingido. Você errou o código 3 vezes. Por segurança, a verificação foi temporariamente bloqueada. Tente novamente após uma hora.” | <ul><li><strong>Componente SIAGE-UI:</strong> Modal próprio no protótipo; alternativa oficial: SModalService.open com SModalComponent e SModalFooterDirective.</li><li><strong>Ação:</strong> “Fechar”; não reabilitar tentativa antes de 1 hora nem reutilizar código.</li></ul> |  |
| <strong>6.2 Limite de reenvios</strong> | Quando o usuário solicitar código após três reenvios na janela de uma hora. | Título: “Atenção!”. Mensagem: “Limite de solicitações de código excedido. Por segurança, aguarde uma hora antes de solicitar um novo código.” | <ul><li><strong>Componente SIAGE-UI:</strong> Modal próprio no protótipo; alternativa oficial: SModalService.open com SModalComponent e SModalFooterDirective.</li><li><strong>Ação:</strong> “Fechar”; manter o bloqueio por uma hora, inclusive após reiniciar a tela.</li></ul> |  |
| <strong>6.3 Atualização de Dados</strong> | Ao acionar “Não tenho acesso a esse e-mail”. | Título: “Atualização de Dados”. Mensagem: “Caso você não reconheça ou não tenha mais acesso ao e-mail cadastrado, procure o responsável pela Gestão de Acesso da sua unidade para atualizar seus dados de acesso ao SIAGE-RH.” | <ul><li><strong>Componente SIAGE-UI:</strong> Modal próprio no protótipo; alternativa oficial: SModalService.open com SModalComponent e SModalFooterDirective.</li><li><strong>Ação:</strong> “Ok”; apenas fecha o modal, sem atualizar e-mail ou avançar.</li></ul> |  |

## 7) Toast

| Toast | Quando exibir | Título/Mensagem | Ações/Regras | Imagens |
| --- | --- | --- | --- | --- |
| <strong>Cadastro não encontrado</strong> | CPF não corresponde a conta no AUTH. | “Cadastro não encontrado. Verifique os dados informados.” | <ul><li><strong>Componente SIAGE-UI:</strong> SToastService (error).</li><li><strong>Comportamentos:</strong> Não gera código.</li></ul> |  |
| <strong>Sem permissão</strong> | Conta não tem acesso ao SIAGE-RH. | “Seu usuário não possui permissão para acessar o SIAGE-RH.” | <ul><li><strong>Componente SIAGE-UI:</strong> SToastService (error).</li><li><strong>Comportamentos:</strong> Não gera código.</li></ul> |  |
| <strong>Código expirado</strong> | Tentativa de validar código após os 10 minutos. | “Código expirado. Solicite o reenvio e tente novamente.” | <ul><li><strong>Componente SIAGE-UI:</strong> SToastService (error).</li><li><strong>Comportamentos:</strong> Não avançar; não exibir cronômetro da expiração.</li></ul> |  |
| <strong>Falha ao redefinir senha</strong> | AUTH falha ao persistir nova credencial. | “Não foi possível alterar sua senha. Tente novamente.” | <ul><li><strong>Componente SIAGE-UI:</strong> SToastService (error).</li><li><strong>Comportamentos:</strong> Preservar credencial antiga e permanecer na etapa Nova Senha.</li></ul> |  |
| <strong>Senha alterada</strong> | Após sucesso e navegação automática para RF001. | “Senha alterada com sucesso. Entre no SIAGE-RH utilizando sua nova senha.” | <ul><li><strong>Componente SIAGE-UI:</strong> SToastService (success), exibido na RF001.</li><li><strong>Comportamentos:</strong> Evento de sucesso consumido uma vez; sem modal.</li></ul> |  |

## 8) Protótipos

| Protótipo |
| --- |
| <strong>Redefinir Senha — Identificação por CPF</strong> |
|  |
| <strong>Redefinir Senha — Verificação, código e temporizador de reenvio</strong> |
|  |
| <strong>Redefinir Senha — Código inválido e bloqueio de três tentativas</strong> |
|  |
| <strong>Redefinir Senha — Modal Atualização de Dados</strong> |
|  |
| <strong>Redefinir Senha — Nova Senha e checklist</strong> |
|  |
| <strong>Redefinir Senha — conclusão no Login com toast</strong> |
|  |

## 9) Lacunas da biblioteca SIAGE-UI

Na versão 20.0.5, SStepsComponent, SPasswordRequirementsComponent e SModalService oferecem alternativas para o indicador, o checklist e os modais próprios. O campo de código pode ser composto com SInputComponent e SOnlyDigitsDirective; o temporizador é responsabilidade da aplicação. Não foi identificada lacuna adicional para esta RF; LAC-001 e LAC-002 não se aplicam. A limitação de foco LAC-003 é detalhada na RF004.
