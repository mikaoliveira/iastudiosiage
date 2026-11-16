# Documentações globais da Hierarquia — orientação de manutenção

Este arquivo orienta a manutenção de funcionalidades reutilizadas por diferentes CRUDs. ~~Não faz parte das regras funcionais da RF005.~~ **Não faz parte das regras funcionais das RF005 e RF006.**

## Estrutura

```text
documentação/
  RF001_...md
  RF002_...md
  RF003_...md
  RF004_...md
  globais/
    RF005_Buscar_Servidor_Global_SIAGE_UI.md
    RF006_Visualizar_Historico_Atos_Governamentais_Global_SIAGE_UI.md
    README_Manutencao_RFs_Globais.md
    [outras RFs globais formalizadas]
```

## Como separar as regras

**A RF global** descreve a interface compartilhada, os filtros, a tabela, as ações, os estados e os feedbacks aplicáveis. Sua seção **“Aplicação por CRUD”** identifica, com linhas curtas, em quais operações a funcionalidade já foi analisada, qual unidade/contexto utiliza, quem pode ser selecionado e o que acontece após a escolha.

**A RF do CRUD** identifica a ação que abre a funcionalidade global e conserva apenas regras que dependem daquele CRUD (por exemplo, a unidade consultada, a elegibilidade, a obrigatoriedade de Ato Governamental e a ação que salva o formulário). Evite copiar a documentação inteira do modal.

**Diferenças não confirmadas** não viram regras. São apontadas no relatório de revisão para decisão funcional. Não incluir tabelas de governança, identificadores de divergência ou instruções para IA dentro da RF global.

## Ao finalizar cada nova RF de Hierarquia

1. ~~Verifique se a RF utiliza alguma funcionalidade global documentada, especialmente Buscar Servidor ou Histórico de Atos Governamentais.~~ **Verifique se a RF utiliza a RF005 — Buscar Servidor e/ou a RF006 — Visualizar Histórico de Atos Governamentais, além das demais funcionalidades globais documentadas.**
2. Compare a operação recém-documentada com a RF global: abertura, contexto da unidade, filtros, colunas, elegibilidade, ordenação, paginação, retorno, persistência e mensagens.
3. Se o uso estiver confirmado, **adicione uma linha objetiva na seção “Aplicação por CRUD”**. Registre alguma particularidade funcional na linha e no ponto correspondente da RF local, sem reescrever o comportamento de outros CRUDs.
4. Se as regras forem idênticas, apenas registre o novo CRUD e a operação na tabela, com referência à RF global na RF local.
5. Se a comparação revelar incompatibilidade entre fontes ou com o protótipo, apresente o caso no **relatório de entrega**, indicando os textos conflitantes. Não altere automaticamente os valores nem faça correções no protótipo.
6. Não altere regras aprovadas de outros CRUDs, testes, código, mocks ou a biblioteca SIAGE-UI como parte da documentação.

## Ponto de validação atual (fora da RF funcional)

**Paginação do Buscar Servidor em Secretaria Geral:** o PDF original da RF005 especifica **5 registros por página**, enquanto as RF002 e RF004 anteriormente documentadas mencionam **10**. A RF005 reescrita preserva a regra de sua fonte. É necessária uma definição funcional antes de harmonizar os demais documentos. Não aplicar nenhum dos dois valores automaticamente a outros CRUDs.

## Texto-padrão para os próximos prompts

> Ao finalizar esta RF de Hierarquia, consulte `documentação/globais/README_Manutencao_RFs_Globais.md` e compare as funcionalidades globais usadas. Atualize apenas a tabela “Aplicação por CRUD” das RFs globais relevantes, registrando o contexto e as particularidades confirmadas. Na RF local, mantenha a referência à global e as regras exclusivas. Informe conflitos separadamente, sem modificar regras por suposição. Não altere protótipo, testes ou biblioteca SIAGE-UI.

## Entrega da revisão

Informar quais arquivos `.md` foram criados ou atualizados, os componentes SIAGE-UI identificados, quais CRUDs/operações entraram nas RFs globais e eventuais pontos pendentes de validação. Confirmar que o código do protótipo não foi modificado.
