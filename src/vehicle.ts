import { PlatformAccessory } from "homebridge";

import { VehicleSpecific } from "tesla-fleet-api";
import {
  VehicleDataResponse,
} from "tesla-fleet-api/dist/types/vehicle_data";
import { TeslaFleetApiPlatform } from "./platform.js";
import { REFRESH_INTERVAL } from "./settings.js";
import { EventEmitter } from "./utils/event.js";
import { BatteryService } from "./vehicle-services/battery.js";
import { ChargeCurrentService } from "./vehicle-services/chargecurrent.js";
import { ChargeLimitService } from "./vehicle-services/chargelimit.js";
import { ChargePortService } from "./vehicle-services/chargeport.js";
import { ChargeSwitchService } from "./vehicle-services/chargeswitch.js";
import { ClimateService } from "./vehicle-services/climate.js";
import { DefrostService } from "./vehicle-services/defrost.js";
import { DoorService } from "./vehicle-services/door.js";
import { HomelinkService } from "./vehicle-services/homelink.js";
import { AccessoryInformationService } from "./vehicle-services/information.js";
import { LockService } from "./vehicle-services/lock.js";
import { SentryService } from "./vehicle-services/sentry.js";
import { WakeService } from "./vehicle-services/wake.js";
import { WindowService } from "./vehicle-services/windows.js";

export type VehicleContext = {
  vin: string;
  state: string;
};

export interface VehicleDataEvent {
  vehicle_data(data: VehicleDataResponse): void;
  offline(): void;
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

    // Create services

    new AccessoryInformationService(this);
    new BatteryService(this);
    new ClimateService(this);
    new ChargeCurrentService(this);
    new ChargeLimitService(this);
    new ChargePortService(this);
    new ChargeSwitchService(this);
    new DefrostService(this);
    new DoorService(this, "front");
    new DoorService(this, "rear");
    new LockService(this);
    new SentryService(this);
    new WindowService(this);
    new WakeService(this);

    if (this.platform.config.latitude && this.platform.config.longitude) {
      new HomelinkService(this);
    }

    // Get data and schedule refresh

    this.refresh(true);
    setInterval(() => this.refresh(), REFRESH_INTERVAL);
  }

  async refresh(first = false): Promise<void> {
    return this.platform.TeslaFleetApi.status(this.accessory.context.vin).then((status) => {
      this.accessory.context.state = status;
      if (status === "asleep" && !first) {
        this.emitter.emit("offline");
        return;
      }
      return this.platform.TeslaFleetApi.state(this.accessory.context.vin)
        .then((data) => {
          data.state = status;
          this.accessory.context.charge_state = data.charge_state;
          this.accessory.context.climate_state = data.climate_state;
          this.accessory.context.drive_state = data.drive_state;
          this.accessory.context.vehicle_state = data.vehicle_state;
          this.emitter.emit("vehicle_data", data);
        });
    })
      .catch(({ status, data }) => {
        if (data?.error) {
          this.platform.log.warn(`${this.accessory.displayName} return status ${status}: ${data.error}`);
          return;
        }
        this.platform.log.error(`${this.accessory.displayName} return status ${status}: ${data}`);
      });

  }

  async wakeUpAndWait(): Promise<void> {
    console.log(this.accessory.context.state);
    if (this.accessory.context.state === "online") {
      return Promise.resolve();
    }
    return this.platform.TeslaFleetApi.wake(this.accessory.context.vin).then(awake => {
      if (awake) {
        this.accessory.context.state = "online";
        return Promise.resolve();
      }
      return Promise.reject("Vehicle did not wake up");
    });
  }
}
