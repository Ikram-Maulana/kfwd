import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "ava";
import { remove } from "@/commands/remove";
import { ConfigStore } from "@/config";
import { RunsStore } from "@/runs";

function fresh() {
  const dir = mkdtempSync(join(tmpdir(), "kfwd-rm-"));
  return {
    dir,
    cfg: new ConfigStore(join(dir, "config.json")),
    runs: new RunsStore(join(dir, "runs")),
  };
}

test("remove deletes from config and clears run files", async (t) => {
  const { dir, cfg, runs } = fresh();
  cfg.add({ name: "tx", type: "service", localPort: 3202, remotePort: 3202 });
  runs.recordSpawn("tx", { pid: 2 ** 30, startedAt: 0, cmdline: ["x"] });
  writeFileSync(runs.logPath("tx"), "x");

  await remove("tx", { cfg, runs, stdout: () => undefined });
  t.is(cfg.load().forwards.length, 0);
  t.is(runs.read("tx"), null);
  rmSync(dir, { recursive: true });
});

test("remove on missing name is a no-op print", async (t) => {
  const { dir, cfg, runs } = fresh();
  const out: string[] = [];
  await remove("nope", {
    cfg,
    runs,
    stdout: (s) => out.push(s),
  });
  t.true((out[0] ?? "").includes("not found"));
  rmSync(dir, { recursive: true });
});

test("remove with empty name shows selection and deletes chosen rules", async (t) => {
  const { dir, cfg, runs } = fresh();
  cfg.add({ name: "tx", type: "service", localPort: 3202, remotePort: 3202 });
  cfg.add({ name: "cfg", type: "service", localPort: 3201, remotePort: 3201 });
  runs.recordSpawn("tx", { pid: process.pid, startedAt: 0, cmdline: ["x"] });

  const killed: number[] = [];
  const out: string[] = [];
  await remove("", {
    cfg,
    runs,
    killFn: (pid) => {
      killed.push(pid);
      return Promise.resolve();
    },
    stdout: (s) => out.push(s),
    pickSelected: async (items) => items.filter((it) => it.name === "tx"),
  });

  t.is(cfg.load().forwards.length, 1);
  t.is(cfg.load().forwards[0]?.name, "cfg");
  t.deepEqual(killed, [process.pid]);
  t.true(out.some((s) => s.includes('removed "tx"')));
  rmSync(dir, { recursive: true });
});
