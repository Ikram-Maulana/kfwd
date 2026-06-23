import test from "ava";
import { buildArgv, killGracefully } from "@/kubectl";
import type { Config, Forward } from "@/types";

const fwd: Forward = {
  name: "tx",
  type: "service",
  localPort: 3202,
  remotePort: 3202,
};

test("buildArgv includes namespace and ports", (t) => {
  const c: Config = { namespace: "internal", forwards: [] };
  t.deepEqual(buildArgv(fwd, c), [
    "kubectl",
    "-n",
    "internal",
    "port-forward",
    "service/tx",
    "3202:3202",
  ]);
});

test("buildArgv includes --context when kubeContext set", (t) => {
  const c: Config = {
    namespace: "internal",
    kubeContext: "minikube",
    forwards: [],
  };
  const argv = buildArgv(fwd, c);
  t.deepEqual(argv, [
    "kubectl",
    "--context",
    "minikube",
    "-n",
    "internal",
    "port-forward",
    "service/tx",
    "3202:3202",
  ]);
});

test("buildArgv honors deployment type", (t) => {
  const c: Config = { namespace: "x", forwards: [] };
  const argv = buildArgv({ ...fwd, type: "deployment" }, c);
  t.true(argv.includes("deployment/tx"));
});

test("killGracefully on win32 calls taskkill /T", async (t) => {
  if (process.platform !== "win32") {
    t.pass();
    return;
  }
  await killGracefully(process.pid);
  t.pass();
});
