import { ConfigStore } from "@/config";
import { killGracefully } from "@/kubectl";
import { RunsStore } from "@/runs";
import { forwardLabel } from "@/tui/format";
import { MultiSelect } from "@/tui/multi-select";
import type { Forward } from "@/types";

export interface StopDeps {
  cfg: ConfigStore;
  killFn?: (pid: number) => Promise<void>;
  pickSelected?: (items: Forward[]) => Promise<Forward[]>;
  runs: RunsStore;
  stdout?: (s: string) => void;
}

async function defaultPick(items: Forward[]): Promise<Forward[]> {
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
        runningOf={() => true}
      />
    );
  });
}

export async function stop(deps: Partial<StopDeps> = {}): Promise<void> {
  const { pathsFromEnv } = await import("../paths.js");
  const p = pathsFromEnv();
  const cfg = deps.cfg ?? new ConfigStore(p.configFile);
  const runs = deps.runs ?? new RunsStore(p.runsDir);
  const killFn = deps.killFn ?? killGracefully;
  const out = deps.stdout ?? ((s) => console.log(s));
  const pick = deps.pickSelected ?? defaultPick;

  const config = cfg.load();
  const running = config.forwards.filter((f) => runs.isAlive(f.name));
  if (running.length === 0) {
    out("kfwd: nothing running");
    return;
  }

  const selected = await pick(running);
  await Promise.all(
    selected.map(async (f) => {
      const r = runs.read(f.name);
      if (!r) {
        return;
      }
      await killFn(r.pid);
      out(`kfwd: killed "${f.name}" pid=${r.pid}`);
    })
  );
  out(`kfwd: stopped ${selected.length} forwards`);
}
