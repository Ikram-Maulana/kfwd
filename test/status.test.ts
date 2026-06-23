import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "ava";
import { renderStatus } from "@/commands/status";
import { ConfigStore } from "@/config";
import { RunsStore } from "@/runs";

function fresh() {
  const dir = mkdtempSync(join(tmpdir(), "kfwd-status-"));
  return {
    dir,
    cfg: new ConfigStore(join(dir, "config.json")),
    runs: new RunsStore(join(dir, "runs")),
  };
}

test("renderStatus prints header and one row per forward", (t) => {
  const { dir, cfg, runs } = fresh();
  cfg.add({ name: "tx", type: "service", localPort: 3202, remotePort: 3202 });
  cfg.add({ name: "stopped", type: "pod", localPort: 4000, remotePort: 4000 });
  runs.recordSpawn("stopped", { pid: 2 ** 30, startedAt: 0, cmdline: ["x"] });
  writeFileSync(runs.logPath("stopped"), "error: port bound\n");

  const out = renderStatus(cfg, runs);
  t.true(out.includes("NAME"));
  t.true(out.includes("tx"));
  t.true(out.includes("stopped"));
  t.true(out.includes("running") || out.includes("stopped"));
  rmSync(dir, { recursive: true });
});

test("renderStatus marks currently-running forward", (t) => {
  const { dir, cfg, runs } = fresh();
  cfg.add({ name: "tx", type: "service", localPort: 3202, remotePort: 3202 });
  runs.recordSpawn("tx", {
    pid: process.pid,
    startedAt: Date.now(),
    cmdline: ["kubectl"],
  });
  const out = renderStatus(cfg, runs);
  t.true(out.includes("running"));
  rmSync(dir, { recursive: true });
});
