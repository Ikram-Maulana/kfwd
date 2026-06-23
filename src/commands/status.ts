import { ConfigStore } from "@/config";
import { alive, RunsStore, tailLine } from "@/runs";
import type { StatusKind } from "@/types";

interface Row {
  lastLine: string;
  mapping: string;
  name: string;
  status: string;
  type: string;
  uptime: string;
}

function classify(
  name: string,
  runs: RunsStore
): {
  kind: StatusKind;
  startedAt?: number;
} {
  const r = runs.read(name);
  if (!(r && alive(r.pid))) {
    return { kind: "stopped" };
  }
  return { kind: "running", startedAt: r.startedAt };
}

function uptime(from: number): string {
  const s = Math.max(0, Math.floor((Date.now() - from) / 1000));
  if (s < 60) {
    return `${s}s`;
  }
  if (s < 3600) {
    return `${Math.floor(s / 60)}m`;
  }
  return `${Math.floor(s / 3600)}h${Math.floor((s % 3600) / 60)}m`;
}

function visualLength(s: string): number {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: need to match ESC control char to strip ANSI color sequences
  return s.replace(/\u001b\[[0-9;]*m/g, "").length;
}

function padRight(s: string, width: number): string {
  const visLen = visualLength(s);
  const needed = Math.max(0, width - visLen);
  return s + " ".repeat(needed);
}

export function renderStatus(cfg: ConfigStore, runs: RunsStore): string {
  const c = cfg.load();
  if (c.forwards.length === 0) {
    return "\n  \u001b[90mNo active port forwarding rules saved.\u001b[0m\n  \u001b[90mRun \u001b[36mkfwd add\u001b[90m to save a new rule.\u001b[0m\n";
  }

  const rows: Row[] = c.forwards.map((f) => {
    const { kind, startedAt } = classify(f.name, runs);
    const isRunning = kind === "running";

    const styledName = isRunning
      ? `\u001b[1m${f.name}\u001b[0m`
      : `\u001b[90m${f.name}\u001b[0m`;

    const styledType = isRunning
      ? `\u001b[33m${f.type}\u001b[0m`
      : `\u001b[90m${f.type}\u001b[0m`;

    const styledMapping = isRunning
      ? `${f.localPort}\u001b[36m➔\u001b[0m${f.remotePort}`
      : `\u001b[90m${f.localPort}➔${f.remotePort}\u001b[0m`;

    const styledStatus = isRunning
      ? "\u001b[32m● running\u001b[0m"
      : "\u001b[90m○ stopped\u001b[0m";

    const upt = isRunning && startedAt ? uptime(startedAt) : "-";
    const styledUptime = isRunning
      ? `\u001b[32m${upt}\u001b[0m`
      : "\u001b[90m-\u001b[0m";

    const rawLine = tailLine(runs.logPath(f.name));
    const styledLastLine = rawLine
      ? `\u001b[90m${rawLine}\u001b[0m`
      : "\u001b[90m-\u001b[0m";

    return {
      lastLine: styledLastLine,
      mapping: styledMapping,
      name: styledName,
      status: styledStatus,
      type: styledType,
      uptime: styledUptime,
    };
  });

  const cols: (keyof Row)[] = [
    "name",
    "type",
    "mapping",
    "status",
    "uptime",
    "lastLine",
  ];

  const header: Row = {
    name: "\u001b[1;36mNAME\u001b[0m",
    type: "\u001b[1;36mTYPE\u001b[0m",
    mapping: "\u001b[1;36mLOCAL➔REMOTE\u001b[0m",
    status: "\u001b[1;36mSTATUS\u001b[0m",
    uptime: "\u001b[1;36mUPTIME\u001b[0m",
    lastLine: "\u001b[1;36mLAST LOG LINE\u001b[0m",
  };

  const widths = cols.map((col) =>
    Math.max(
      visualLength(String(header[col])),
      ...rows.map((r) => visualLength(String(r[col])))
    )
  );

  const fmt = (r: Row) =>
    cols.map((col, i) => padRight(String(r[col]), widths[i] ?? 0)).join("  ");

  const lines = [fmt(header), ...rows.map(fmt)];
  return lines.join("\n");
}

export interface StatusDeps {
  cfg?: ConfigStore;
  runs?: RunsStore;
  stdout?: (s: string) => void;
}

export async function status(deps: Partial<StatusDeps> = {}): Promise<void> {
  const { pathsFromEnv } = await import("../paths.js");
  const p = pathsFromEnv();
  const cfg = deps.cfg ?? new ConfigStore(p.configFile);
  const runs = deps.runs ?? new RunsStore(p.runsDir);
  const out = deps.stdout ?? ((s: string) => console.log(s));
  out(renderStatus(cfg, runs));
}
