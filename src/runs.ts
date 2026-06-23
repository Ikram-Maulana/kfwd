import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import type { RunState } from "@/types";

const LINE_BREAK_RE = /\r?\n/;

export function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === "EPERM";
  }
}

export function tailLine(path: string, max = 60): string {
  if (!existsSync(path)) {
    return "";
  }
  const raw = readFileSync(path, "utf8");
  const lines = raw.split(LINE_BREAK_RE).filter((l) => l.length > 0);
  const last = lines.at(-1) ?? "";
  return last.length > max ? last.slice(-max) : last;
}

export class RunsStore {
  readonly dir: string;
  constructor(dir: string) {
    this.dir = dir;
    mkdirSync(dir, { recursive: true });
  }

  pidPath(name: string): string {
    return join(this.dir, `${name}.pid`);
  }

  logPath(name: string): string {
    return join(this.dir, `${name}.log`);
  }

  recordSpawn(name: string, state: RunState): void {
    writeFileSync(this.pidPath(name), `${JSON.stringify(state)}\n`, "utf8");
  }

  read(name: string): RunState | null {
    const p = this.pidPath(name);
    if (!existsSync(p)) {
      return null;
    }
    try {
      return JSON.parse(readFileSync(p, "utf8")) as RunState;
    } catch {
      return null;
    }
  }

  isAlive(name: string): boolean {
    const r = this.read(name);
    return r !== null && alive(r.pid);
  }

  clear(name: string): void {
    for (const p of [this.pidPath(name), this.logPath(name)]) {
      if (existsSync(p)) {
        unlinkSync(p);
      }
    }
  }
}
