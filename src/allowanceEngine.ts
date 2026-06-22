import type { AgentRequest, AllowanceTerms, Decision } from './types.js';

export const SUBSCRIPTIONS_PROGRAM_ID = 'De1egAFMkMWZSN5rYXRj9CAdheBamobVNubTsi9avR44';

export function normalizeRecurringWindow(terms: AllowanceTerms, now: number): AllowanceTerms {
  if (terms.model !== 'recurring') return { ...terms };
  if (terms.periodStartedAt === undefined || terms.periodSeconds === undefined) {
    throw new Error('recurring terms require periodStartedAt and periodSeconds');
  }
  if (now < terms.periodStartedAt + terms.periodSeconds) return { ...terms };
  const periodsElapsed = Math.floor((now - terms.periodStartedAt) / terms.periodSeconds);
  return {
    ...terms,
    spent: 0n,
    periodStartedAt: terms.periodStartedAt + periodsElapsed * terms.periodSeconds,
  };
}

export function remainingBudget(terms: AllowanceTerms, now: number): bigint {
  const normalized = normalizeRecurringWindow(terms, now);
  if (normalized.expiresAt !== undefined && now > normalized.expiresAt) return 0n;
  return normalized.cap > normalized.spent ? normalized.cap - normalized.spent : 0n;
}

export function decideAgentSpend(terms: AllowanceTerms, request: AgentRequest): Decision {
  const normalized = normalizeRecurringWindow(terms, request.requestedAt);
  const resetApplied = normalized.spent !== terms.spent || normalized.periodStartedAt !== terms.periodStartedAt;
  const before = remainingBudget(normalized, request.requestedAt);
  if (normalized.expiresAt !== undefined && request.requestedAt > normalized.expiresAt) {
    return { approved: false, reason: 'delegation expired', remainingBefore: before, remainingAfter: before, resetApplied };
  }
  if (request.riskScore > 70) {
    return { approved: false, reason: 'risk score exceeds policy threshold', remainingBefore: before, remainingAfter: before, resetApplied };
  }
  if (request.amount > before) {
    return { approved: false, reason: 'amount exceeds remaining allowance', remainingBefore: before, remainingAfter: before, resetApplied };
  }
  return { approved: true, reason: 'within native allowance envelope', remainingBefore: before, remainingAfter: before - request.amount, resetApplied };
}

export function applySpend(terms: AllowanceTerms, request: AgentRequest): AllowanceTerms {
  const decision = decideAgentSpend(terms, request);
  if (!decision.approved) throw new Error(`request rejected: ${decision.reason}`);
  const normalized = normalizeRecurringWindow(terms, request.requestedAt);
  return { ...normalized, spent: normalized.spent + request.amount };
}

export function formatToken(amount: bigint, decimals: number): string {
  const scale = 10n ** BigInt(decimals);
  const whole = amount / scale;
  const frac = (amount % scale).toString().padStart(decimals, '0').replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : `${whole}`;
}
