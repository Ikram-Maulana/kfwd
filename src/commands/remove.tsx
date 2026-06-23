import { renderPick } from "@/command-base";
import { ConfigStore } from "@/config";
import { killGracefully } from "@/kubectl";
import { RunsStore } from "@/runs";
import { forwardLabel } from "@/tui/format";
import type { Forward } from "@/types";

export interface RemoveDeps {
  cfg: ConfigStore;
  killFn?: (pid: number) => Promise<void>;
  pickSelected?: (
    items: Forward[],
    runningOf: (f: Forward) => boolean
  ) => Promise<Forward[]>;
  runs: RunsStore;
  stdout?: (s: string) => void;
}

async function removeForwardRule(
  name: string,
  cfg: ConfigStore,
  runs: RunsStore,
  killFn: (pid: number) => Promise<void>,
  out: (s: string) => void
): Promise<boolean> {
  const removed = cfg.removeByName(name);
  if (!removed) {
    return false;
  }
  if (runs.isAlive(name)) {
    const r = runs.read(name);
    if (r) {
      await killFn(r.pid);
      out(`kfwd: killed pid ${r.pid} for "${name}"`);
    }
  }
  runs.clear(name);
  out(`kfwd: removed "${name}"`);
  return true;
}

export async function remove(
  name: string,
  deps: Partial<RemoveDeps> = {}
): Promise<void> {
  const { pathsFromEnv } = await import("../paths.js");
  const p = pathsFromEnv();
  const cfg = deps.cfg ?? new ConfigStore(p.configFile);
  const runs = deps.runs ?? new RunsStore(p.runsDir);
  const out = deps.stdout ?? ((s) => console.log(s));
  const killFn = deps.killFn ?? killGracefully;

  if (!name) {
    const config = cfg.load();
    const items = config.forwards;
    if (items.length === 0) {
      out("kfwd: no forwards configured.");
      return;
    }

    const pick =
      deps.pickSelected ??
      ((it: Forward[], ro: (f: Forward) => boolean) =>
        renderPick(it, {
          allowRunningSelection: true,
          labelOf: forwardLabel,
          runningOf: ro,
          title: "Select Port Forward Rules to Remove",
        }));

    const selected = await pick(items, (f) => runs.isAlive(f.name));
    if (selected.length === 0) {
      out("kfwd: no rules removed");
      return;
    }
    await Promise.all(
      selected.map((f) => removeForwardRule(f.name, cfg, runs, killFn, out))
    );
    return;
  }

  const success = await removeForwardRule(name, cfg, runs, killFn, out);
  if (!success) {
    out(`kfwd: rule "${name}" not found`);
  }
}
