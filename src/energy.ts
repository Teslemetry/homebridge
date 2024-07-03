import { PlatformAccessory } from "homebridge";

import { EnergySpecific } from "tesla-fleet-api";
import {
  LiveStatusResponse
} from "tesla-fleet-api/dist/types/live_status";
import {
  SiteInfoResponse
} from "tesla-fleet-api/dist/types/site_info.js";
import { Autonomous } from "./energy-services/autonomous.js";
import { ChargeFromGrid } from "./energy-services/changefromgrid.js";
import { ExportBattery } from "./energy-services/exportbattery.js";
import { StormWatch } from "./energy-services/stormwatch.js";
import { TeslaFleetApiPlatform } from "./platform.js";
import { REFRESH_INTERVAL } from "./settings.js";
import { EventEmitter } from "./utils/event.js";

export type EnergyContext = {
  id: number;
  battery: boolean;
  grid: boolean;
  solar: boolean;
};

export interface EnergyDataEvent {
  live_status(data: LiveStatusResponse): void;
  site_info(data: SiteInfoResponse): void;
}

export class EnergyAccessory {
  public energy: EnergySpecific;
  public emitter: EventEmitter<EnergyDataEvent>;

  constructor(
    public readonly platform: TeslaFleetApiPlatform,
    public readonly accessory: PlatformAccessory<EnergyContext>
  ) {
    if (!this.platform.TeslaFleetApi?.energy) {
      throw new Error("TeslaFleetApi not initialized");
    }

    this.energy = this.platform.TeslaFleetApi.energy.specific(
      this.accessory.context.id
    );

    this.emitter = new EventEmitter();

    // Create services
    if (this.accessory.context.battery && this.accessory.context.grid && this.accessory.context.solar) {
      new ChargeFromGrid(this);
      new ExportBattery(this);
    }
    if (this.accessory.context.battery && this.accessory.context.grid) {
      new StormWatch(this);
      new Autonomous(this);
    }

    // Get data and schedule refresh

    this.refresh();
    setInterval(() => this.refresh(), REFRESH_INTERVAL);
  }

  async refresh(): Promise<void> {
    this.energy
      .site_info()
      .then((data) => {
        this.emitter.emit("site_info", data);
      })
      .catch(({ status, data }) => {
        if (data?.error) {
          this.platform.log.warn(`${this.accessory.displayName} site_info return status ${status}: ${data.error}`);
          return;
        }
        this.platform.log.error(`${this.accessory.displayName} site_info return status ${status}: ${data}`);
      });
    this.energy
      .live_status()
      .then((data) => {
        this.emitter.emit("live_status", data);
      })
      .catch(({ status, data }) => {
        if (data?.error) {
          this.platform.log.warn(`${this.accessory.displayName} live_status return status ${status}: ${data.error}`);
          return;
        }
        this.platform.log.error(`${this.accessory.displayName} live_status return status ${status}: ${data}`);
      });
  }
}
