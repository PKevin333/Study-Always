import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Materia } from '../types';

export function useMaterias(userId?: string) {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setMaterias([]);
      setLoading(false);
      return;
    }

    const loadMaterias = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'users', userId, 'materias'),
          where('ativa', '==', true),
          orderBy('criadaEm', 'asc')
        );
        const snapshot = await getDocs(q);
        const loadedMaterias: Materia[] = [];
        snapshot.forEach((doc) => {
          loadedMaterias.push({ id: doc.id, ...doc.data() } as Materia);
        });
        setMaterias(loadedMaterias);
      } catch (error) {
        console.error('Erro ao carregar matérias:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMaterias();
  }, [userId]);

  const adicionarMateria = async (nome: string, origem: 'base' | 'custom'): Promise<void> => {
    if (!userId) return;
    try {
      const data = {
        nome,
        origem,
        ativa: true,
        criadaEm: Timestamp.now()
      };
      const docRef = await addDoc(collection(db, 'users', userId, 'materias'), data);
      setMaterias(prev => [...prev, { id: docRef.id, ...data }]);
    } catch (error) {
      console.error('Erro ao adicionar matéria:', error);
      throw error;
    }
  };

  const renomearMateria = async (id: string, novoNome: string): Promise<void> => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'users', userId, 'materias', id), { nome: novoNome });
      setMaterias(prev => prev.map(m => m.id === id ? { ...m, nome: novoNome } : m));
    } catch (error) {
      console.error('Erro ao renomear matéria:', error);
      throw error;
    }
  };

  const toggleAtiva = async (id: string, ativa: boolean): Promise<void> => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'users', userId, 'materias', id), { ativa });
      if (!ativa) {
        setMaterias(prev => prev.filter(m => m.id !== id));
      }
    } catch (error) {
      console.error('Erro ao alternar status da matéria:', error);
      throw error;
    }
  };

  const excluirMateria = async (id: string): Promise<void> => {
    if (!userId) return;
    try {
      const materia = materias.find(m => m.id === id);
      if (materia?.origem === 'base') {
        throw new Error('Matérias da base não podem ser excluídas permanentemente.');
      }
      await deleteDoc(doc(db, 'users', userId, 'materias', id));
      setMaterias(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Erro ao excluir matéria:', error);
      throw error;
    }
  };

  const salvarEmLote = async (novasMaterias: Omit<Materia, 'id' | 'criadaEm'>[]): Promise<void> => {
    if (!userId) return;
    try {
      const batch = writeBatch(db);
      const materiasCollection = collection(db, 'users', userId, 'materias');
      
      const newItems: Materia[] = [];
      novasMaterias.forEach(m => {
        const docRef = doc(materiasCollection);
        const data = {
          ...m,
          criadaEm: Timestamp.now()
        };
        batch.set(docRef, data);
        newItems.push({ id: docRef.id, ...data });
      });

      await batch.commit();
      setMaterias(prev => [...prev, ...newItems]);
    } catch (error) {
      console.error('Erro ao salvar matérias em lote:', error);
      throw error;
    }
  };

  return {
    materias,
    loading,
    adicionarMateria,
    renomearMateria,
    toggleAtiva,
    excluirMateria,
    salvarEmLote
  };
}
