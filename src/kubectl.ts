import { spawn } from "node:child_process";
import { closeSync, openSync } from "node:fs";
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
  closeSync(logFd);
  const pid = child.pid ?? -1;
  return { pid, cmdline: argv };
}

const SUPERVISOR_SCRIPT = `
const { spawn } = require("child_process");
const { appendFileSync } = require("fs");

const cmd = JSON.parse(process.argv[1]);
const logPath = process.argv[2];
const initialDelay = 1000;
const maxDelay = 30_000;

let delay = initialDelay;
let restarts = 0;
let active = null;
let stopping = false;

function log(msg) {
  const line = "[" + new Date().toISOString() + "] " + msg + "\\n";
  try { appendFileSync(logPath, line); } catch {}
}

function cleanup() {
  stopping = true;
  if (active && !active.killed) {
    active.on("exit", () => process.exit(0));
    try { active.kill("SIGTERM"); } catch {}
    setTimeout(() => process.exit(0), 5000);
  } else {
    process.exit(0);
  }
}

process.on("SIGTERM", cleanup);
process.on("SIGINT", cleanup);

function run() {
  if (stopping) return;
  active = spawn(cmd[0], cmd.slice(1), {
    stdio: ["ignore", "pipe", "pipe"],
  });

  active.stdout.on("data", (d) => {
    try { appendFileSync(logPath, d); } catch {}
  });
  active.stderr.on("data", (d) => {
    try { appendFileSync(logPath, d); } catch {}
  });

  let restarting = false;
  function scheduleRestart() {
    if (stopping || restarting) return;
    restarting = true;
    restarts++;
    const wait = Math.min(delay, maxDelay);
    log("Restarting in " + (wait / 1000) + "s (restart #" + restarts + ")");
    delay = Math.min(delay * 2, maxDelay);
    setTimeout(run, wait);
  }

  active.on("error", (err) => {
    log("ERROR: " + err.message);
    scheduleRestart();
  });

  active.on("exit", (code, signal) => {
    if (stopping) return;
    log("kubectl exited (code=" + code + ", signal=" + signal + ")");
    scheduleRestart();
  });
}

log("Supervisor started for: " + cmd.join(" "));
run();
`;

export function spawnSupervised(argv: string[], logPath: string): SpawnResult {
  const logFd = openSync(logPath, "a");
  const child = spawn(
    process.execPath,
    ["-e", SUPERVISOR_SCRIPT, JSON.stringify(argv), logPath],
    {
      detached: true,
      stdio: ["ignore", logFd, logFd],
      windowsHide: true,
    }
  );
  child.unref();
  closeSync(logFd);
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
