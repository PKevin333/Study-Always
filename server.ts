import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createMentorAdviceHandler } from './src/server/mentorEndpoint';
import { verifyFirebaseIdToken } from './src/server/firebaseAdmin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type MentorAdvice = {
  title: string;
  content: string;
  actionPoints: string[];
};

function buildMentorPrompt(userData: any, subjects: any[], sessions: any[] = []) {
  return `
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
    - Área: ${userData?.area || 'não informada'}
    - Meta Semanal: ${userData?.weeklyGoalHours || 0}h
    - Matérias: ${subjects.map(s => `${s.name} (Acurácia: ${s.accuracy}%, Horas: ${s.totalHours}h, Nível: ${s.studentLevel}, Questões: ${s.questionsSolved})`).join(', ')}
    - Histórico Recente (Sessões): ${sessions.map(s => `${s.subjectName || s.subjectId || 'disciplina'}: ${s.durationMinutes}min em ${s.timestamp || 'data desconhecida'}`).join('; ')}
    
    Sua resposta deve ser em formato JSON com a seguinte estrutura:
    {
      "title": "Título curto e impactante da orientação",
      "content": "Texto principal com a análise estratégica e justificativas",
      "actionPoints": ["Ponto de ação 1", "Ponto de ação 2", "Ponto de ação 3"]
    }
    
    Lembre-se: Seja direto, objetivo e foque em evolução real.
  `;
}

async function getServerMentorAdvice(userData: any, subjects: any[], sessions: any[] = []): Promise<MentorAdvice> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada no servidor.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: buildMentorPrompt(userData, subjects, sessions),
    config: {
      responseMimeType: 'application/json',
      systemInstruction: 'Você é um mentor experiente em concursos de Tribunais de Contas. Seu tom é direto, estratégico e focado em resultados reais através de disciplina e base sólida. Evite clichês motivacionais.'
    }
  });

  return JSON.parse(response.text || '{}');
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(express.json({ limit: '256kb' }));
  app.post('/api/mentor-advice', createMentorAdviceHandler(verifyFirebaseIdToken, getServerMentorAdvice));

  // Use Vite's connect instance as middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve absolute paths from dist
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
