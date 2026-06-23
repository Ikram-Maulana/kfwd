import { spawn } from "node:child_process";
import { openSync } from "node:fs";
import type { Config, Forward } from "@/types";

export function buildArgv(f: Forward, c: Config): string[] {
  const argv: string[] = ["kubectl"];
  if (c.kubeContext) {
    argv.push("--context", c.kubeContext);
  }
  argv.push("-n", f.namespace?.trim() || c.namespace);
  argv.push(
    "port-forward",
    `${f.type}/${f.name}`,
    `${f.localPort}:${f.remotePort}`
  );
  return argv;
}

export interface SpawnResult {
  cmdline: string[];
  pid: number;
}

export function spawnDetached(argv: string[], logPath: string): SpawnResult {
  const logFd = openSync(logPath, "a");
  const child = spawn(argv[0] ?? "", argv.slice(1), {
    detached: true,
    stdio: ["ignore", logFd, logFd],
    windowsHide: true,
  });
  child.unref();
  const pid = child.pid ?? -1;
  return { pid, cmdline: argv };
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const { platform } = process;

export async function killGracefully(pid: number): Promise<void> {
  if (platform === "win32") {
    spawn("taskkill", ["/pid", String(pid), "/T"], {
      stdio: "ignore",
      windowsHide: true,
    });
    return;
  }
  try {
    process.kill(pid, "SIGTERM");
  } catch {
    /* gone */
  }
  for (let i = 0; i < 20; i++) {
    await sleep(100);
    try {
      process.kill(pid, 0);
    } catch {
      return;
    }
  }
  try {
    process.kill(pid, "SIGKILL");
  } catch {
    /* gone */
  }
}
