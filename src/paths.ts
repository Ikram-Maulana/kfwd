import { platform as defaultPlatform, homedir } from "node:os";
import { join as posixJoin } from "node:path/posix";
import { join as win32Join } from "node:path/win32";

export interface Paths {
  configDir: string;
  configFile: string;
  runsDir: string;
}

export interface PathsEnv {
  env?: NodeJS.ProcessEnv;
  home?: string;
  platform?: NodeJS.Platform;
}

export function pathsFromEnv(input: PathsEnv = {}): Paths {
  const platform = input.platform ?? defaultPlatform();
  const env = input.env ?? process.env;
  const home = input.home ?? homedir();
  const base =
    platform === "win32"
      ? // biome-ignore lint/complexity/useLiteralKeys: required by noPropertyAccessFromIndexSignature
        env["APPDATA"]
      : // biome-ignore lint/complexity/useLiteralKeys: required by noPropertyAccessFromIndexSignature
        env["XDG_CONFIG_HOME"];
  let root: string;
  if (base && base.length > 0) {
    root = base;
  } else if (platform === "win32") {
    root = home;
  } else {
    root = posixJoin(home, ".config");
  }
  const pathMod = platform === "win32" ? win32Join : posixJoin;
  const configDir = pathMod(root, "kfwd");
  return {
    configDir,
    configFile: pathMod(configDir, "config.json"),
    runsDir: pathMod(configDir, "runs"),
  };
}
