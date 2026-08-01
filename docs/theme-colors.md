# Regras de cores do tema

Use `brand-primary` para qualquer destaque geral da marca ou ação principal. Essa cor acompanha `data-accent` e muda quando o usuário troca o accent.

Exemplos que devem usar `brand-primary`:
- botões primários;
- ícones ativos da sidebar;
- cards de totais e métricas em destaque;
- indicadores de progresso não semânticos;
- links de ação, chips e contadores de destaque geral.

Use cores semânticas fixas apenas quando o significado não deve mudar com o accent do usuário:
- `brand-green`: sucesso, concluído, acerto;
- `brand-red`: erro, exclusão, dificuldade crítica;
- `brand-yellow`: atenção;
- `brand-blue`, `brand-orange`, `brand-magenta`: categorias visuais específicas, quando a cor diferencia tipos de conteúdo.

Cores próprias de disciplinas também podem ser fixas, pois representam uma escolha explícita do usuário para identificar cada matéria.

Evite classes Tailwind fixas como `text-green-500`, `bg-purple-600` ou hex inline para ações e destaques gerais. Prefira `text-brand-primary`, `bg-brand-primary`, `border-brand-primary` e suas variações com opacidade.
