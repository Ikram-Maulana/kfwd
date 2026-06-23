import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "ava";
import { type AddDeps, add } from "@/commands/add";
import { ConfigStore } from "@/config";

function fresh() {
  const dir = mkdtempSync(join(tmpdir(), "kfwd-add-"));
  return {
    dir,
    cfg: new ConfigStore(join(dir, "config.json")),
  };
}

test("add direct mode validates and saves with service type", async (t) => {
  const { dir, cfg } = fresh();
  const out: string[] = [];
  const deps: AddDeps = {
    cfg,
    stdout: (s) => out.push(s),
    collectForm: () => {
      throw new Error("should not be called");
    },
  };
  await add({ name: "tx", ports: "3202:3202", type: "service" }, deps);
  t.is(cfg.load().forwards.length, 1);
  t.true((out[0] ?? "").includes("saved"));
  rmSync(dir, { recursive: true });
});

test("add direct mode validates and saves with default 'pod' type", async (t) => {
  const { dir, cfg } = fresh();
  const out: string[] = [];
  const deps: AddDeps = {
    cfg,
    stdout: (s) => out.push(s),
    collectForm: () => {
      throw new Error("should not be called");
    },
  };
  await add({ name: "tx", ports: "3202:3202" }, deps);
  const forwards = cfg.load().forwards;
  t.is(forwards.length, 1);
  t.is(forwards[0]?.type, "pod");
  t.true((out[0] ?? "").includes("saved"));
  rmSync(dir, { recursive: true });
});

test("add direct mode rejects duplicate", async (t) => {
  const { dir, cfg } = fresh();
  cfg.add({ name: "tx", type: "service", localPort: 3202, remotePort: 3202 });
  const out: string[] = [];
  const deps: AddDeps = {
    cfg,
    stdout: (s) => out.push(s),
    collectForm: async () => null,
  };
  await t.throwsAsync(() =>
    add({ name: "tx", ports: "9999:9999", type: "service" }, deps)
  );
  rmSync(dir, { recursive: true });
});

test("add interactive mode uses form when name missing", async (t) => {
  const { dir, cfg } = fresh();
  const deps: AddDeps = {
    cfg,
    stdout: () => undefined,
    collectForm: async () => ({
      name: "tx",
      type: "service",
      localPort: 3202,
      remotePort: 3202,
    }),
  };
  await add({}, deps);
  t.is(cfg.load().forwards.length, 1);
  rmSync(dir, { recursive: true });
});
