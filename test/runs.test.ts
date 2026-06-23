import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "ava";
import { alive, RunsStore, tailLine } from "@/runs";

function fresh(): { dir: string; store: RunsStore } {
  const dir = mkdtempSync(join(tmpdir(), "kfwd-runs-"));
  return { dir, store: new RunsStore(dir) };
}

test("alive returns true for current pid", (t) => {
  t.true(alive(process.pid));
});

test("alive returns false for definitely-dead pid", (t) => {
  t.false(alive(2 ** 30));
});

test("recordSpawn writes pidfile, read returns state", (t) => {
  const { store, dir } = fresh();
  store.recordSpawn("tx", {
    pid: 12_345,
    startedAt: 1000,
    cmdline: ["kubectl"],
  });
  const r = store.read("tx");
  t.deepEqual(r, { pid: 12_345, startedAt: 1000, cmdline: ["kubectl"] });
  rmSync(dir, { recursive: true });
});

test("read returns null for missing", (t) => {
  const { store, dir } = fresh();
  t.is(store.read("nope"), null);
  rmSync(dir, { recursive: true });
});

test("clear removes pidfile and log", (t) => {
  const { store, dir } = fresh();
  store.recordSpawn("tx", { pid: 1, startedAt: 0, cmdline: ["x"] });
  writeFileSync(store.logPath("tx"), "hello\nworld\n");
  store.clear("tx");
  t.is(store.read("tx"), null);
  rmSync(dir, { recursive: true });
});

test("tailLine returns last line truncated", (t) => {
  const { store, dir } = fresh();
  writeFileSync(store.logPath("tx"), "first\nsecond\n");
  t.is(tailLine(store.logPath("tx"), 5), "econd");
  rmSync(dir, { recursive: true });
});

test("tailLine returns empty string when missing", (t) => {
  const { dir, store } = fresh();
  t.is(tailLine(store.logPath("nope"), 60), "");
  rmSync(dir, { recursive: true });
});
