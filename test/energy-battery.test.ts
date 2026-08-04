import assert from "node:assert/strict";
import test from "node:test";

import { EnergyAccessory, EnergyContext } from "../src/energy.js";

// Minimal fakes for the slice of the homebridge/HAP API that BaseService and
// BatteryService actually touch - no real hap-nodejs instance is needed to
// prove the construction + gating behaviour in energy.ts.

class FakeCharacteristic {
  public value: unknown;
  public setFn?: (value: unknown) => void;
  updateValue(value: unknown) {
    this.value = value;
    return this;
  }
  onSet(fn: (value: unknown) => void) {
    this.setFn = fn;
    return this;
  }
}
class BatteryLevel extends FakeCharacteristic {}
class ChargingState extends FakeCharacteristic {}
(ChargingState as unknown as { CHARGING: number; NOT_CHARGING: number }).CHARGING = 1;
(ChargingState as unknown as { CHARGING: number; NOT_CHARGING: number }).NOT_CHARGING = 0;
class StatusLowBattery extends FakeCharacteristic {}
(StatusLowBattery as unknown as { BATTERY_LEVEL_LOW: number; BATTERY_LEVEL_NORMAL: number }).BATTERY_LEVEL_LOW = 1;
(StatusLowBattery as unknown as { BATTERY_LEVEL_LOW: number; BATTERY_LEVEL_NORMAL: number }).BATTERY_LEVEL_NORMAL = 0;
class ConfiguredName extends FakeCharacteristic {}
class On extends FakeCharacteristic {}
class Brightness extends FakeCharacteristic {}

class FakeService {
  public characteristics = new Map<unknown, FakeCharacteristic>();
  constructor(
    public definition: unknown,
    public displayName: string,
    public subtype: string,
  ) {}
  getCharacteristic(CharClass: new () => FakeCharacteristic) {
    if (!this.characteristics.has(CharClass)) {
      this.characteristics.set(CharClass, new CharClass());
    }
    return this.characteristics.get(CharClass);
  }
}

class Battery {
  static UUID = "battery";
}
class Switch {
  static UUID = "switch";
}

function makeAccessory(context: EnergyContext) {
  const services: FakeService[] = [];
  return {
    context,
    displayName: "Test Energy Site",
    services,
    getServiceById(definition: unknown, subtype: string) {
      return services.find((s) => s.definition === definition && s.subtype === subtype);
    },
    addService(definition: unknown, name: string, subtype: string) {
      const service = new FakeService(definition, name, subtype);
      services.push(service);
      return service;
    },
  };
}

function makePlatform() {
  const Characteristic = { BatteryLevel, ChargingState, StatusLowBattery, ConfiguredName, On, Brightness };
  return {
    log: { debug() {}, error() {}, warn() {}, info() {} },
    config: { prefixName: false },
    Service: { Battery, Switch },
    Characteristic,
    hap: { Characteristic },
    TeslaFleetApi: {
      energy: {
        specific() {
          return {
            site_info: () => Promise.resolve({}),
            live_status: () => Promise.resolve({}),
          };
        },
      },
    },
  };
}

function buildEnergyAccessory(context: EnergyContext) {
  const platform = makePlatform();
  const accessory = makeAccessory(context);
  // EnergyAccessory schedules a recurring refresh via setInterval; unref it so
  // the test process can exit instead of waiting out REFRESH_INTERVAL.
  const realSetInterval = global.setInterval;
  global.setInterval = ((...args: Parameters<typeof setInterval>) => {
    const timer = realSetInterval(...args);
    timer.unref();
    return timer;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const energyAccessory = new EnergyAccessory(platform as any, accessory as any);
    return { energyAccessory, accessory };
  } finally {
    global.setInterval = realSetInterval;
  }
}

test("Battery service is constructed when context.battery is set", () => {
  const { accessory } = buildEnergyAccessory({ id: 1, battery: true, grid: false, solar: false });
  const battery = accessory.getServiceById(Battery, "battery");
  assert.ok(battery, "expected a Battery service to be registered");
});

test("Battery service is not constructed when context.battery is unset", () => {
  const { accessory } = buildEnergyAccessory({ id: 1, battery: false, grid: true, solar: true });
  const battery = accessory.getServiceById(Battery, "battery");
  assert.equal(battery, undefined, "did not expect a Battery service to be registered");
});
