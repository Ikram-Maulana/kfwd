import { ConfigStore } from "@/config";
import { killGracefully } from "@/kubectl";
import { RunsStore } from "@/runs";

export interface RemoveDeps {
  cfg: ConfigStore;
  killFn?: (pid: number) => Promise<void>;
  runs: RunsStore;
  stdout?: (s: string) => void;
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

  const removed = cfg.removeByName(name);
  if (!removed) {
    out(`kfwd: rule "${name}" not found`);
    return;
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
}
