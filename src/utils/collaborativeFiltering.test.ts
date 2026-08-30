import { describe, expect, it } from 'vitest';
import { TASTE_ARCHETYPES } from '../data/archetypesData';
import { determineUserArchetype } from './collaborativeFiltering';

describe('determineUserArchetype', () => {
  it('selects every archetype for its own DNA vector', () => {
    for (const archetype of Object.values(TASTE_ARCHETYPES)) {
      expect(determineUserArchetype(archetype.dnaScores).id).toBe(archetype.id);
    }
  });

  it('reacts to account-like axis changes away from the neutral baseline', () => {
    expect(determineUserArchetype({
      emotional: 50,
      stimulation: 90,
      depth: 60,
      plotDensity: 90,
      indieGem: 55,
      worldbuilding: 75,
    }).id).toBe('dopamine-suspense');

    expect(determineUserArchetype({
      emotional: 55,
      stimulation: 65,
      depth: 90,
      plotDensity: 75,
      indieGem: 80,
      worldbuilding: 95,
    }).id).toBe('cyber-sf-mystic');
  });

  it('keeps the explicit default for a completely neutral vector', () => {
    expect(determineUserArchetype({
      emotional: 50,
      stimulation: 50,
      depth: 50,
      plotDensity: 50,
      indieGem: 50,
      worldbuilding: 50,
    }).id).toBe('midnight-romantic');
  });
});
