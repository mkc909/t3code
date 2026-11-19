import { withWindowsUserBwsToken } from "@t3tools/provider-core/server/instanceEnvironment";
import { describe, expect, it, vi } from "vite-plus/test";

import { loadWindowsUserBwsToken } from "./workstationCredentials.ts";

describe("loadWindowsUserBwsToken", () => {
  it("hydrates a stripped environment from the Windows User scope", async () => {
    const env: NodeJS.ProcessEnv = { PATH: "test-path" };
    const readUserToken = vi.fn(async () => "fixture-from-user-scope");

    const token = await loadWindowsUserBwsToken(env, "win32", readUserToken);

    expect(withWindowsUserBwsToken(env, token)).toEqual({
      PATH: "test-path",
      BWS_ACCESS_TOKEN: "fixture-from-user-scope",
    });
    expect(env).toEqual({ PATH: "test-path" });
    expect(readUserToken).toHaveBeenCalledOnce();
  });

  it.each([
    { platform: "win32", env: { bws_access_token: "fixture-inherited" } },
    { platform: "linux", env: {} },
    { platform: "darwin", env: {} },
  ] as const)(
    "skips the User scope when the environment is already usable on $platform",
    async ({ platform, env }) => {
      const before = { ...env };
      const readUserToken = vi.fn(async () => "fixture-from-user-scope");

      expect(await loadWindowsUserBwsToken(env, platform, readUserToken)).toBeUndefined();

      expect(env).toEqual(before);
      expect(readUserToken).not.toHaveBeenCalled();
    },
  );

  it.each([undefined, " \r\n"])(
    "leaves the token absent for an empty lookup (%s)",
    async (value) => {
      const env: NodeJS.ProcessEnv = {};

      expect(await loadWindowsUserBwsToken(env, "win32", async () => value)).toBeUndefined();

      expect(env).toEqual({});
    },
  );

  it("continues when PowerShell cannot read the User scope", async () => {
    const token = await loadWindowsUserBwsToken({}, "win32", async () => {
      throw new Error("fixture lookup failure");
    });

    expect(token).toBeUndefined();
  });
});
