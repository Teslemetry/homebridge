import assert from "node:assert/strict";
import test from "node:test";

import { TeslaFleetApiPlatform } from "../src/platform.js";

class FakeService {}
class FakeCharacteristic {}

function makeFakeApi() {
  const listeners = new Map<string, () => void>();
  return {
    hap: { Service: FakeService, Characteristic: FakeCharacteristic },
    on(event: string, listener: () => void) {
      listeners.set(event, listener);
    },
    listeners,
  };
}

function makeFakeLog() {
  const calls: { level: string; args: unknown[] }[] = [];
  return {
    debug: (...args: unknown[]) => calls.push({ level: "debug", args }),
    info: (...args: unknown[]) => calls.push({ level: "info", args }),
    warn: (...args: unknown[]) => calls.push({ level: "warn", args }),
    error: (...args: unknown[]) => calls.push({ level: "error", args }),
    calls,
  };
}

test("stores the parsed platform config, including array options", () => {
  const api = makeFakeApi();
  const config = {
    platform: "Teslemetry",
    name: "Teslemetry",
    accessToken: "test-token",
    ignore_vin: ["5YJ3E1EA1JF000001"],
    ignore_site: [12345],
  };

  const platform = new TeslaFleetApiPlatform(
    makeFakeLog() as never,
    config as never,
    api as never,
  );

  assert.equal(platform.config.accessToken, "test-token");
  assert.deepEqual(platform.config.ignore_vin, ["5YJ3E1EA1JF000001"]);
  assert.deepEqual(platform.config.ignore_site, [12345]);
});

test("registers a didFinishLaunching listener to discover accessories after cache restore", () => {
  const api = makeFakeApi();
  const config = { platform: "Teslemetry", name: "Teslemetry", accessToken: "test-token" };

  new TeslaFleetApiPlatform(makeFakeLog() as never, config as never, api as never);

  assert.equal(typeof api.listeners.get("didFinishLaunching"), "function");
});

test("polyfills log.success on loggers that predate Homebridge 1.8.0", () => {
  const api = makeFakeApi();
  const config = { platform: "Teslemetry", name: "Teslemetry", accessToken: "test-token" };
  const log = makeFakeLog();

  new TeslaFleetApiPlatform(log as never, config as never, api as never);

  assert.equal((log as unknown as { success: unknown }).success, log.info);
});
