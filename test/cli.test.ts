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
    start: (opts?: { all?: boolean }) => {
      calls.push(`start:${opts?.all ? "all" : ""}`);
    },
    status: () => {
      calls.push("status");
    },
    stop: (opts?: { all?: boolean }) => {
      calls.push(`stop:${opts?.all ? "all" : ""}`);
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
  t.deepEqual(h.calls, ["start:"]);
});

test("dispatch routes 'stop' to stop handler", async (t) => {
  const h = mockHandlers();
  await dispatch(["stop"], h);
  t.deepEqual(h.calls, ["stop:"]);
});

test("dispatch routes 'start --all' to start handler with all=true", async (t) => {
  const h = mockHandlers();
  await dispatch(["start", "--all"], h);
  t.deepEqual(h.calls, ["start:all"]);
});

test("dispatch routes 'start -a' to start handler with all=true", async (t) => {
  const h = mockHandlers();
  await dispatch(["start", "-a"], h);
  t.deepEqual(h.calls, ["start:all"]);
});

test("dispatch routes 'stop --all' to stop handler with all=true", async (t) => {
  const h = mockHandlers();
  await dispatch(["stop", "--all"], h);
  t.deepEqual(h.calls, ["stop:all"]);
});

test("dispatch routes 'stop -a' to stop handler with all=true", async (t) => {
  const h = mockHandlers();
  await dispatch(["stop", "-a"], h);
  t.deepEqual(h.calls, ["stop:all"]);
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
