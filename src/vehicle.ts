import { CharacteristicValue, PlatformAccessory, Service } from "homebridge";

import VehicleSpecific from "tesla-fleet-api/dist/vehiclespecific.js";
import { TeslaFleetApiPlatform } from "./platform.js";
import { BatteryService } from "./services/battery.js";
import { REFRESH_INTERVAL } from "./settings.js";

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class VehicleAccessory {
  private vehicle: VehicleSpecific;
  private information: Service;

  constructor(
    private readonly platform: TeslaFleetApiPlatform,
    private readonly accessory: PlatformAccessory
  ) {
    if (!this.platform.TeslaFleetApi?.vehicle) {
      throw new Error("TeslaFleetApi not initialized");
    }

    this.vehicle = this.platform.TeslaFleetApi.vehicle.specific(
      this.accessory.context.vin
    );

    this.information = this.accessory.getService(
      this.platform.Service.AccessoryInformation
    )!;

    this.information
      .setCharacteristic(this.platform.Characteristic.Manufacturer, "Tesla")
      .setCharacteristic(this.platform.Characteristic.Model, this.vehicle.model)
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        this.vehicle.vin
      );

    this.refresh();
    setInterval(() => this.refresh(), REFRESH_INTERVAL);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb.

    new BatteryService(this.platform, this.accessory, this.vehicle);
  }

  async refresh() {
    this.vehicle
      .vehicle_data([
        "charge_state",
        "climate_state",
        "drive_state",
        "location_data",
        "vehicle_state",
      ])
      .then(({ charge_state, climate_state, drive_state, vehicle_state }) => {
        this.accessory.context.data = {
          charge_state,
          climate_state,
          drive_state,
          vehicle_state,
        };
        this.information.updateCharacteristic(
          this.platform.Characteristic.Active,
          true
        );
      })
      .catch((error: string) => {
        this.platform.log.warn(error);
        this.information.updateCharacteristic(
          this.platform.Characteristic.Active,
          false
        );
      });
  }
}
