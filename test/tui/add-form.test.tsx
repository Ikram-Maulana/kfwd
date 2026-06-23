import test from "ava";
import { render } from "ink-testing-library";
import { AddForm } from "@/tui/add-form";

const tick = () => new Promise<void>((r) => setImmediate(r));

test("AddForm collects name → type → local → remote then confirms", async (t) => {
  let captured: unknown = "sentinel";
  const { stdin } = render(
    <AddForm
      onSubmit={(v) => {
        captured = v;
      }}
    />
  );
  for (const ch of "tx") {
    stdin.write(ch);
    await tick();
  }
  stdin.write("\r");
  await tick();
  for (const ch of "service") {
    stdin.write(ch);
    await tick();
  }
  stdin.write("\r");
  await tick();
  stdin.write("\r"); // Skip namespace step
  await tick();
  for (const ch of "3202") {
    stdin.write(ch);
    await tick();
  }
  stdin.write("\r");
  await tick();
  for (const ch of "3202") {
    stdin.write(ch);
    await tick();
  }
  stdin.write("\r");
  await tick();
  for (const ch of "y") {
    stdin.write(ch);
    await tick();
  }
  stdin.write("\r");
  await tick();
  t.deepEqual(captured, {
    name: "tx",
    type: "service",
    namespace: undefined,
    localPort: 3202,
    remotePort: 3202,
  });
});

test("AddForm 'n' at confirm aborts", async (t) => {
  let captured: unknown = "sentinel";
  const { stdin } = render(
    <AddForm
      onSubmit={(v) => {
        captured = v;
      }}
    />
  );
  const send = async (s: string) => {
    for (const ch of s) {
      stdin.write(ch);
      await tick();
    }
    stdin.write("\r");
    await tick();
  };
  await send("tx");
  await send("service");
  await send(""); // Namespace (skipped)
  await send("3202");
  await send("3202");
  for (const ch of "n") {
    stdin.write(ch);
    await tick();
  }
  stdin.write("\r");
  await tick();
  t.is(captured, null);
});

test("AddForm collects namespace if provided", async (t) => {
  let captured: unknown = "sentinel";
  const { stdin } = render(
    <AddForm
      onSubmit={(v) => {
        captured = v;
      }}
    />
  );
  const send = async (s: string) => {
    for (const ch of s) {
      stdin.write(ch);
      await tick();
    }
    stdin.write("\r");
    await tick();
  };
  await send("tx");
  await send("service");
  await send("my-ns"); // Namespace provided
  await send("3202");
  await send("3202");
  await send("y");
  t.deepEqual(captured, {
    name: "tx",
    type: "service",
    namespace: "my-ns",
    localPort: 3202,
    remotePort: 3202,
  });
});

test("AddForm uses 'service' as default type if skipped", async (t) => {
  let captured: unknown = "sentinel";
  const { stdin } = render(
    <AddForm
      onSubmit={(v) => {
        captured = v;
      }}
    />
  );
  const send = async (s: string) => {
    for (const ch of s) {
      stdin.write(ch);
      await tick();
    }
    stdin.write("\r");
    await tick();
  };
  await send("tx");
  await send(""); // Type step (press Enter directly)
  await send(""); // Namespace step (press Enter directly)
  await send("3202");
  await send("3202");
  await send("y");
  t.deepEqual(captured, {
    name: "tx",
    type: "service",
    namespace: undefined,
    localPort: 3202,
    remotePort: 3202,
  });
});
