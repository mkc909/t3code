import type { ProviderInstanceEnvironment } from "@t3tools/contracts";
import * as HostProcess from "@t3tools/shared/HostProcess";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Redacted from "effect/Redacted";

import { expandHomePath } from "./pathExpansion.ts";

export const WindowsUserBwsToken = Context.Reference<Redacted.Redacted<string> | undefined>(
  "@t3tools/provider-core/WindowsUserBwsToken",
  { defaultValue: () => undefined },
);

export function windowsBwsTokenKey(env: NodeJS.ProcessEnv): string {
  return (
    Object.keys(env).find((key) => key.toUpperCase() === "BWS_ACCESS_TOKEN") ?? "BWS_ACCESS_TOKEN"
  );
}

export function withWindowsUserBwsToken(
  env: NodeJS.ProcessEnv,
  token: Redacted.Redacted<string> | undefined,
): NodeJS.ProcessEnv;
export function withWindowsUserBwsToken(
  env: NodeJS.ProcessEnv | undefined,
  token: Redacted.Redacted<string> | undefined,
): NodeJS.ProcessEnv | undefined;
export function withWindowsUserBwsToken(
  env: NodeJS.ProcessEnv | undefined,
  token: Redacted.Redacted<string> | undefined,
): NodeJS.ProcessEnv | undefined {
  if (token === undefined) return env;
  const key = windowsBwsTokenKey(env ?? {});
  return env?.[key]?.trim() ? env : { ...env, [key]: Redacted.value(token) };
}

export const mergeProviderInstanceEnvironment = Effect.fn(function* (
  environment: ProviderInstanceEnvironment | undefined,
  baseEnv: NodeJS.ProcessEnv = process.env,
) {
  if (!environment || environment.length === 0) {
    return baseEnv;
  }

  const home = yield* HostProcess.HomeDirectory;
  const next: NodeJS.ProcessEnv = { ...baseEnv };
  for (const variable of environment) {
    // An unresolved secret reference carries no value; the registry resolves it for the provider.
    if (typeof variable.value !== "string") continue;
    next[variable.name] =
      variable.name === "CODEX_HOME" || variable.name === "CLAUDE_CONFIG_DIR"
        ? expandHomePath(variable.value, home)
        : variable.value;
  }
  return next;
});
