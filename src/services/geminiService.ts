import { GoogleGenAI } from "@google/genai";

// Lazy init: evita crash no carregamento se GEMINI_API_KEY não estiver definida
function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada.");
  return new GoogleGenAI({ apiKey });
}


export interface MentorAdvice {
  title: string;
  content: string;
  actionPoints: string[];
}

export async function getMentorAdvice(userData: any, subjects: any[], sessions: any[] = []): Promise<MentorAdvice> {
  const prompt = `
    Como um orientador inteligente de estudos para concursos (área administrativa e controle), analise os dados abaixo do aluno e forneça uma orientação estratégica, direta e pragmática.
    
    REGRAS DE COMPORTAMENTO:
    1. Sempre explique o MOTIVO das suas recomendações.
    2. Adapte tudo para um nível INICIANTE (linguagem clara, sem pressupor conhecimentos avançados).
    3. Priorize a construção de uma BASE SÓLIDA antes de sugerir avanços.
    4. Evite sobrecarga de conteúdo; foque em QUALIDADE + CONSISTÊNCIA.
    5. Sugira melhorias contínuas e ajustes finos.
    
    IDENTIFICAÇÃO AUTOMÁTICA (Analise os dados para encontrar):
    - Falta de consistência (dias sem estudo ou oscilações).
    - Excesso de teoria sem prática (muitas horas, poucas questões ou baixa acurácia).
    - Falta de revisão (matérias com muito tempo desde o último estudo).
    - Má distribuição de matérias (foco excessivo em poucas disciplinas).
    
    TÉCNICAS OBRIGATÓRIAS:
    1. Ciclo de Estudos: Alternar matérias, evitar cronogramas fixos, priorizar bullets/esquemas.
    2. Prática Espaçada: Revisões em 2, 5 e 14 dias.
    3. Revisão Inteligente: Foco total no erro e caderno de erros.
    4. Anotações: Curtas, objetivas e feitas apenas após o entendimento.
    
    DADOS DO ALUNO:
    - Área: ${userData.area}
    - Meta Semanal: ${userData.weeklyGoalHours}h
    - Matérias: ${subjects.map(s => `${s.name} (Acurácia: ${s.accuracy}%, Horas: ${s.totalHours}h, Nível: ${s.studentLevel}, Questões: ${s.questionsSolved})`).join(', ')}
    - Histórico Recente (Sessões): ${sessions.map(s => `${s.subjectId}: ${s.durationMinutes}min em ${s.timestamp?.toDate ? s.timestamp.toDate().toLocaleDateString() : 'data desconhecida'}`).join('; ')}
    
    Sua resposta deve ser em formato JSON com a seguinte estrutura:
    {
      "title": "Título curto e impactante da orientação",
      "content": "Texto principal com a análise estratégica e justificativas",
      "actionPoints": ["Ponto de ação 1", "Ponto de ação 2", "Ponto de ação 3"]
    }
    
    Lembre-se: Seja direto, objetivo e foque em evolução real.
  `;

  try {
    const response = await getAI().models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "Você é um mentor experiente em concursos de Tribunais de Contas. Seu tom é direto, estratégico e focado em resultados reais através de disciplina e base sólida. Evite clichês motivacionais."
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error getting mentor advice:", error);
    return {
      title: "Erro na Consultoria",
      content: "Não foi possível conectar com o mentor no momento. Continue seguindo seu cronograma com disciplina.",
      actionPoints: ["Mantenha a constância", "Revise a base teórica", "Resolva questões diariamente"]
    };
  }
}
