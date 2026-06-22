# Solana Agent Allowance Demo

A technical demo for the **Solana Native Subscriptions & Allowances** bounty. It shows a practical Canadian-friendly use case: a user grants an AI support agent a bounded USDC spending envelope, the agent can buy service credits inside that budget, and risky or over-budget actions are rejected before any pull instruction is planned.

The demo focuses on the architecture exposed by the official Solana subscriptions program:

- a single Subscription Authority PDA per `(user, mint)` can be the SPL Token delegate;
- separate Delegation PDAs enforce multiple simultaneous fixed, recurring, or subscription-plan spend rules;
- recurring delegations reset their cap by period;
- merchants or agents pull funds only through the subscriptions program, not by holding user keys.

Official sources used while building this sample:

- Solana announcement: <https://solana.com/news/subscriptions-and-allowances>
- Official program repo: <https://github.com/solana-program/subscriptions>
- Program ID from the official README: `De1egAFMkMWZSN5rYXRj9CAdheBamobVNubTsi9avR44`

## What this demonstrates

The included scenario models a Canadian SaaS/support workflow:

1. A customer authorizes a weekly **recurring delegation** of 25 USDC to an AI support agent.
2. The agent attempts several purchases.
3. The policy engine approves requests that fit the cap and risk policy.
4. It rejects prompt-injection-like high-risk spending and over-budget attempts.
5. Approved requests produce a transaction plan showing where an actual integration would call the official `@solana/subscriptions` client methods.

This is intentionally runnable without a validator so judges can verify the core logic immediately. The `src/transactionPlanner.ts` file marks the exact point where production code should replace demo PDA labels with official helpers such as `getSubscriptionAuthorityPDA`, `getDelegationPDA`, and `SubscriptionsClient.transferRecurring`.

## Run locally

```bash
npm install
npm run verify
```

`npm run verify` performs:

1. TypeScript compilation (`tsc`)
2. Unit tests (`node:test` via `tsx`)
3. The JSON demo transcript

## Example output

The demo prints a JSON transcript. Approved items include a planned `transferRecurring` instruction targeting the official subscriptions program ID. Rejected items include a clear reason such as `risk score exceeds policy threshold` or `amount exceeds remaining allowance`.

## Why this is useful

Native allowances let users safely delegate spending to software agents without handing over private keys or unlimited token approval. That opens practical products such as:

- customer support agents that buy credits or refunds inside a capped allowance;
- Canadian creator tools that pay recurring SaaS fees in USDC;
- API or RPC consumption budgets for AI workflows;
- payroll/contractor payouts where the payer controls the terms onchain.

Compared with ad-hoc token approvals, the subscriptions program gives teams a shared audited primitive with multiple simultaneous delegations, recurring resets, subscription plans, and indexable events.

## Files

- `src/allowanceEngine.ts` — recurring/fixed allowance policy and budget math.
- `src/transactionPlanner.ts` — maps an approved request to the official subscriptions-program instruction shape.
- `src/demo.ts` — end-to-end transcript for bounded AI-agent spending.
- `test/allowanceEngine.test.ts` — verification for cap checks, risk checks, period reset, and spend updates.

## Production integration notes

A production integration should import the official generated client from the Solana subscriptions repository and replace the demo planner with real calls:

```ts
// Pseudocode shape based on the official README; wire with the latest generated client API.
const client = new SubscriptionsClient(connection, payer);
await client.initSubscriptionAuthority({ user, mint });
await client.createRecurringDelegation({ user, mint, delegatee, amount, periodSeconds, expiresAt });
await client.transferRecurring({ delegation, amount, destinationTokenAccount });
```

The important product invariant remains the same as this demo: the user sets the cap and reset cadence; the agent can only operate inside that envelope.
