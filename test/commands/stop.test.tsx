import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "ava";
import { type StopDeps, stop } from "@/commands/stop";
import { ConfigStore } from "@/config";
import { RunsStore } from "@/runs";

function fresh() {
  const dir = mkdtempSync(join(tmpdir(), "kfwd-stop-"));
  const cfg = new ConfigStore(join(dir, "config.json"));
  const runs = new RunsStore(join(dir, "runs"));
  return { dir, cfg, runs };
}

test("stop kills selected pids", async (t) => {
  const { dir, cfg, runs } = fresh();
  cfg.add({ name: "tx", type: "service", localPort: 3202, remotePort: 3202 });
  cfg.add({ name: "cfg", type: "service", localPort: 3201, remotePort: 3201 });
  runs.recordSpawn("tx", { pid: process.pid, startedAt: 0, cmdline: ["x"] });
  runs.recordSpawn("cfg", { pid: process.pid, startedAt: 0, cmdline: ["x"] });

  const killed: number[] = [];
  const deps: StopDeps = {
    cfg,
    runs,
    killFn: (pid) => {
      killed.push(pid);
      return Promise.resolve();
    },
    stdout: () => undefined,
    pickSelected: async (items) => items.filter((it) => it.name === "tx"),
  };
  await stop(deps);
  t.deepEqual(killed, [process.pid]);
  rmSync(dir, { recursive: true });
});

test("stop with no running forwards exits cleanly", async (t) => {
  const { dir, cfg, runs } = fresh();
  cfg.add({ name: "tx", type: "service", localPort: 3202, remotePort: 3202 });
  const out: string[] = [];
  await stop({
    cfg,
    runs,
    stdout: (s) => out.push(s),
    pickSelected: async () => [],
  });
  t.true((out[0] ?? "").includes("nothing running"));
  rmSync(dir, { recursive: true });
});
