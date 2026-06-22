import { SUBSCRIPTIONS_PROGRAM_ID } from './allowanceEngine.js';
import type { AgentRequest, AllowanceTerms, PlannedInstruction } from './types.js';

function fakePda(seed: string): string {
  // Demo-only deterministic label so the sample is runnable without a validator.
  // Real integrations should call @solana/subscriptions PDA helpers:
  // getSubscriptionAuthorityPDA, getDelegationPDA, getPlanPDA, getSubscriptionPDA.
  return `pda:${Buffer.from(seed).toString('base64url').slice(0, 36)}`;
}

export function planNativeAllowanceTransfer(terms: AllowanceTerms, request: AgentRequest): PlannedInstruction[] {
  const subscriptionAuthority = fakePda(`sa:${terms.delegator}:${terms.mint}`);
  const delegation = fakePda(`${terms.model}:${terms.id}:${terms.delegatee}`);
  const tokenAccount = fakePda(`ata:${terms.delegator}:${terms.mint}`);
  const destination = fakePda(`ata:${request.merchant ?? terms.delegatee}:${terms.mint}`);

  const transferInstruction =
    terms.model === 'fixed'
      ? 'transferFixed'
      : terms.model === 'recurring'
        ? 'transferRecurring'
        : 'transferSubscription';

  return [
    {
      label: 'preflight-policy-check',
      programId: 'offchain-demo-policy',
      accounts: { delegator: terms.delegator, delegatee: terms.delegatee, mint: terms.mint },
      args: { requestId: request.id, riskScore: request.riskScore, purpose: request.purpose },
    },
    {
      label: transferInstruction,
      programId: SUBSCRIPTIONS_PROGRAM_ID,
      accounts: {
        subscriptionAuthority,
        delegation,
        sourceTokenAccount: tokenAccount,
        destinationTokenAccount: destination,
        delegatee: terms.delegatee,
      },
      args: {
        amountBaseUnits: request.amount.toString(),
        model: terms.model,
      },
    },
  ];
}

export function officialSdkHint(): string {
  return [
    "Real on-chain code should import `SubscriptionsClient` from `@solana/subscriptions` (official repo clients/typescript).",
    "Call `initSubscriptionAuthority` once for a user+mint, then `createFixedDelegation`, `createRecurringDelegation`, or `subscribe`.",
    "Pull funds with `transferFixed`, `transferRecurring`, or `transferSubscription`; the Subscription Authority PDA is the sole SPL delegate, while Delegation PDAs enforce caps and resets.",
  ].join(' ');
}
