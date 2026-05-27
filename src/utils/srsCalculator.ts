import { StudyError } from '../types';

export interface SRSCalculationResult {
  intervalo: number;
  facilidade: number;
  qualidade: number;
  proximaRevisao: Date;
}

/**
 * Calcula os novos valores de repetição espaçada usando o algoritmo SM-2 modificado
 */
export function calcularSRS(erro: StudyError, qualidade: 0 | 1 | 2 | 3 | 4 | 5): SRSCalculationResult {
  const intervaloAtual = erro.intervalo || 1;
  const facilidadeAtual = erro.facilidade || 2.5;
  const totalRevisoes = erro.totalRevisoes || 0;

  let novoIntervalo = intervaloAtual;
  let novaFacilidade = facilidadeAtual;

  if (qualidade < 3) {
    // Difícil (0-2)
    novoIntervalo = 1;
    novaFacilidade = Math.max(1.3, facilidadeAtual - 0.2);
  } else if (qualidade === 3) {
    // Ok (3)
    novoIntervalo = totalRevisoes === 0 ? 1 : totalRevisoes === 1 ? 6 : Math.round(intervaloAtual * 1.5);
    // Facilidade se mantém
  } else {
    // Fácil (4-5)
    novoIntervalo = totalRevisoes === 0 ? 1 : totalRevisoes === 1 ? 6 : Math.round(intervaloAtual * facilidadeAtual);
    novaFacilidade = Math.min(3.0, facilidadeAtual + 0.1);
  }

  const proximaRevisao = new Date();
  proximaRevisao.setDate(proximaRevisao.getDate() + Math.round(novoIntervalo));
  proximaRevisao.setHours(0, 0, 0, 0);

  return {
    intervalo: novoIntervalo,
    facilidade: novaFacilidade,
    qualidade,
    proximaRevisao
  };
}
