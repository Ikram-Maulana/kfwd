import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "ava";
import { add } from "@/commands/add";
import { remove } from "@/commands/remove";
import { start } from "@/commands/start";
import { renderStatus } from "@/commands/status";
import { stop } from "@/commands/stop";
import { ConfigStore } from "@/config";
import { RunsStore } from "@/runs";

test("end-to-end lifecycle with mocked spawn/kill", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "kfwd-e2e-"));
  const cfg = new ConfigStore(join(dir, "config.json"));
  const runs = new RunsStore(join(dir, "runs"));
  const out: string[] = [];
  const log = (s: string) => out.push(s);
  const spawns: number[] = [];
  const killed: number[] = [];

  await add(
    { name: "tx", ports: "3202:3202", type: "service" },
    { cfg, stdout: log }
  );
  t.is(cfg.load().forwards.length, 1);

  await start({
    cfg,
    runs,
    stdout: log,
    spawnFn: (argv, _log) => {
      const pid = 99_000 + spawns.length;
      spawns.push(pid);
      return { pid, cmdline: argv };
    },
    pickSelected: async (items) => items,
  });
  t.is(spawns.length, 1);
  t.true(runs.read("tx") !== null);

  const statusOut = renderStatus(cfg, runs);
  t.true(statusOut.includes("tx"));

  await stop({
    cfg,
    runs,
    stdout: log,
    killFn: (pid) => {
      killed.push(pid);
      return Promise.resolve();
    },
    pickSelected: async () => [],
  });
  t.is(killed.length, 0);

  await remove("tx", {
    cfg,
    runs,
    stdout: log,
    killFn: async () => undefined,
  });
  t.is(cfg.load().forwards.length, 0);
  t.is(runs.read("tx"), null);

  rmSync(dir, { recursive: true });
});
