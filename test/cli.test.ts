import test from "ava";
import { dispatch, type Handlers } from "../src/cli.js";

function mockHandlers(): Handlers & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    add: (input) => {
      calls.push(`add:${input.name ?? ""}:${input.ports ?? ""}`);
    },
    remove: (name) => {
      calls.push(`remove:${name}`);
    },
    start: () => {
      calls.push("start");
    },
    status: () => {
      calls.push("status");
    },
    stop: () => {
      calls.push("stop");
    },
  };
}

test("dispatch routes 'status' to status handler", async (t) => {
  const h = mockHandlers();
  await dispatch(["status"], h);
  t.deepEqual(h.calls, ["status"]);
});

test("dispatch routes 'start' to start handler", async (t) => {
  const h = mockHandlers();
  await dispatch(["start"], h);
  t.deepEqual(h.calls, ["start"]);
});

test("dispatch routes 'stop' to stop handler", async (t) => {
  const h = mockHandlers();
  await dispatch(["stop"], h);
  t.deepEqual(h.calls, ["stop"]);
});

test("dispatch routes 'remove' with name arg", async (t) => {
  const h = mockHandlers();
  await dispatch(["remove", "my-forward"], h);
  t.deepEqual(h.calls, ["remove:my-forward"]);
});

test("dispatch routes 'remove' without name", async (t) => {
  const h = mockHandlers();
  await dispatch(["remove"], h);
  t.deepEqual(h.calls, ["remove:"]);
});

test("dispatch routes 'add' with positional args", async (t) => {
  const h = mockHandlers();
  await dispatch(["add", "myapp", "8080:8080"], h);
  t.deepEqual(h.calls, ["add:myapp:8080:8080"]);
});

test("dispatch throws on unknown command", async (t) => {
  const h = mockHandlers();
  await t.throwsAsync(() => dispatch(["bogus"], h), {
    message: "unknown command: bogus",
  });
});
