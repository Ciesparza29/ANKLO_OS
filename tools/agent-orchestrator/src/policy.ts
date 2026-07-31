import { OrchestratorError } from "./errors.ts";

export const SAFE_CAPABILITIES = [
  "DIAGNOSE",
  "PLAN",
  "STATE_READ",
  "STATE_WRITE",
  "LEASE_WRITE",
  "APPROVAL_VALIDATE",
] as const;

export type SafeCapability = (typeof SAFE_CAPABILITIES)[number];

export const DENIED_CAPABILITIES = [
  "ARBITRARY_SHELL",
  "MERGE",
  "DEPLOY_PRODUCTION",
  "CREATE_PR",
  "PUSH_BRANCH",
  "OPEN_NETWORK_LISTENER",
] as const;

export type DeniedCapability = (typeof DENIED_CAPABILITIES)[number];
export type Capability = SafeCapability | DeniedCapability;

export function isSafeCapability(value: string): value is SafeCapability {
  return (SAFE_CAPABILITIES as readonly string[]).includes(value);
}

export function assertCapability(
  allowedCapabilities: readonly SafeCapability[],
  capability: Capability,
): void {
  if (
    !isSafeCapability(capability) ||
    !allowedCapabilities.includes(capability)
  ) {
    throw new OrchestratorError(
      "CAPABILITY_DENIED",
      `Capability ${capability} is denied by policy`,
      { details: { capability } },
    );
  }
}
