import {
  existsSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "ava";
import { ConfigStore } from "@/config";

function fresh(): { dir: string; store: ConfigStore } {
  const dir = mkdtempSync(join(tmpdir(), "kfwd-test-"));
  return { dir, store: new ConfigStore(join(dir, "config.json")) };
}

test("load returns empty config when file missing", (t) => {
  const { store, dir } = fresh();
  t.deepEqual(store.load(), {
    namespace: "default",
    kubeContext: undefined,
    forwards: [],
  });
  rmSync(dir, { recursive: true });
});

test("save then load round-trips", (t) => {
  const { store, dir } = fresh();
  const c = {
    namespace: "internal",
    kubeContext: "minikube",
    forwards: [
      {
        name: "tx",
        type: "service" as const,
        localPort: 3202,
        remotePort: 3202,
      },
    ],
  };
  store.save(c);
  t.deepEqual(store.load(), c);
  rmSync(dir, { recursive: true });
});

test("load backs up corrupt file and returns empty", (t) => {
  const { store, dir } = fresh();
  writeFileSync(store.path, "{ not json");
  const c = store.load();
  t.deepEqual(c.forwards, []);
  t.false(existsSync(store.path));
  const backups = readdirSync(dir).filter((f) =>
    f.startsWith("config.json.bak.")
  );
  t.true(backups.length === 1);
  rmSync(dir, { recursive: true });
});

test("add appends and persists", (t) => {
  const { store, dir } = fresh();
  store.add({ name: "tx", type: "service", localPort: 3202, remotePort: 3202 });
  store.add({
    name: "cfg",
    type: "service",
    localPort: 3201,
    remotePort: 3201,
  });
  t.is(store.load().forwards.length, 2);
  rmSync(dir, { recursive: true });
});

test("add rejects duplicate name", (t) => {
  const { store, dir } = fresh();
  store.add({ name: "tx", type: "service", localPort: 3202, remotePort: 3202 });
  t.throws(() =>
    store.add({
      name: "tx",
      type: "service",
      localPort: 9999,
      remotePort: 9999,
    })
  );
  rmSync(dir, { recursive: true });
});

test("removeByName returns the removed forward", (t) => {
  const { store, dir } = fresh();
  store.add({ name: "tx", type: "service", localPort: 3202, remotePort: 3202 });
  const r = store.removeByName("tx");
  t.truthy(r);
  t.is(store.load().forwards.length, 0);
  rmSync(dir, { recursive: true });
});

test("removeByName returns null when missing", (t) => {
  const { store, dir } = fresh();
  t.is(store.removeByName("nope"), null);
  rmSync(dir, { recursive: true });
});
