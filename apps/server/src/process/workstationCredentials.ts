// @effect-diagnostics nodeBuiltinImport:off -- execFile bounds both captured streams of the credential lookup.
import { windowsBwsTokenKey } from "@t3tools/provider-core/server/instanceEnvironment";
import * as Redacted from "effect/Redacted";
import * as NodeChildProcess from "node:child_process";
import * as NodeUtil from "node:util";

const execFileAsync = NodeUtil.promisify(NodeChildProcess.execFile);

async function readWindowsUserBwsToken(): Promise<string> {
  const systemRoot = process.env.SystemRoot || process.env.windir || String.raw`C:\Windows`;
  const powerShell = `${systemRoot}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`;
  const { stdout } = await execFileAsync(
    powerShell,
    [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      "[Console]::Write([Environment]::GetEnvironmentVariable('BWS_ACCESS_TOKEN', 'User'))",
    ],
    { encoding: "utf8", timeout: 5_000, maxBuffer: 16_384, windowsHide: true },
  );
  return stdout;
}

export async function loadWindowsUserBwsToken(
  env: NodeJS.ProcessEnv,
  platform: NodeJS.Platform,
  readUserToken: () => Promise<string | undefined> = readWindowsUserBwsToken,
): Promise<Redacted.Redacted<string> | undefined> {
  if (platform !== "win32" || env[windowsBwsTokenKey(env)]?.trim()) return undefined;
  try {
    const token = (await readUserToken())?.trim();
    return token ? Redacted.make(token) : undefined;
  } catch {
    // execFile errors can contain captured output.
    return undefined;
  }
}
