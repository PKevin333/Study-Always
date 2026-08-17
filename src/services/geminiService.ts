import { auth } from '../firebase';

export interface MentorAdvice {
  title: string;
  content: string;
  actionPoints: string[];
}

export async function getMentorAdvice(userData: any, subjects: any[], sessions: any[] = []): Promise<MentorAdvice> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Usuário não autenticado para consultar o mentor.');
  }

  const idToken = await currentUser.getIdToken();
  const response = await fetch('/api/mentor-advice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'study-always-web',
      Authorization: `Bearer ${idToken}`
    },
    body: JSON.stringify({
      userData,
      subjects,
      sessions
    })
  });

  if (!response.ok) {
    throw new Error(`Mentor advice request failed with status ${response.status}`);
  }

  return response.json();
}
