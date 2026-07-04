import { describe, it, expect } from 'vitest';
import { nombreCasilla, colorCasilla, formatoTiempo, nivelIAInfo, obtenerPuzzleEntrenamiento, obtenerPuzzlesEntrenamiento } from '../src/utils';

describe('utils', () => {
  it('nombreCasilla convierte índices correctamente', () => {
    expect(nombreCasilla(0, 0)).toBe('a8');
    expect(nombreCasilla(7, 7)).toBe('h1');
  });

  it('colorCasilla alterna colores', () => {
    expect(colorCasilla(0, 0)).toBe('clara');
    expect(colorCasilla(0, 1)).toBe('oscura');
  });

  it('formatoTiempo formatea segundos correctamente', () => {
    expect(formatoTiempo(0)).toBe('00:00');
    expect(formatoTiempo(65)).toBe('01:05');
    expect(formatoTiempo(600)).toBe('10:00');
  });

  it('nivelIAInfo devuelve la configuración de los tres niveles de IA', () => {
    expect(nivelIAInfo(1)).toEqual({ label: 'Fácil', profundidad: 2, descripcion: 'Ideal para empezar o practicar' });
    expect(nivelIAInfo(2)).toEqual({ label: 'Normal', profundidad: 3, descripcion: 'Equilibrio entre rapidez y desafío' });
    expect(nivelIAInfo(3)).toEqual({ label: 'Difícil', profundidad: 4, descripcion: 'Reto más serio para partidas largas' });
  });

  it('obtenerPuzzleEntrenamiento devuelve un reto de mate en una jugada', () => {
    const puzzle = obtenerPuzzleEntrenamiento();
    expect(puzzle.titulo).toBe('Mate en 1');
    expect(puzzle.movimientoObjetivo).toBe('g7h7');
  });

  it('obtenerPuzzlesEntrenamiento ofrece varios retos con pista', () => {
    const puzzles = obtenerPuzzlesEntrenamiento();
    expect(puzzles.length).toBeGreaterThan(1);
    expect(puzzles[0].pista).toContain('Jaque mate');
  });
});
