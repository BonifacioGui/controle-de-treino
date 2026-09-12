import { describe, expect, it } from 'vitest';
import { QUEST_RULES } from './questRules';

describe('missões', () => {
  it('só conclui regras com métricas reais da sessão', () => {
    expect(QUEST_RULES.perfect_focus({ totalSets: 4, completedSets: 1 })).toBe(false);
    expect(QUEST_RULES.perfect_focus({ totalSets: 4, completedSets: 4 })).toBe(true);
    expect(QUEST_RULES.pr({ prsBroken: 0 })).toBe(false);
    expect(QUEST_RULES.pr({ prsBroken: 1 })).toBe(true);
  });
});
