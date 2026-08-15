# Theme Separation Checklist

Date: August 15, 2026

Goal:
Verify that theme switching changes only chrome and does not collapse data identity colors or distinctions.

Steps:
1. Open `Configurações > Personalização Visual`.
2. Switch to `Modo Escuro`.
3. Confirm that backgrounds, cards, text, borders, buttons, and focus accents update.
4. Open `Dashboard` and confirm:
   - `Ciclo de Hoje` shows each disciplina with a distinct identifier.
   - `Atividade Semanal` keeps each series distinguishable.
   - The top 3 legend items remain visually distinct.
5. Open `Plano do Dia`, `Kanban`, `Ciclo de Estudos`, `Histórico de Sessões`, and `Caderno de Erros`.
6. Confirm that subject identifiers still differ from one another.

Repeat the same checks for:
1. `Modo Claro`
2. `Preto e Branco`

Expected results:
- Chrome changes with the selected theme.
- Subject identity never reuses the chrome accent token.
- In `Preto e Branco`, disciplines remain distinguishable by shape/pattern instead of silently turning into identical generic marks.
- The weekly activity chart remains readable and series stay differentiable.
