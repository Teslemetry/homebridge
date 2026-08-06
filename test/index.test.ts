import assert from "node:assert/strict";
import test from "node:test";

import registerPlugin from "../src/index.js";
import { TeslaFleetApiPlatform } from "../src/platform.js";
import { PLATFORM_NAME, PLUGIN_NAME } from "../src/settings.js";

test("registers the platform under its plugin and platform names", () => {
  const calls: { pluginName: string; platformName: string; constructor: unknown }[] = [];
  const fakeApi = {
    registerPlatform(pluginName: string, platformName: string, constructor: unknown) {
      calls.push({ pluginName, platformName, constructor });
    },
  } as unknown as Parameters<typeof registerPlugin>[0];

  registerPlugin(fakeApi);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].pluginName, PLUGIN_NAME);
  assert.equal(calls[0].platformName, PLATFORM_NAME);
  assert.equal(calls[0].constructor, TeslaFleetApiPlatform);
});
