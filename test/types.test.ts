import test from "ava";
import {
  type Config,
  type Forward,
  parsePorts,
  validateConfig,
  validateForward,
} from "@/types";

test("parsePorts accepts '3202:3202'", (t) => {
  t.deepEqual(parsePorts("3202:3202"), { localPort: 3202, remotePort: 3202 });
});

test("parsePorts rejects malformed", (t) => {
  t.throws(() => parsePorts("3202"));
  t.throws(() => parsePorts("abc:def"));
  t.throws(() => parsePorts("0:3202"));
  t.throws(() => parsePorts("70000:3202"));
});

test("validateForward accepts valid forward", (t) => {
  const f: Forward = {
    name: "tx",
    type: "service",
    localPort: 3202,
    remotePort: 3202,
  };
  t.deepEqual(validateForward(f, []), f);
});

test("validateForward rejects duplicate name", (t) => {
  const f: Forward = {
    name: "tx",
    type: "service",
    localPort: 3202,
    remotePort: 3202,
  };
  t.throws(() => validateForward(f, [{ ...f, name: "tx" }]));
});

test("validateForward rejects duplicate localPort", (t) => {
  const f: Forward = {
    name: "tx2",
    type: "service",
    localPort: 3202,
    remotePort: 9999,
  };
  t.throws(() =>
    validateForward(f, [
      { name: "tx", type: "service", localPort: 3202, remotePort: 3202 },
    ])
  );
});

test("validateForward rejects invalid type", (t) => {
  const f = {
    name: "tx",
    type: "bogus",
    localPort: 3202,
    remotePort: 3202,
  } as unknown as Forward;
  t.throws(() => validateForward(f, []));
});

test("validateConfig accepts minimal", (t) => {
  const c: Config = { namespace: "internal", forwards: [] };
  t.deepEqual(validateConfig(c), c);
});

test("validateConfig rejects missing namespace", (t) => {
  t.throws(() =>
    validateConfig({ namespace: "", forwards: [] } as unknown as Config)
  );
});
