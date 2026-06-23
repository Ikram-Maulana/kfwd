import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "ava";
import { type StartDeps, start } from "@/commands/start";
import { ConfigStore } from "@/config";
import { RunsStore } from "@/runs";

function fresh() {
  const dir = mkdtempSync(join(tmpdir(), "kfwd-start-"));
  const cfg = new ConfigStore(join(dir, "config.json"));
  const runs = new RunsStore(join(dir, "runs"));
  return { dir, cfg, runs };
}

test("start spawns one detached kubectl per selected forward", async (t) => {
  const { dir, cfg, runs } = fresh();
  cfg.add({ name: "tx", type: "service", localPort: 3202, remotePort: 3202 });
  cfg.add({ name: "cfg", type: "service", localPort: 3201, remotePort: 3201 });

  const spawns: { argv: string[]; log: string }[] = [];
  const out: string[] = [];
  const deps: StartDeps = {
    cfg,
    runs,
    spawnFn: (argv, log) => {
      spawns.push({ argv, log });
      return { pid: 99_000 + spawns.length, cmdline: argv };
    },
    stdout: (s) => out.push(s),
    pickSelected: async (items) => items,
  };
  await start(deps);
  t.is(spawns.length, 2);
  t.true(spawns[0]?.argv.includes("service/tx"));
  t.true(spawns[1]?.argv.includes("service/cfg"));
  t.true(out.some((s) => s.includes("started 2 forwards")));
  rmSync(dir, { recursive: true });
});

test("start skips already-running forwards", async (t) => {
  const { dir, cfg, runs } = fresh();
  cfg.add({ name: "tx", type: "service", localPort: 3202, remotePort: 3202 });
  runs.recordSpawn("tx", {
    pid: process.pid,
    startedAt: Date.now(),
    cmdline: ["kubectl"],
  });

  const spawns: { argv: string[]; log: string }[] = [];
  const deps: StartDeps = {
    cfg,
    runs,
    spawnFn: (argv, log) => {
      spawns.push({ argv, log });
      return { pid: 1, cmdline: argv };
    },
    stdout: () => undefined,
    pickSelected: async (items) => items,
  };
  await start(deps);
  t.is(spawns.length, 0);
  rmSync(dir, { recursive: true });
});

test("start with no forwards prints hint and exits", async (t) => {
  const { dir, cfg, runs } = fresh();
  const out: string[] = [];
  await start({
    cfg,
    runs,
    stdout: (s) => out.push(s),
    pickSelected: async () => [],
  });
  t.true((out[0] ?? "").includes("no forwards configured"));
  rmSync(dir, { recursive: true });
});
