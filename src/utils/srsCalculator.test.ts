import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calcularSRS } from './srsCalculator';
import { StudyError } from '../types';

describe('Algoritmo SRS (SM-2)', () => {
  beforeEach(() => {
    // Mock the date so "new Date()" is consistent
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1)); // Jan 1st 2025
  });

  it('CASO 1 — Primeira revisão (totalRevisoes === 0)', () => {
    const erro = { intervalo: 1, facilidade: 2.5, totalRevisoes: 0 } as StudyError;
    const resultado = calcularSRS(erro, 3);
    
    expect(resultado.intervalo).toBe(1);
    expect(resultado.facilidade).toBe(2.5); // sem mudança
  });

  it('CASO 2 — Segunda revisão (totalRevisoes === 1)', () => {
    const erro = { intervalo: 1, facilidade: 2.5, totalRevisoes: 1 } as StudyError;
    const resultado = calcularSRS(erro, 5); // Fácil
    
    expect(resultado.intervalo).toBe(6);
    // Como foi fácil, a facilidade aumenta
    expect(resultado.facilidade).toBe(2.6);
  });

  it('CASO 3 — Avaliação Difícil em item experiente', () => {
    const erro = { intervalo: 20, facilidade: 2.5, totalRevisoes: 5 } as StudyError;
    const resultado = calcularSRS(erro, 1); // Difícil
    
    expect(resultado.intervalo).toBe(1);
    expect(resultado.facilidade).toBe(2.3); // 2.5 - 0.2
  });

  it('CASO 4 — Avaliação Ok', () => {
    const erro = { intervalo: 10, facilidade: 2.5, totalRevisoes: 3 } as StudyError;
    const resultado = calcularSRS(erro, 3); // Ok
    
    expect(resultado.intervalo).toBe(15); // 10 * 1.5
    expect(resultado.facilidade).toBe(2.5); // 2.5
  });

  it('CASO 5 — Avaliação Fácil com facilidade máxima', () => {
    const erro = { intervalo: 10, facilidade: 3.0, totalRevisoes: 4 } as StudyError;
    const resultado = calcularSRS(erro, 5); // Fácil
    
    expect(resultado.intervalo).toBe(30); // 10 * 3.0
    expect(resultado.facilidade).toBe(3.0); // limited to 3.0
  });

  it('CASO 6 — Avaliação Difícil com facilidade mínima', () => {
    const erro = { intervalo: 5, facilidade: 1.3, totalRevisoes: 3 } as StudyError;
    const resultado = calcularSRS(erro, 1); // Difícil
    
    expect(resultado.intervalo).toBe(1);
    expect(resultado.facilidade).toBe(1.3); // limited to 1.3
  });
});
