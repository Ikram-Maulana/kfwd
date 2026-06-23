import test from "ava";
import { render } from "ink-testing-library";
import { MultiSelect } from "@/tui/multi-select";

const tick = () => new Promise<void>((r) => setImmediate(r));

interface Item {
  name: string;
  running: boolean;
}

test("renders all items, marks running disabled", (t) => {
  const { lastFrame } = render(
    <MultiSelect
      items={[
        { name: "tx", running: false },
        { name: "cfg", running: true },
      ]}
      labelOf={(i) => i.name}
      onSubmit={() => undefined}
      runningOf={(i) => i.running}
    />
  );
  const out = lastFrame() ?? "";
  t.true(out.includes("tx"));
  t.true(out.includes("cfg"));
  t.true(out.includes("running"));
});

test("space toggles selection, enter submits", async (t) => {
  let submitted: Item[] = [];
  const { stdin } = render(
    <MultiSelect
      items={[{ name: "tx", running: false }]}
      labelOf={(i) => i.name}
      onSubmit={(sel) => {
        submitted = sel;
      }}
      runningOf={(i) => i.running}
    />
  );
  stdin.write(" ");
  await tick();
  stdin.write("\r");
  await tick();
  t.deepEqual(
    submitted.map((i) => i.name),
    ["tx"]
  );
});

test("'a' toggles all (non-running only)", async (t) => {
  let submitted: Item[] = [];
  const { stdin } = render(
    <MultiSelect
      items={[
        { name: "tx", running: false },
        { name: "cfg", running: false },
        { name: "audit", running: true },
      ]}
      labelOf={(i) => i.name}
      onSubmit={(sel) => {
        submitted = sel;
      }}
      runningOf={(i) => i.running}
    />
  );
  stdin.write("a");
  await tick();
  stdin.write("\r");
  await tick();
  t.deepEqual(submitted.map((i) => i.name).sort(), ["cfg", "tx"]);
});

test("arrow keys change cursor and space toggles current cursor item", async (t) => {
  let submitted: Item[] = [];
  const { stdin } = render(
    <MultiSelect
      items={[
        { name: "tx", running: false },
        { name: "cfg", running: false },
      ]}
      labelOf={(i) => i.name}
      onSubmit={(sel) => {
        submitted = sel;
      }}
      runningOf={(i) => i.running}
    />
  );
  stdin.write("\u001B[B");
  await tick();
  stdin.write(" ");
  await tick();
  stdin.write("\r");
  await tick();
  t.deepEqual(
    submitted.map((i) => i.name),
    ["cfg"]
  );
});

test("allowRunningSelection allows selecting running items", async (t) => {
  let submitted: Item[] = [];
  const { stdin } = render(
    <MultiSelect
      allowRunningSelection={true}
      items={[{ name: "tx", running: true }]}
      labelOf={(i) => i.name}
      onSubmit={(sel) => {
        submitted = sel;
      }}
      runningOf={(i) => i.running}
    />
  );
  stdin.write(" ");
  await tick();
  stdin.write("\r");
  await tick();
  t.deepEqual(
    submitted.map((i) => i.name),
    ["tx"]
  );
});
