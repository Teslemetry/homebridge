// https://developers.homebridge.io/#/service/AccessoryInformation

import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class AccessoryInformationService extends BaseService {
  constructor(parent: VehicleAccessory) {
    super(parent, parent.platform.Service.AccessoryInformation);

    this.service
      .setCharacteristic(
        this.parent.platform.Characteristic.Manufacturer,
        "Tesla"
      )
      .setCharacteristic(
        this.parent.platform.Characteristic.Model,
        this.parent.vehicle.model
      )
      .setCharacteristic(
        this.parent.platform.Characteristic.SerialNumber,
        this.parent.vehicle.vin
      );

    const version = this.service
      .getCharacteristic(this.parent.platform.Characteristic.FirmwareRevision)
      .onGet(this.getVersion.bind(this));

    this.service
      .getCharacteristic(this.parent.platform.Characteristic.Identify)
      .onSet(this.setIdentify.bind(this));

    this.parent.emitter.on("vehicle_data", () => {
      version.updateValue(this.getVersion());
    });
  }

  getVersion(): string {
    return (
      this.parent.accessory.context?.vehicle_state?.car_version ?? "unknown"
    );
  }

  async setIdentify(): Promise<void> {
    await this.parent.wake_up().then(() => this.parent.vehicle.flash_lights());
  }
}
