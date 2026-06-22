import assert from 'node:assert/strict';
import test from 'node:test';
import { applySpend, decideAgentSpend, remainingBudget } from '../src/allowanceEngine.js';
import type { AgentRequest, AllowanceTerms } from '../src/types.js';

const USDC = 1_000_000n;
const baseTerms: AllowanceTerms = {
  id: 'weekly-agent-budget',
  model: 'recurring',
  delegator: 'alice',
  delegatee: 'agent',
  mint: 'usdc',
  decimals: 6,
  cap: 10n * USDC,
  spent: 4n * USDC,
  periodStartedAt: 1_000,
  periodSeconds: 100,
};

function req(overrides: Partial<AgentRequest>): AgentRequest {
  return { id: 'r', purpose: 'test', amount: 1n * USDC, requestedAt: 1_050, riskScore: 10, ...overrides };
}

test('approves spend inside current recurring allowance', () => {
  const decision = decideAgentSpend(baseTerms, req({ amount: 5n * USDC }));
  assert.equal(decision.approved, true);
  assert.equal(decision.remainingBefore, 6n * USDC);
  assert.equal(decision.remainingAfter, 1n * USDC);
});

test('rejects spend above remaining cap', () => {
  const decision = decideAgentSpend(baseTerms, req({ amount: 7n * USDC }));
  assert.equal(decision.approved, false);
  assert.match(decision.reason, /exceeds/);
});

test('rejects high-risk requests even when budget remains', () => {
  const decision = decideAgentSpend(baseTerms, req({ riskScore: 99 }));
  assert.equal(decision.approved, false);
  assert.match(decision.reason, /risk/);
});

test('resets recurring spend after the period boundary', () => {
  const decision = decideAgentSpend(baseTerms, req({ requestedAt: 1_250, amount: 10n * USDC }));
  assert.equal(decision.approved, true);
  assert.equal(decision.resetApplied, true);
  assert.equal(decision.remainingBefore, 10n * USDC);
});

test('applySpend updates spent after approval', () => {
  const updated = applySpend(baseTerms, req({ amount: 2n * USDC }));
  assert.equal(updated.spent, 6n * USDC);
  assert.equal(remainingBudget(updated, 1_050), 4n * USDC);
});
