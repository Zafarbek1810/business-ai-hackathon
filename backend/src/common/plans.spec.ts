import { PLAN_BUSINESS_LIMITS, planLimitMessage } from './plans';

describe('plan limits', () => {
  it('caps FREE at one business and leaves BUSINESS unlimited', () => {
    expect(PLAN_BUSINESS_LIMITS.FREE).toBe(1);
    expect(PLAN_BUSINESS_LIMITS.PRO).toBe(5);
    expect(PLAN_BUSINESS_LIMITS.BUSINESS).toBeNull();
  });

  it('explains the upgrade path in Uzbek', () => {
    expect(planLimitMessage('FREE', 1)).toContain('Sozlamalardan');
    expect(planLimitMessage('FREE', 1)).toContain('FREE');
  });
});
