# RF001 - Login (Autenticação) - Gestão de RH V2

## 1) Histórico

| Data | Versão | Descrição | Autor | Versão mind | Sprint de desenvolvimento |
| --- | --- | --- | --- | --- | --- |
| 16 de nov. de 2026 | 1.0 | Atualização da funcionalidade | A definir | 01 | A definir |

## 2) História de Usuário

Eu, como usuário do SIAGE-RH, na qualidade de Administrador ou Servidor,

Quero acessar a página pública de autenticação e entrar com CPF e senha,

Para autenticar-me com segurança e acessar as funcionalidades permitidas ao meu vínculo e perfil.

## 3) Fluxo de acesso à funcionalidade

Acesso à URL raiz do SIAGE-RH >> /login >> Primeiro Acesso (quando obrigatório) >> Selecionar Matrícula (quando houver mais de um vínculo elegível) >> Página Inicial

**Pré-condições:**

- O Login deverá ser público e acessível sem sessão anterior.
- Para autenticação bem-sucedida, a conta deverá existir no AUTH, estar ativa e ter permissão de acesso ao SIAGE-RH.
- A liberação das funcionalidades internas depende da definição do contexto de matrícula, quando aplicável.

## 4) Critérios de Aceite

### 4.1 Acesso e permissões

- A rota /login e a raiz da aplicação deverão disponibilizar a página pública sem autenticação; usuários sem sessão não podem acessar recursos protegidos.
- AUTH identifica CPF, confere senha e situação da conta; o SIAGE-RH verifica a permissão da aplicação e resolve o contexto de matrícula.
- A aplicação deve impedir acesso a dados internos antes de autenticação, autorização e conclusão do primeiro acesso ou seleção de matrícula.

### 4.2 Regras gerais

#### 4.2.1 Estrutura e apresentação da página

- Exibir cabeçalho institucional com marca SIAGE-RH, ação Início e alternância de tema; área principal com identificação “SIAGE” e subtítulo “Gestão de Recursos Humanos”; formulário em card; seção “Gestão de RH em um só lugar” e rodapé.
- O texto institucional será “Gestão de Recursos Humanos da rede estadual de ensino da Paraíba. Gerencie informações funcionais, acompanhe processos e realize suas atividades em um único sistema.”; apresentar o aviso “Área restrita para servidores públicos da SEE-PB com perfil Administrador ou Servidor.”.
- O formulário terá título “Acesse o SIAGE-RH” e orientação “Informe seu CPF e senha para acessar o sistema.”, com campos CPF, Senha, Lembrar de mim, Esqueceu a senha? e botão “Entrar no sistema”.
- Em telas amplas, informações institucionais aparecem à esquerda e card à direita; em telas menores, priorizar o card e apresentar resumo institucional inferior. Não permitir rolagem horizontal nas larguras suportadas.
- O link “Conheça as funcionalidades” deverá levar à seção de módulos informativos; cards não abrirão funcionalidades restritas antes da autenticação. Elementos de simulação permanecem exclusivos do ambiente de protótipo.

#### 4.2.2 Campos, obrigatoriedade e validações

- CPF é obrigatório, exclusivamente numérico, até 11 dígitos, exibido na máscara 000.000.000-00. Descartar pontuação antes de enviar ao AUTH.
- Validar os dois dígitos verificadores pelo algoritmo oficial e rejeitar sequências com 11 dígitos idênticos.
- A verificação matemática do CPF deverá considerar os nove primeiros dígitos, multiplicá-los por pesos de 10 a 2 e obter o primeiro DV (resto da soma por 11; resto menor que 2 resulta em 0, caso contrário 11 menos o resto). Repetir com os dez primeiros dígitos e pesos de 11 a 2 para obter o segundo DV. Ambos devem coincidir com os dois dígitos informados.
- CPF vazio: “CPF é obrigatório.”; incompleto, com sequência repetida ou dígitos verificadores inválidos: “CPF é inválido.”. Exibir a mensagem abaixo do campo após sair dele; ao tentar enviar CPF inválido, apresentar também o toast “CPF é inválido.” sem consultar o AUTH.
- Senha é obrigatória e deverá aceitar até 80 caracteres, sem aplicar à autenticação a política de tamanho e composição exigida na definição de uma nova senha. Deve ser oculta inicialmente, com mecanismo individual de exibir/ocultar quando disponível no componente, sem expor o valor fora do campo. Vazio: “Senha é obrigatória.”. O campo deverá impedir a inserção de caracteres que ultrapassem o limite de 80.
- As validações de campo deverão ocorrer após perda de foco ou tentativa de envio; as labels permanecerão visíveis e a área de erro abaixo de cada campo deverá evitar deslocamento do formulário.
- Lembrar de mim é checkbox opcional, desmarcado inicialmente. Não altera exigência de senha nem autorização; qualquer persistência de sessão deve respeitar a política do AUTH. A opção não deverá armazenar senha em texto aberto.

#### 4.2.3 Autenticação e roteamento

- “Entrar no sistema” estará acionável quando CPF e senha tiverem conteúdo e não houver processamento; ao acioná-lo, revalidar CPF e senha e só enviar ao AUTH se ambos atenderem às regras. Com CPF inválido, exibir toast sem solicitar autenticação. Durante a requisição, desabilitar reenvio e exibir carregamento “Entrando...”.
- Resultado: (1) autenticação inválida permanecer no Login; (2) conta sem permissão/inativa impedir acesso; (3) primeiro acesso obrigatório /primeiro-acesso, sem matrícula ativa; (4) uma matrícula elegível definir contexto e ir para /inicio; (5) duas ou mais matrículas elegíveis /selecionar-matricula, sem matrícula previamente ativa.
- Quando houver zero matrícula elegível, não liberar Página Inicial; apresentar tratamento de indisponibilidade/ausência de vínculos conforme contrato de autorização, sem escolher vínculo arbitrário.
- Perfis Administrador e Servidor pertencem à conta do AUTH; permissões, responsabilidades e abrangências operacionais deverão ser resolvidas a partir da matrícula ativa, não a partir de cards da página pública.
- O protótipo utiliza credenciais e usuários simulados; CPFs de teste, acesso genérico por CPF válido e latências artificiais não constituem regras para produção.

#### 4.2.4 Mensagens e tratamento de falhas

- CPF ou senha incorretos: mostrar toast warning “CPF ou senha incorretos. Verifique os dados informados.”, manter CPF e limpar Senha; não usar banner.
- Sem acesso ao SIAGE-RH: toast error “Seu usuário não possui permissão para acessar o SIAGE-RH.”; permanecer na página sem iniciar sessão interna.
- Usuário inativo: toast warning “Seu usuário está inativo. Procure o responsável pela Gestão de Acesso da sua unidade.”; não mencionar usuário bloqueado.
- AUTH/serviço indisponível: toast error “Não foi possível concluir o acesso. Tente novamente.”; encerrar loading, preservar CPF e permitir nova tentativa.
- Cadastro inexistente, quando a integração distinguir esse cenário: toast error “Cadastro não encontrado. Verifique os dados informados.”, sem conceder acesso.
- Após Primeiro Acesso ou Redefinir Senha bem-sucedidos, abrir /login e apresentar uma única vez o toast success “Senha alterada com sucesso. Entre no SIAGE-RH utilizando sua nova senha.”. Não apresentar banner nem modal de sucesso. A mensagem é consumida e não reaparece em nova visita ao Login.

#### 4.2.5 Ações públicas e conteúdo informativo

- “Início” posiciona a página no topo. A marca clicável encaminha à raiz pública. “Esqueceu a senha?” abre a RF002 em /login/esqueci-senha, sem exigir sessão.
- Na seção “Gestão de RH em um só lugar” apresentar os seis cards não navegáveis: Quadro Funcional, Férias, Avaliação de Desempenho, Readaptação, Profissionais e Configurações, com respectivos textos informativos.
- O link “Governo da Paraíba” no rodapé abre https://paraiba.pb.gov.br em nova aba; o rodapé e cabeçalho mantêm identidade institucional no tema claro e escuro.

## 5) Detalhamento da funcionalidade

### 5.1 Cabeçalho e estrutura pública

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Cabeçalho institucional</strong> | <ul><li><strong>Tipo:</strong> Área fixa de identificação da aplicação.</li><li><strong>Componente SIAGE-UI:</strong> Estrutura de layout própria com elementos de imagem e navegação; usa SIconButtonComponent nas telas públicas e no Primeiro Acesso.</li><li><strong>Comportamentos:</strong> Exibe logomarca do SIAGE-RH à esquerda e ações da etapa à direita; mantém-se visível na rolagem e não concede acesso interno.</li></ul> |
| <strong>Alternar tema</strong> | <ul><li><strong>Tipo:</strong> IconButton.</li><li><strong>Componente SIAGE-UI:</strong> SIconButtonComponent (s-icon-button) nas telas públicas e Primeiro Acesso.</li><li><strong>Acessibilidade:</strong> Nome acessível “Alternar para tema claro” ou “Alternar para tema escuro”, conforme o tema atual.</li><li><strong>Comportamentos:</strong> Alterna claro/escuro e mantém a preferência no fluxo, inclusive quando o usuário navega entre Login e Redefinir Senha.</li></ul> |
| <strong>Início</strong> | <ul><li><strong>Label:</strong> “Início”.</li><li><strong>Tipo:</strong> Ação de navegação pública em botão próprio da aplicação.</li><li><strong>Comportamentos:</strong> Rola a página ao início, não acessa recursos autenticados.</li></ul> |
| <strong>Apresentação institucional</strong> | <ul><li><strong>Tipo:</strong> Bloco textual responsivo próprio da aplicação.</li><li><strong>Título:</strong> “SIAGE” / “Gestão de Recursos Humanos”.</li><li><strong>Descrição:</strong> “Gestão de Recursos Humanos da rede estadual de ensino da Paraíba. Gerencie informações funcionais, acompanhe processos e realize suas atividades em um único sistema.”</li><li><strong>Aviso:</strong> “Área restrita para servidores públicos da SEE-PB com perfil Administrador ou Servidor.”</li></ul> |
| <strong>Card de acesso</strong> | <ul><li><strong>Tipo:</strong> Contêiner de formulário.</li><li><strong>Componente SIAGE-UI:</strong> SCardComponent (s-card: padding 24, elevation 2).</li><li><strong>Título:</strong> “Acesse o SIAGE-RH”.</li><li><strong>Orientação:</strong> “Informe seu CPF e senha para acessar o sistema.”</li><li><strong>Comportamentos:</strong> Mantém campos agrupados, valores válidos e mensagens específicas de erro.</li></ul> |

### 5.2 Formulário de autenticação

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>CPF</strong> | <ul><li><strong>Label:</strong> “CPF”.</li><li><strong>Tipo:</strong> Campo de texto com entrada numérica e máscara.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field: error), SInputComponent (s-input: maxlength=14) e SMaskDirective (sMask=cpf, maskValue=raw) como alternativa à máscara própria; validação matemática pela aplicação.</li><li><strong>Obrigatoriedade:</strong> Obrigatório.</li><li><strong>Placeholder:</strong> “000.000.000-00”.</li><li><strong>Máscara:</strong> 000.000.000-00; persistência e envio com 11 dígitos.</li><li><strong>Validações:</strong> Exigir exatamente 11 dígitos, rejeitar sequência repetida e aplicar dois dígitos verificadores do CPF; ignorar pontuação na validação.</li><li><strong>Mensagem obrigatório:</strong> “CPF é obrigatório.”</li><li><strong>Mensagem inválido:</strong> “CPF é inválido.”</li><li><strong>Comportamentos:</strong> Formatar enquanto digita; mostrar erro inline ao sair do campo e toast apenas em tentativa de envio inválido; CPF válido não implica cadastro no AUTH.</li></ul> |
| <strong>Senha</strong> | <ul><li><strong>Label:</strong> “Senha”.</li><li><strong>Tipo:</strong> Campo de senha.</li><li><strong>Componente SIAGE-UI:</strong> SFieldComponent (s-field: error) e SInputComponent (s-input: type=password, maxlength=80), com mostrar/ocultar integrado.</li><li><strong>Obrigatoriedade:</strong> Obrigatório.</li><li><strong>Placeholder:</strong> “Digite sua senha”.</li><li><strong>Limite máximo:</strong> 80 caracteres.</li><li><strong>Mensagem obrigatório:</strong> “Senha é obrigatória.”</li><li><strong>Validação de limite:</strong> Impedir a digitação além de 80 caracteres; o login não exige a composição prevista para novas senhas.</li><li><strong>Comportamentos:</strong> Inicialmente oculta; permitir mostrar/ocultar sem alterar valor; validação abaixo do campo após saída ou envio; limpar senha em erro de credencial.</li></ul> |
| <strong>Lembrar de mim</strong> | <ul><li><strong>Label:</strong> “Lembrar de mim”.</li><li><strong>Tipo:</strong> Checkbox opcional.</li><li><strong>Componente SIAGE-UI:</strong> SCheckboxComponent (s-checkbox).</li><li><strong>Valor inicial:</strong> Desmarcado.</li><li><strong>Comportamentos:</strong> Permite marcar ou desmarcar a preferência. O protótipo não contém persistência funcional de sessão vinculada ao controle; eventual comportamento de retenção deve ser integrado ao AUTH e não poderá armazenar senha em texto claro.</li></ul> |
| <strong>Esqueceu a senha?</strong> | <ul><li><strong>Label:</strong> “Esqueceu a senha?”.</li><li><strong>Tipo:</strong> Link público.</li><li><strong>Componente SIAGE-UI:</strong> Navegação RouterLink própria do Angular; não se aplica componente específico da biblioteca.</li><li><strong>Destino:</strong> /login/esqueci-senha.</li><li><strong>Comportamentos:</strong> Inicia a RF002, sem autenticação prévia.</li></ul> |
| <strong>Entrar no sistema</strong> | <ul><li><strong>Label:</strong> “Entrar no sistema”.</li><li><strong>Tipo:</strong> Botão primário.</li><li><strong>Componente SIAGE-UI:</strong> SButtonComponent (s-button: variant=primary, fullWidth, loading, loadingText).</li><li><strong>Habilitação:</strong> CPF e senha não vazios e fora de processamento; validação completa ocorre na ação, antes de consultar AUTH.</li><li><strong>Carregamento:</strong> “Entrando...”.</li><li><strong>Comportamentos:</strong> Revalidar CPF/senha; se válido, solicitar autenticação e aguardar resultado sem envio duplicado.</li></ul> |

### 5.3 Módulos informativos e rodapé

| Nome do campo | Detalhamento do campo |
| --- | --- |
| <strong>Conheça as funcionalidades</strong> | <ul><li><strong>Label:</strong> “Conheça as funcionalidades”.</li><li><strong>Tipo:</strong> Âncora pública da página.</li><li><strong>Destino:</strong> #funcionalidades.</li><li><strong>Comportamentos:</strong> Desloca a página para a seção de apresentação dos módulos; não libera acesso interno.</li></ul> |
| <strong>Seção de módulos</strong> | <ul><li><strong>Título:</strong> “Gestão de RH em um só lugar”.</li><li><strong>Descrição:</strong> “Conheça os módulos do SIAGE-RH e as funcionalidades disponíveis para gestão, consulta e acompanhamento dos processos de Recursos Humanos.”</li><li><strong>Componente SIAGE-UI:</strong> Estrutura própria e Material Symbols no protótipo; alternativas oficiais para cada card: SCardComponent e SIconComponent (s-icon: name).</li><li><strong>Comportamentos:</strong> Exibe seis cards sem navegação; conteúdos são informativos, independentemente de autenticação.</li></ul> |
| <strong>Quadro Funcional</strong> | <ul><li><strong>Conteúdo:</strong> “Consulte e acompanhe a composição do quadro funcional, a lotação e a distribuição dos profissionais nas unidades escolares.”</li><li><strong>Comportamentos:</strong> Card informativo, não clicável.</li></ul> |
| <strong>Férias</strong> | <ul><li><strong>Conteúdo:</strong> “Registre, consulte e acompanhe as férias dos profissionais da rede estadual de ensino.”</li><li><strong>Comportamentos:</strong> Card informativo, não clicável.</li></ul> |
| <strong>Avaliação de Desempenho</strong> | <ul><li><strong>Conteúdo:</strong> “Acompanhe o ciclo avaliativo e realize as atividades relacionadas ao PGDI, aos Termos de Avaliação e ao Parecer Conclusivo.”</li><li><strong>Comportamentos:</strong> Card informativo, não clicável.</li></ul> |
| <strong>Readaptação</strong> | <ul><li><strong>Conteúdo:</strong> “Consulte e acompanhe as readaptações funcionais e suas documentações, conforme suas responsabilidades no processo.”</li><li><strong>Comportamentos:</strong> Card informativo, não clicável.</li></ul> |
| <strong>Profissionais</strong> | <ul><li><strong>Conteúdo:</strong> “Consulte e gerencie informações cadastrais e funcionais dos profissionais da rede estadual de ensino.”</li><li><strong>Comportamentos:</strong> Card informativo, não clicável.</li></ul> |
| <strong>Configurações</strong> | <ul><li><strong>Conteúdo:</strong> “Gerencie as tabelas de referência e os parâmetros utilizados nos módulos do SIAGE-RH.”</li><li><strong>Comportamentos:</strong> Card informativo, não clicável.</li></ul> |
| <strong>Rodapé institucional</strong> | <ul><li><strong>Tipo:</strong> Bloco informativo e navegação externa.</li><li><strong>Componente SIAGE-UI:</strong> Estrutura textual e imagens próprias da aplicação.</li><li><strong>Comportamentos:</strong> Exibe marca do Governo da Paraíba / Secretaria da Educação, link externo “Governo da Paraíba” e © 2026 SIAGE. Secretaria de Estado da Educação da Paraíba.; link abre nova aba com proteção rel=noopener noreferrer.</li></ul> |

## 6) Toast

| Toast | Quando exibir | Título/Mensagem | Ações/Regras | Imagens |
| --- | --- | --- | --- | --- |
| <strong>CPF inválido</strong> | Ao tentar envio com CPF que não passe na validação matemática. | “CPF é inválido.” | <ul><li><strong>Componente SIAGE-UI:</strong> SToastService (error).</li><li><strong>Comportamentos:</strong> Não iniciar autenticação; mensagem de campo permanece junto ao CPF.</li></ul> |  |
| <strong>Credenciais incorretas</strong> | AUTH rejeita o par CPF e senha. | “CPF ou senha incorretos. Verifique os dados informados.” | <ul><li><strong>Componente SIAGE-UI:</strong> SToastService (warning).</li><li><strong>Comportamentos:</strong> Manter CPF, limpar senha e permanecer em /login.</li></ul> |  |
| <strong>Usuário sem acesso</strong> | Conta válida não possui autorização ao SIAGE-RH. | “Seu usuário não possui permissão para acessar o SIAGE-RH.” | <ul><li><strong>Componente SIAGE-UI:</strong> SToastService (error).</li><li><strong>Comportamentos:</strong> Não definir matrícula nem acessar rotas internas.</li></ul> |  |
| <strong>Usuário inativo</strong> | AUTH retorna conta inativa. | “Seu usuário está inativo. Procure o responsável pela Gestão de Acesso da sua unidade.” | <ul><li><strong>Componente SIAGE-UI:</strong> SToastService (warning).</li><li><strong>Comportamentos:</strong> Não usar “bloqueado” no texto; impedir acesso.</li></ul> |  |
| <strong>Cadastro não encontrado</strong> | AUTH não identifica a conta informada quando distingue tal retorno. | “Cadastro não encontrado. Verifique os dados informados.” | <ul><li><strong>Componente SIAGE-UI:</strong> SToastService (error).</li><li><strong>Comportamentos:</strong> Não autenticar a conta.</li></ul> |  |
| <strong>Serviço indisponível</strong> | Falha de comunicação ou indisponibilidade do AUTH. | “Não foi possível concluir o acesso. Tente novamente.” | <ul><li><strong>Componente SIAGE-UI:</strong> SToastService (error).</li><li><strong>Comportamentos:</strong> Desativar carregamento e permitir nova tentativa.</li></ul> |  |
| <strong>Senha alterada</strong> | Redirecionamento para Login após RF002 ou RF004 concluída. | “Senha alterada com sucesso. Entre no SIAGE-RH utilizando sua nova senha.” | <ul><li><strong>Componente SIAGE-UI:</strong> SToastService (success).</li><li><strong>Comportamentos:</strong> Exibir uma vez; não utilizar banner nem modal.</li></ul> |  |

## 7) Protótipos

| Protótipo |
| --- |
| <strong>Login — layout público desktop e mobile</strong> |
|  |
| <strong>Login — formulário CPF, Senha e Lembrar de mim</strong> |
|  |
| <strong>Login — erros inline e toasts de autenticação</strong> |
|  |
| <strong>Login — conteúdo informativo dos seis módulos</strong> |
|  |
| <strong>Login — sucesso após alteração de senha</strong> |
|  |

## 8) Lacunas da biblioteca SIAGE-UI

Não foi identificada lacuna adicional para esta RF.
