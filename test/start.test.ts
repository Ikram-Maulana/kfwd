import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "ava";
import { start } from "@/commands/start";
import { ConfigStore } from "@/config";
import { RunsStore } from "@/runs";
import type { Forward } from "@/types";

function fixture(forwards: Forward[]) {
  const dir = mkdtempSync(join(tmpdir(), "kfwd-start-"));
  const cfgDir = join(dir, "config");
  const runsDir = join(dir, "runs");
  const cfg = new ConfigStore(join(cfgDir, "config.json"));
  cfg.save({ forwards, namespace: "default" });
  const runs = new RunsStore(runsDir);
  return { dir, cfg, runs };
}

test("start --all starts all stopped forwards", async (t) => {
  const fwd: Forward[] = [
    { name: "a", localPort: 8001, remotePort: 80, type: "pod" },
    { name: "b", localPort: 8002, remotePort: 80, type: "pod" },
    { name: "c", localPort: 8003, remotePort: 80, type: "pod" },
  ];
  const { dir, cfg, runs } = fixture(fwd);
  t.teardown(() => rmSync(dir, { recursive: true }));
  // Record "a" as already running with a real alive PID
  runs.recordSpawn("a", {
    pid: process.pid,
    startedAt: Date.now(),
    cmdline: ["kubectl"],
  });
  const spawned: string[][] = [];
  const stdout: string[] = [];
  await start(
    {
      cfg,
      runs,
      spawnFn: (argv, _logPath) => {
        spawned.push(argv);
        return { pid: 99, cmdline: argv };
      },
      stdout: (s) => stdout.push(s),
    },
    { all: true }
  );
  t.is(spawned.length, 2, "should spawn only stopped forwards");
  t.true(
    stdout.some((s) => s.includes('spawned "b"')),
    "should spawn b"
  );
  t.true(
    stdout.some((s) => s.includes('spawned "c"')),
    "should spawn c"
  );
  t.true(
    stdout.some((s) => s.includes("started 2")),
    "summary line"
  );
});

test("start --all when all already running prints nothing to start", async (t) => {
  const fwd: Forward[] = [
    { name: "x", localPort: 9001, remotePort: 80, type: "pod" },
  ];
  const { dir, cfg, runs } = fixture(fwd);
  t.teardown(() => rmSync(dir, { recursive: true }));
  runs.recordSpawn("x", {
    pid: process.pid,
    startedAt: Date.now(),
    cmdline: ["kubectl"],
  });
  const spawned: string[] = [];
  const stdout: string[] = [];
  await start(
    {
      cfg,
      runs,
      spawnFn: (_argv, _logPath) => {
        spawned.push("should-not-happen");
        return { pid: 99, cmdline: [] };
      },
      stdout: (s) => stdout.push(s),
    },
    { all: true }
  );
  t.is(spawned.length, 0, "should not spawn anything");
  t.true(
    stdout.some((s) => s.includes("nothing to start")),
    "should print nothing to start"
  );
});

test("start --all with zero forwards prints no forwards configured", async (t) => {
  const { dir, cfg, runs } = fixture([]);
  t.teardown(() => rmSync(dir, { recursive: true }));
  const spawned: string[] = [];
  const stdout: string[] = [];
  await start(
    {
      cfg,
      runs,
      spawnFn: (_argv, _logPath) => {
        spawned.push("should-not-happen");
        return { pid: 99, cmdline: [] };
      },
      stdout: (s) => stdout.push(s),
    },
    { all: true }
  );
  t.is(spawned.length, 0);
  t.true(stdout.some((s) => s.includes("no forwards configured")));
});
