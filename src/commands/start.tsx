import { renderPick } from "@/command-base";
import { ConfigStore } from "@/config";
import { buildArgv, type SpawnResult, spawnSupervised } from "@/kubectl";
import { RunsStore } from "@/runs";
import { forwardLabel } from "@/tui/format";
import type { Config, Forward } from "@/types";

export interface StartDeps {
  cfg: ConfigStore;
  pickSelected?: (
    items: Forward[],
    runningOf: (f: Forward) => boolean
  ) => Promise<Forward[]>;
  runs: RunsStore;
  spawnFn?: (argv: string[], logPath: string) => SpawnResult;
  stdout?: (s: string) => void;
}

function startAll(
  items: Forward[],
  config: Config,
  runs: RunsStore,
  spawnFn: (argv: string[], logPath: string) => SpawnResult,
  out: (s: string) => void
): void {
  const fresh = items.filter((f) => !runs.isAlive(f.name));
  if (fresh.length === 0) {
    out("kfwd: nothing to start (all forwards already running)");
    return;
  }
  let started = 0;
  for (const f of fresh) {
    try {
      const argv = buildArgv(f, config);
      const { pid, cmdline } = spawnFn(argv, runs.logPath(f.name));
      if (pid > 0) {
        runs.recordSpawn(f.name, { pid, startedAt: Date.now(), cmdline });
        out(`kfwd: spawned "${f.name}" pid=${pid}`);
        started++;
      } else {
        out(`kfwd: failed to spawn "${f.name}"`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      out(`kfwd: failed to spawn "${f.name}": ${msg}`);
    }
  }
  out(`kfwd: started ${started} forwards`);
}

export async function start(
  deps: Partial<StartDeps> = {},
  opts: { all?: boolean } = {}
): Promise<void> {
  const { pathsFromEnv } = await import("../paths.js");
  const p = pathsFromEnv();
  const cfg = deps.cfg ?? new ConfigStore(p.configFile);
  const runs = deps.runs ?? new RunsStore(p.runsDir);
  const spawnFn = deps.spawnFn ?? spawnSupervised;
  const out = deps.stdout ?? ((s) => console.log(s));

  const config = cfg.load();
  const items = config.forwards;
  if (items.length === 0) {
    out("kfwd: no forwards configured. Run `kfwd add <name> <l:r>` first.");
    return;
  }

  if (opts.all) {
    startAll(items, config, runs, spawnFn, out);
    return;
  }

  const pick =
    deps.pickSelected ??
    ((it: Forward[], ro: (f: Forward) => boolean) =>
      renderPick(it, {
        labelOf: forwardLabel,
        runningOf: ro,
        title: "Select Port Forward Rules to Start",
      }));

  const selected = await pick(items, (f) => runs.isAlive(f.name));
  const fresh = selected.filter((f) => !runs.isAlive(f.name));
  for (const f of fresh) {
    const argv = buildArgv(f, config);
    const { pid, cmdline } = spawnFn(argv, runs.logPath(f.name));
    if (pid > 0) {
      runs.recordSpawn(f.name, { pid, startedAt: Date.now(), cmdline });
      out(`kfwd: spawned "${f.name}" pid=${pid}`);
    } else {
      out(`kfwd: failed to spawn "${f.name}"`);
    }
  }
  out(`kfwd: started ${fresh.length} forwards`);
}
