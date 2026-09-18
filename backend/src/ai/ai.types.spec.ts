import { aiInsightSchema } from './ai.types';

describe('AI output validation', () => {
  it('accepts a complete insight payload', () => {
    const parsed = aiInsightSchema.parse({
      summary: 's',
      marketExplanation: 'm',
      financialExplanation: 'f',
      opportunities: ['o'],
      risks: ['r'],
      validationQuestions: ['q'],
      recommendations: ['rec'],
      citations: ['c'],
    });
    expect(parsed.summary).toBe('s');
  });

  it('rejects incomplete AI output', () => {
    expect(() =>
      aiInsightSchema.parse({
        summary: 's',
        opportunities: [],
      }),
    ).toThrow();
  });
});
