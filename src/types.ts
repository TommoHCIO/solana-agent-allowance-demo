export type DelegationModel = 'fixed' | 'recurring' | 'subscription-plan';

export interface AllowanceTerms {
  /** Human-friendly identifier for a Solana Subscription Authority PDA owner + mint pair. */
  id: string;
  model: DelegationModel;
  delegator: string;
  delegatee: string;
  mint: string;
  decimals: number;
  /** Base-unit cap. For USDC, 1 USDC = 1_000_000. */
  cap: bigint;
  /** Base units already pulled in the current window / fixed lifetime. */
  spent: bigint;
  /** Optional unix timestamp in seconds. */
  expiresAt?: number;
  /** For recurring models, the unix timestamp when the current window started. */
  periodStartedAt?: number;
  /** For recurring models, reset length in seconds. */
  periodSeconds?: number;
  /** Optional merchant plan id for subscription-plan demonstrations. */
  planId?: string;
}

export interface AgentRequest {
  id: string;
  purpose: string;
  amount: bigint;
  requestedAt: number;
  riskScore: number;
  merchant?: string;
}

export interface Decision {
  approved: boolean;
  reason: string;
  remainingBefore: bigint;
  remainingAfter: bigint;
  resetApplied: boolean;
}

export interface PlannedInstruction {
  label: string;
  programId: string;
  accounts: Record<string, string>;
  args: Record<string, string | number | boolean>;
}
