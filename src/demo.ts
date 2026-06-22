import { applySpend, decideAgentSpend, formatToken } from './allowanceEngine.js';
import { officialSdkHint, planNativeAllowanceTransfer } from './transactionPlanner.js';
import type { AgentRequest, AllowanceTerms } from './types.js';

const USDC = 1_000_000n;
const now = 1_782_500_000;

let terms: AllowanceTerms = {
  id: 'canadian-ai-support-agent-weekly-budget',
  model: 'recurring',
  delegator: 'customer-wallet-canada-demo',
  delegatee: 'support-agent-service-wallet',
  mint: 'USDC-token-mint-demo',
  decimals: 6,
  cap: 25n * USDC,
  spent: 7n * USDC,
  periodStartedAt: now - 3 * 24 * 60 * 60,
  periodSeconds: 7 * 24 * 60 * 60,
};

const requests: AgentRequest[] = [
  { id: 'req-001', purpose: 'buy 3 CAD-denominated support credits', amount: 9n * USDC, requestedAt: now, riskScore: 18, merchant: 'support-credit-merchant' },
  { id: 'req-002', purpose: 'unexpected NFT purchase attempted by prompt injection', amount: 3n * USDC, requestedAt: now + 60, riskScore: 95, merchant: 'unknown-nft-market' },
  { id: 'req-003', purpose: 'oversized API package', amount: 20n * USDC, requestedAt: now + 120, riskScore: 21, merchant: 'api-merchant' },
  { id: 'req-004', purpose: 'new weekly billing window support refill', amount: 12n * USDC, requestedAt: now + 8 * 24 * 60 * 60, riskScore: 12, merchant: 'support-credit-merchant' },
];

const transcript = [];
for (const request of requests) {
  const decision = decideAgentSpend(terms, request);
  transcript.push({
    request: request.id,
    purpose: request.purpose,
    approved: decision.approved,
    reason: decision.reason,
    resetApplied: decision.resetApplied,
    remainingBefore: `${formatToken(decision.remainingBefore, terms.decimals)} USDC`,
    remainingAfter: `${formatToken(decision.remainingAfter, terms.decimals)} USDC`,
    plannedInstructions: decision.approved ? planNativeAllowanceTransfer(terms, request) : [],
  });
  if (decision.approved) terms = applySpend(terms, request);
}

console.log(JSON.stringify({
  demo: 'Solana native subscriptions & allowances for bounded AI-agent spending',
  model: terms.model,
  finalSpent: `${formatToken(terms.spent, terms.decimals)} USDC`,
  sdkIntegration: officialSdkHint(),
  transcript,
}, null, 2));
