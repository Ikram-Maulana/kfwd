import { ConfigStore } from "@/config";
import { RunsStore, tailLine } from "@/runs";
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
  if (!r) {
    return { kind: "stopped" };
  }
  if (!runs.isAlive(name)) {
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

export function renderStatus(cfg: ConfigStore, runs: RunsStore): string {
  const c = cfg.load();
  const rows: Row[] = c.forwards.map((f) => {
    const { kind, startedAt } = classify(f.name, runs);
    const status = kind === "running" ? "running" : "stopped";
    return {
      lastLine: tailLine(runs.logPath(f.name)),
      mapping: `${f.localPort}→${f.remotePort}`,
      name: f.name,
      status,
      type: f.type,
      uptime: kind === "running" && startedAt ? uptime(startedAt) : "-",
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
  const widths = cols.map((col) =>
    Math.max(col.length, ...rows.map((r) => String(r[col]).length))
  );
  const fmt = (r: Row) =>
    cols.map((col, i) => String(r[col]).padEnd(widths[i] ?? 0)).join("  ");
  const header: Row = {
    name: "NAME",
    type: "TYPE",
    mapping: "LOCAL→REMOTE",
    status: "STATUS",
    uptime: "UPTIME",
    lastLine: "LAST LINE",
  };
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
