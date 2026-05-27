export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export interface Materia {
  id: string;
  nome: string;
  origem: 'base' | 'custom';
  cor?: string;
  ativa: boolean;
  criadaEm: any;
}

export interface Subject {
  id: string;
  name: string;
  group: number;
  status: 'active' | 'optional' | 'future';
  weight: number;
  order: number;
  studentLevel: string;
  performancePercent: number;
  studyFrequency: number;
  dynamicPriority: number;
  totalHours: number;
  questionsSolved: number;
  accuracy: number;
  lastStudied: any;
  completedTopics?: number;
  totalTopics?: number;
  progressPercent?: number;
}

export interface Session {
  id: string;
  subjectId: string;
  subjectName: string;
  durationMinutes: number;
  type: string;
  timestamp: any;
}

export interface StudyError {
  id: string;
  subjectId: string;
  subjectName: string;
  content: string;
  createdAt: any;
  reviewed: boolean;
  nextReview: any;
  proximaRevisao?: any; // New field for SRS
  intervalo?: number;   // New field for SRS
  facilidade?: number;  // New field for SRS
  totalRevisoes?: number; // New field for SRS
  historico?: { data: any, qualidade: number }[]; // Track over time
}

export interface CycleBlock {
  id: string;
  subjectId: string;
  subjectName: string;
  type: 'teoria' | 'questoes' | 'revisao';
  durationMinutes: number;
  order: number;
  difficulty: 'facil' | 'media' | 'dificil';
}

export interface DailyBlock {
  id: string;
  subjectId: string;
  subjectName: string;
  type: string;
  durationMinutes: number;
  order: number;
  status: 'pendente' | 'em_andamento' | 'concluido';
  date: string;
  actualMinutes?: number;
}

export interface QuestionRecord {
  id: string;
  subjectId: string;
  subjectName: string;
  topic: string;
  total: number;
  correct: number;
  errors: number;
  percentage: number;
  date: string;
}

export interface Topic {
  id: string;
  name: string;
  status: 'nao_iniciado' | 'em_estudo' | 'concluido' | 'revisar';
  order: number;
  createdAt: any;
  completedAt?: any;
}
