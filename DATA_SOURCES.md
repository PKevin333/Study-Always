# Fontes de Verdade dos Dados (Data Sources)

Este documento descreve as fontes de verdade de cada dado no sistema para garantir a integridade durante manutenções futuras.

## Fontes Primárias (Verdade Absoluta)

- **sessions**: Fonte de verdade única para o **Tempo Estudado**. NUNCA calcular tempo estudado acumulado a partir de `dailyBlocks` ou `cycleBlocks`.
- **questionRecords**: Fonte de verdade única para o **Desempenho e Acertos**. Contém o histórico bruto de questões resolvidas.

## Caches Derivados

Os campos abaixo são otimizações (denormalizações) para facilitar a leitura no dashboard, mas devem ser recalculados com base nas fontes primárias se houver inconsistência.

- **subjects.totalHours**: Cache derivado da soma das `sessions`.
- **subjects.accuracy**: Cache derivado da média ponderada de `questionRecords`.

## Snapshots Históricos

Alguns campos são salvos como "Snapshots" (cópias congeladas no tempo) e NÃO devem ser sincronizados retroativamente se o dado original mudar.

- **subjectName** em `sessions`, `dailyBlocks`, `cycleBlocks`, `errors`: Armazenado para garantir que o histórico faça sentido mesmo se a disciplina for renomeada ou excluída no futuro. O `subjectId` continua sendo a referência técnica.

## Gestão de Erros

- **errors**: Coleção para o "Caderno de Erros".
  - `reviewed`: Indica se o ponto de dificuldade já foi revisado pelo aluno.
  - `nextReview`: Agendamento da próxima revisão baseada em repetição espaçada.
  - *Nota*: Se a lógica de revisões se tornar complexa, considerar migrar para uma coleção dedicada `reviews`.
