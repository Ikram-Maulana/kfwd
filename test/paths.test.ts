import test from "ava";
import { pathsFromEnv } from "@/paths";

test("pathsFromEnv uses XDG_CONFIG_HOME when set (posix)", (t) => {
  const p = pathsFromEnv({
    platform: "linux",
    env: { XDG_CONFIG_HOME: "/tmp/cfg" },
  });
  t.is(p.configDir, "/tmp/cfg/kfwd");
  t.is(p.configFile, "/tmp/cfg/kfwd/config.json");
  t.is(p.runsDir, "/tmp/cfg/kfwd/runs");
});

test("pathsFromEnv falls back to ~/.config (posix)", (t) => {
  const p = pathsFromEnv({ platform: "linux", env: {}, home: "/home/u" });
  t.is(p.configDir, "/home/u/.config/kfwd");
});

test("pathsFromEnv uses APPDATA on win32", (t) => {
  const p = pathsFromEnv({
    platform: "win32",
    env: { APPDATA: "C:\\Users\\u\\AppData\\Roaming" },
  });
  t.is(p.configDir, "C:\\Users\\u\\AppData\\Roaming\\kfwd");
  t.is(p.configFile, "C:\\Users\\u\\AppData\\Roaming\\kfwd\\config.json");
});
