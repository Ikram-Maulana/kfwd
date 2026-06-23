import { ConfigStore } from "@/config";
import { buildArgv, type SpawnResult, spawnDetached } from "@/kubectl";
import { RunsStore } from "@/runs";
import { forwardLabel } from "@/tui/format";
import { MultiSelect } from "@/tui/multi-select";
import type { Forward } from "@/types";

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

async function defaultPick(
  items: Forward[],
  runningOf: (f: Forward) => boolean
): Promise<Forward[]> {
  const { render } = await import("ink");
  return new Promise<Forward[]>((resolve) => {
    const { unmount } = render(
      <MultiSelect
        items={items}
        labelOf={forwardLabel}
        onSubmit={(sel) => {
          unmount();
          resolve(sel);
        }}
        runningOf={runningOf}
      />
    );
  });
}

export async function start(deps: Partial<StartDeps> = {}): Promise<void> {
  const { pathsFromEnv } = await import("../paths.js");
  const p = pathsFromEnv();
  const cfg = deps.cfg ?? new ConfigStore(p.configFile);
  const runs = deps.runs ?? new RunsStore(p.runsDir);
  const spawnFn = deps.spawnFn ?? spawnDetached;
  const out = deps.stdout ?? ((s) => console.log(s));
  const pick = deps.pickSelected ?? defaultPick;

  const config = cfg.load();
  const items = config.forwards;
  if (items.length === 0) {
    out("kfwd: no forwards configured. Run `kfwd add <name> <l:r>` first.");
    return;
  }

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
