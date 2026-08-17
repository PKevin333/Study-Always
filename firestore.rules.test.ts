import fs from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

const rules = fs.readFileSync('firestore.rules', 'utf8');

const subjectFixture = {
  userId: 'alice',
  name: 'Matemática',
  group: 1,
  status: 'active',
  weight: 3,
  order: 0,
  studentLevel: 'Iniciante',
  performancePercent: 0,
  studyFrequency: 0,
  dynamicPriority: 3,
  totalHours: 0,
  questionsSolved: 0,
  accuracy: 0,
  lastStudied: null,
  color: 'blue',
  completedTopics: 0,
  totalTopics: 0,
  progressPercent: 0
};

const userFixture = {
  uid: 'alice',
  email: 'alice@example.com',
  displayName: 'Alice',
  studentLevel: 'Iniciante',
  area: 'administrativa',
  targetExam: 'Área Administrativa',
  concursoAlvo: 'Área Administrativa',
  onboardingCompleted: true,
  theme: 'dark',
  accentColor: 'emerald',
  dailyTimeMinutes: 120,
  dailyTimeMaxMinutes: 480,
  blocksPerDay: 2,
  blockDurationMinutes: 60,
  cycleFocus: 'equilibrado',
  cycleAutonomy: 'sugerido',
  currentCycleIndex: 0,
  createdAt: Timestamp.now()
};

const materiaFixture = {
  nome: 'Português',
  origem: 'base',
  ativa: true,
  criadaEm: Timestamp.now(),
  cor: 'blue'
};

const topicFixture = {
  name: 'Crase',
  status: 'nao_iniciado',
  order: 0,
  createdAt: Timestamp.now(),
  completedAt: null,
  notes: ''
};

async function seedAliceSubject(subjectId = 'math') {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users/alice/subjects', subjectId), subjectFixture);
  });
}

async function seedAliceUser() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users/alice'), userFixture);
  });
}

async function seedAliceMateria(materiaId = 'portugues') {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users/alice/materias', materiaId), materiaFixture);
  });
}

async function seedAliceTopic(subjectId = 'math', topicId = 'crase') {
  await seedAliceSubject(subjectId);
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), `users/alice/subjects/${subjectId}/topics`, topicId), topicFixture);
  });
}

describe('firestore.rules hardening', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'study-always-rules-test',
      firestore: { rules }
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('blocks user A from reading user B subject', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/bob/subjects', 'portugues'), {
        ...subjectFixture,
        userId: 'bob',
        name: 'Português'
      });
    });

    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    await assertFails(getDoc(doc(aliceDb, 'users/bob/subjects', 'portugues')));
  });

  it('blocks user A from writing inside user B path', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();

    await assertFails(setDoc(doc(aliceDb, 'users/bob/sessions', 'forced-write'), {
      userId: 'alice',
      subjectId: 'math',
      durationMinutes: 30,
      timestamp: Timestamp.now(),
      type: 'teoria'
    }));
  });

  it('allows valid subject update and rejects arbitrary extra fields', async () => {
    await seedAliceSubject();
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const subjectRef = doc(aliceDb, 'users/alice/subjects', 'math');

    await assertSucceeds(updateDoc(subjectRef, {
      totalHours: 2,
      completedTopics: 1,
      totalTopics: 4,
      progressPercent: 25
    }));

    await assertFails(updateDoc(subjectRef, {
      admin: true as any
    }));
  });

  it('allows valid user update and rejects arbitrary extra fields', async () => {
    await seedAliceUser();
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const userRef = doc(aliceDb, 'users/alice');

    await assertSucceeds(updateDoc(userRef, {
      displayName: 'Alice 2',
      targetExam: 'TRT',
      concursoAlvo: 'TRT',
      theme: 'bw',
      accentColor: 'violet'
    }));

    await assertFails(updateDoc(userRef, {
      admin: true as any
    }));
  });

  it('rejects invalid dailyBlock shape and accepts valid payload', async () => {
    await seedAliceSubject();
    const aliceDb = testEnv.authenticatedContext('alice').firestore();

    await assertFails(setDoc(doc(aliceDb, 'users/alice/dailyBlocks', 'invalid-block'), {
      subjectId: 'math',
      subjectName: 'Matemática',
      type: 'teoria',
      durationMinutes: 60,
      order: 0
    }));

    await assertSucceeds(setDoc(doc(aliceDb, 'users/alice/dailyBlocks', 'valid-block'), {
      subjectId: 'math',
      subjectName: 'Matemática',
      type: 'teoria',
      durationMinutes: 60,
      order: 0,
      status: 'pendente',
      date: '2026-08-17',
      actualMinutes: 0
    }));

    await assertFails(updateDoc(doc(aliceDb, 'users/alice/dailyBlocks', 'valid-block'), {
      debug: true as any
    }));
  });

  it('rejects session creation when subjectId does not exist for the owner', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();

    await assertFails(addDoc(collection(aliceDb, 'users/alice/sessions'), {
      userId: 'alice',
      subjectId: 'ghost-subject',
      durationMinutes: 25,
      timestamp: Timestamp.now(),
      type: 'teoria'
    }));
  });

  it('rejects extra fields in sessions', async () => {
    await seedAliceSubject();
    const aliceDb = testEnv.authenticatedContext('alice').firestore();

    await assertFails(addDoc(collection(aliceDb, 'users/alice/sessions'), {
      userId: 'alice',
      subjectId: 'math',
      subjectName: 'Matemática',
      durationMinutes: 25,
      timestamp: Timestamp.now(),
      type: 'teoria',
      debug: true
    }));
  });

  it('rejects errors, cycleBlocks and questionRecords when subjectId is not linked to the owner', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();

    await assertFails(addDoc(collection(aliceDb, 'users/alice/errors'), {
      subjectId: 'ghost-subject',
      content: 'Erro de regra',
      createdAt: Timestamp.now()
    }));

    await assertFails(addDoc(collection(aliceDb, 'users/alice/cycleBlocks'), {
      subjectId: 'ghost-subject',
      subjectName: 'Fantasma',
      type: 'teoria',
      durationMinutes: 60,
      order: 0
    }));

    await assertFails(addDoc(collection(aliceDb, 'users/alice/questionRecords'), {
      subjectId: 'ghost-subject',
      subjectName: 'Fantasma',
      topic: 'Tema',
      total: 10,
      correct: 8,
      errors: 2,
      percentage: 80,
      date: '2026-08-16'
    }));
  });

  it('rejects extra fields in errors, cycleBlocks, questionRecords and calendarTasks', async () => {
    await seedAliceSubject();
    const aliceDb = testEnv.authenticatedContext('alice').firestore();

    await assertFails(addDoc(collection(aliceDb, 'users/alice/errors'), {
      subjectId: 'math',
      subjectName: 'Matemática',
      content: 'Erro válido',
      date: '2026-08-17T10:00:00.000Z',
      createdAt: Timestamp.now(),
      reviewed: false,
      debug: true
    }));

    await assertFails(addDoc(collection(aliceDb, 'users/alice/cycleBlocks'), {
      subjectId: 'math',
      subjectName: 'Matemática',
      type: 'teoria',
      durationMinutes: 60,
      order: 0,
      difficulty: 'facil',
      dayOfWeek: 1,
      debug: true
    }));

    await assertFails(addDoc(collection(aliceDb, 'users/alice/questionRecords'), {
      subjectId: 'math',
      subjectName: 'Matemática',
      topic: 'Crase',
      total: 10,
      correct: 8,
      errors: 2,
      percentage: 80,
      date: '2026-08-17',
      debug: true
    }));

    await assertFails(addDoc(collection(aliceDb, 'users/alice/calendarTasks'), {
      userId: 'alice',
      title: 'Revisar português',
      date: '2026-08-17',
      time: '08:00',
      category: 'revisao',
      notes: 'Anotar dúvidas',
      completed: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      debug: true
    }));
  });

  it('rejects extra fields in topics and materias while allowing valid updates', async () => {
    await seedAliceTopic();
    await seedAliceMateria();
    const aliceDb = testEnv.authenticatedContext('alice').firestore();

    await assertSucceeds(updateDoc(doc(aliceDb, 'users/alice/subjects/math/topics', 'crase'), {
      name: 'Crase e acento grave',
      status: 'em_estudo',
      order: 1,
      notes: 'Revisar exemplos'
    }));

    await assertFails(updateDoc(doc(aliceDb, 'users/alice/subjects/math/topics', 'crase'), {
      debug: true as any
    }));

    await assertSucceeds(updateDoc(doc(aliceDb, 'users/alice/materias', 'portugues'), {
      nome: 'Português Atualizado',
      origem: 'base',
      ativa: false,
      criadaEm: materiaFixture.criadaEm,
      cor: 'red'
    }));

    await assertFails(updateDoc(doc(aliceDb, 'users/alice/materias', 'portugues'), {
      debug: true as any
    }));
  });
});
