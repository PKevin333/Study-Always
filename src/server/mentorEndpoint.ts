import type { Request, Response } from 'express';

export type MentorAdvice = {
  title: string;
  content: string;
  actionPoints: string[];
};

type VerifyIdToken = (idToken: string) => Promise<{ uid: string }>;
type GenerateMentorAdvice = (userData: any, subjects: any[], sessions: any[]) => Promise<MentorAdvice>;

const FALLBACK_ADVICE: MentorAdvice = {
  title: 'Erro na Consultoria',
  content: 'Não foi possível conectar com o mentor no momento. Continue seguindo seu cronograma com disciplina.',
  actionPoints: ['Mantenha a constância', 'Revise a base teórica', 'Resolva questões diariamente']
};

export function extractBearerToken(authorizationHeader?: string) {
  if (!authorizationHeader) return null;

  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token.trim() || null;
}

export function createMentorAdviceHandler(
  verifyIdToken: VerifyIdToken,
  generateMentorAdvice: GenerateMentorAdvice
) {
  return async function mentorAdviceHandler(req: Request, res: Response) {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'Token de autenticação ausente.' });
    }

    try {
      await verifyIdToken(token);
    } catch (error) {
      console.error('Invalid Firebase ID token on /api/mentor-advice:', error);
      return res.status(401).json({ error: 'Token de autenticação inválido ou expirado.' });
    }

    const { userData, subjects, sessions } = req.body ?? {};
    if (!userData || !Array.isArray(subjects) || !Array.isArray(sessions)) {
      return res.status(400).json({ error: 'Payload inválido.' });
    }

    try {
      const advice = await generateMentorAdvice(userData, subjects, sessions);
      return res.json(advice);
    } catch (error) {
      console.error('Error generating mentor advice:', error);
      return res.status(500).json(FALLBACK_ADVICE);
    }
  };
}

export { FALLBACK_ADVICE };
