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
