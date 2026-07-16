import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "ava";
import { stop } from "@/commands/stop";
import { ConfigStore } from "@/config";
import { RunsStore } from "@/runs";
import type { Forward } from "@/types";

function fixture(forwards: Forward[]) {
  const dir = mkdtempSync(join(tmpdir(), "kfwd-stop-"));
  const cfgDir = join(dir, "config");
  const runsDir = join(dir, "runs");
  const cfg = new ConfigStore(join(cfgDir, "config.json"));
  cfg.save({ forwards, namespace: "default" });
  const runs = new RunsStore(runsDir);
  return { dir, cfg, runs };
}

test("stop --all kills all running forwards", async (t) => {
  const fwd: Forward[] = [
    { name: "a", localPort: 8001, remotePort: 80, type: "pod" },
    { name: "b", localPort: 8002, remotePort: 80, type: "pod" },
    { name: "c", localPort: 8003, remotePort: 80, type: "pod" },
  ];
  const { dir, cfg, runs } = fixture(fwd);
  // Record "a" and "b" as running with a real alive PID
  runs.recordSpawn("a", {
    pid: process.pid,
    startedAt: Date.now(),
    cmdline: ["kubectl"],
  });
  runs.recordSpawn("b", {
    pid: process.pid,
    startedAt: Date.now(),
    cmdline: ["kubectl"],
  });
  // "c" has no pid record → not running
  const killed: number[] = [];
  const stdout: string[] = [];
  await stop(
    {
      cfg,
      runs,
      killFn: (pid) => {
        killed.push(pid);
        return Promise.resolve();
      },
      stdout: (s) => stdout.push(s),
    },
    { all: true }
  );
  t.is(killed.length, 2, "should kill 2 running forwards");
  t.true(
    stdout.some((s) => s.includes('killed "a"')),
    "should kill a"
  );
  t.true(
    stdout.some((s) => s.includes('killed "b"')),
    "should kill b"
  );
  t.true(
    stdout.some((s) => s.includes("stopped 2")),
    "summary line"
  );
  rmSync(dir, { recursive: true });
});

test("stop --all with nothing running prints nothing running", async (t) => {
  const fwd: Forward[] = [
    { name: "x", localPort: 9001, remotePort: 80, type: "pod" },
  ];
  const { dir, cfg, runs } = fixture(fwd);
  // No pid records → nothing running
  const killed: number[] = [];
  const stdout: string[] = [];
  await stop(
    {
      cfg,
      runs,
      killFn: (pid) => {
        killed.push(pid);
        return Promise.resolve();
      },
      stdout: (s) => stdout.push(s),
    },
    { all: true }
  );
  t.is(killed.length, 0, "should not kill anything");
  t.true(stdout.some((s) => s.includes("nothing running")));
  rmSync(dir, { recursive: true });
});

test("stop --all with zero forwards prints nothing running", async (t) => {
  const { dir, cfg, runs } = fixture([]);
  const killed: number[] = [];
  const stdout: string[] = [];
  await stop(
    {
      cfg,
      runs,
      killFn: (pid) => {
        killed.push(pid);
        return Promise.resolve();
      },
      stdout: (s) => stdout.push(s),
    },
    { all: true }
  );
  t.is(killed.length, 0);
  t.true(stdout.some((s) => s.includes("nothing running")));
  rmSync(dir, { recursive: true });
});
