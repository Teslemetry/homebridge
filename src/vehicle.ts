import { PlatformAccessory } from "homebridge";

import { VehicleSpecific } from "tesla-fleet-api";
import {
  ChargeState,
  ClimateState,
  DriveState,
  GUISettings,
  VehicleConfig,
  VehicleState,
} from "tesla-fleet-api/dist/types/vehicle_data";
import { TeslaFleetApiPlatform } from "./platform.js";
import { BatteryService } from "./services/battery.js";
import { DoorService } from "./services/door.js";
import { AccessoryInformationService } from "./services/information.js";
import { ClimateService } from "./services/climate.js";
import { REFRESH_INTERVAL } from "./settings.js";
import { EventEmitter } from "./utils/event.js";

export type VehicleContext = {
  vin: string;
  state: string;
  charge_state: ChargeState;
  climate_state: ClimateState;
  drive_state: DriveState;
  gui_settings: GUISettings;
  vehicle_config: VehicleConfig;
  vehicle_state: VehicleState;
};

export interface VehicleDataEvent {
  vehicle_data(data: VehicleContext): void;
}

export class VehicleAccessory {
  public vehicle: VehicleSpecific;
  public emitter: EventEmitter<VehicleDataEvent>;

  constructor(
    public readonly platform: TeslaFleetApiPlatform,
    public readonly accessory: PlatformAccessory<VehicleContext>
  ) {
    if (!this.platform.TeslaFleetApi?.vehicle) {
      throw new Error("TeslaFleetApi not initialized");
    }

    this.vehicle = this.platform.TeslaFleetApi.vehicle.specific(
      this.accessory.context.vin
    );

    this.emitter = new EventEmitter();

    this.refresh();
    setInterval(() => this.refresh(), REFRESH_INTERVAL);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb.

    new AccessoryInformationService(this);
    new BatteryService(this);
    new DoorService(this, "front");
    new DoorService(this, "rear");
    new ClimateService(this);
  }

  async refresh(): Promise<void> {
    this.vehicle
      .vehicle_data([
        "charge_state",
        "climate_state",
        "drive_state",
        "location_data",
        "vehicle_state",
      ])
      .then(({ charge_state, climate_state, drive_state, vehicle_state }) => {
        this.accessory.context.state = "online";
        this.accessory.context.charge_state = charge_state;
        this.accessory.context.climate_state = climate_state;
        this.accessory.context.drive_state = drive_state;
        this.accessory.context.vehicle_state = vehicle_state;
        this.emitter.emit("vehicle_data", this.accessory.context);
      })
      .catch((error: string) => {
        this.platform.log.warn(error);
        this.accessory.context.state = "offline";
      });
  }

  async wake_up(): Promise<void> {
    if (this.accessory.context.state === "online") {
      return Promise.resolve();
    }
    await this.vehicle.wake_up();

    let interval = 2000;
    for (let x = 0; x < 5; x++) {
      await new Promise((resolve) => setTimeout(resolve, interval));
      const { state } = await this.vehicle.vehicle();
      this.accessory.context.state = state;
      if (state === "online") {
        return Promise.resolve();
      }
      interval = interval + 2000;
    }
    return Promise.reject("Vehicle didn't wake up");
  }
}
