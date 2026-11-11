# AGENTS.md — Diretrizes para Agentes de IA (SIAGE-RH 2.0)

## 1. Contexto do Projeto

- **Sistema:** SIAGE-RH 2.0 — protótipo navegável do sistema de Gestão de Recursos Humanos da Secretaria de Estado da Educação da Paraíba (SEE-PB).
- **Propósito:** Construir interfaces, validar requisitos funcionais, demonstrar fluxos de negócio e servir como especificação viva para repasse à equipe de desenvolvimento.
- **Histórico Técnico:** Originalmente criado no Google AI Studio e migrado para **Angular 20.3** com a biblioteca de componentes oficial **`@siage/siage-ui@20.0.5`**.
- **Versionamento:** Repositório privado no Gitea, branch de trabalho `integracao-siage-ui`.

---

## 2. Stack Técnica e Scripts Confirmados

- **Framework:** Angular `^20.3.34` (`@angular/core`, `@angular/forms`, `@angular/router`) e `@angular/cli` `^20.3.17`.
- **Design System / UI:** `@siage/siage-ui` `^20.0.5`, `@angular/material` `^20.2.14`, `@angular/cdk` `^20.2.14`, Tailwind CSS `^4.0.0`.
- **Estilos Globais:** `src/styles.css` e `src/siage-theme.scss`.
- **Testes Unitários:** Builder `@angular/build:unit-test` com runner `vitest` (`^3.1.1`) e `jsdom`.
- **Scripts (`package.json`):**
  - `npm start` / `npm run dev`: `ng serve --host 0.0.0.0 --port 3000`
  - `npm run build`: `ng build`
  - `npm run watch`: `ng build --watch --configuration development`
  - `npm run lint`: `ng lint`
  - Testes direcionados via CLI: `ng test --watch=false --include <caminho-do-spec>`

---

## 3. Objetivo Atual da Migração

- Migrar os componentes do protótipo para os componentes oficiais da biblioteca `@siage/siage-ui`.
- **Uso real da biblioteca:** Utilizar efetivamente os seletores, inputs, outputs e ControlValueAccessors oficiais da `@siage/siage-ui` — **não** apenas reproduzir a aparência visual com HTML/CSS customizado.
- **Preservação Funcional:** Manter integralmente regras de negócio, mensagens de feedback, validações por campo, controle de permissões (`permissionGuard`, `createPermissionGuard`), guards de saída (`canDeactivate`), dados simulados e fluxos aprovados.

---

## 4. Estado Atual dos Módulos

- **Autenticação e Estrutura Base (Migrados):**
  - Login (`src/app/login.ts`), Primeiro Acesso (`src/app/primeiro-acesso.ts`), Esqueci Minha Senha (`src/app/esqueci-senha.ts`), Selecionar Matrícula (`src/app/selecionar-matricula.ts`), menu lateral e barra superior (`src/app/shell.ts`).
- **Configurar Secretaria Geral (`src/app/secretaria-geral.ts`):**
  - **Migrado e validado.** É a **principal referência técnica e visual** para os demais CRUDs.
- **Demais Unidades da Hierarquia:**
  - Secretaria Executiva (`src/app/secretaria-executiva.ts`), Gerência Executiva (`src/app/gerencia-executiva.ts`), Gerência Regional (`src/app/gerencia-regional.ts`), Subgerência (`src/app/subgerencia.ts`) e Núcleo (`src/app/nucleo.ts`): migração implementada, em fase de ajustes finos e validação visual/comportamental.
- **Exceção de Hierarquia (`src/app/excecao-hierarquia.ts`):**
  - Ainda **não migrado**.
- **Outros Módulos (Hub de Configurações, Índices SEAD, Profissionais/Importação, Busca Global, etc.):**
  - Sempre inspecionar o código-fonte do arquivo antes de qualquer intervenção para confirmar seu estado real.

---

## 5. Diretrizes Permanentes de Atuação

1. **Inspeção Prévia da API e do Código:** Antes de editar qualquer componente, consulte a implementação existente no projeto e as definições reais (`*.d.ts` / pacotes em `node_modules/@siage/siage-ui`) da biblioteca oficial.
2. **Referência Padrão:** Priorize os componentes oficiais da `@siage/siage-ui` seguindo os padrões estruturais, de template e de sincronização reativa validados em `src/app/secretaria-geral.ts`.
3. **Respeito às Particularidades de Cada CRUD:** Não replique regras de outro módulo de forma indiscriminada. Preserve as especificidades de cada nível hierárquico (ex.: vínculos superiores, bloqueios de UTB, modais de confirmação de troca, preenchimento de endereço/CEP/município, tipos de vínculo).
4. **Restrição Estrita de Escopo:** Altere exclusivamente os arquivos, componentes ou telas solicitados na tarefa atual.
5. **Preservação do Simulador:** **Nunca** modifique o simulador de cenários (`src/app/simulator.ts`), utilizado para demonstrações e testes funcionais do protótipo.
6. **Integridade da Biblioteca Oficial:** **Nunca** altere arquivos dentro de `node_modules/@siage/siage-ui` ou qualquer pacote externo.
7. **Controle de Versão (Git):** **Não** execute `git commit`, `git push`, `git checkout`, `git reset` ou mudanças de branch sem solicitação explícita do usuário.
8. **Padrões de UX e Feedback:** Preserve o funcionamento de Toasts (`ToastService`), modais de confirmação, validação individual por campo (`s-error` / estados de toque) e proteção contra perda de alterações não salvas (`canDeactivate`).
9. **Mudanças Cirúrgicas:** Evite refatorações amplas, abstrações/componentes genéricos não solicitados ou alterações em estilos/configurações globais sem necessidade comprovada.
10. **Execução Econômica de Testes e Build:** Execute apenas testes direcionados ao escopo alterado (`--include`) e evite processos simultâneos ou investigações repetitivas.
11. **Critério de Conclusão:** Uma tarefa não está concluída apenas porque o build compilou. Verifique a consistência comportamental (seleção, edição, limpeza, bloqueios) e a fidelidade visual.
12. **Comunicação Objetiva:** Ao finalizar uma tarefa, relate de forma direta o que já estava pronto, o que foi ajustado, os resultados das validações executadas, eventuais pendências e riscos identificados.
