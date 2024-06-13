// https://developers.homebridge.io/#/service/AccessoryInformation

import { CharacteristicValue, Service } from "homebridge";
import { VehicleAccessory } from "../vehicle.js";

export class AccessoryInformationService {
  service: Service;

  constructor(private parent: VehicleAccessory) {
    this.service =
      this.parent.accessory.getService(
        this.parent.platform.Service.AccessoryInformation
      ) ||
      this.parent.accessory.addService(
        this.parent.platform.Service.AccessoryInformation
      );

    this.service // Move this to a separate service
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
      .onGet(this.getVersion);

    this.service
      .getCharacteristic(this.parent.platform.Characteristic.Identify)
      .onSet(this.setIdentify);

    this.parent.emitter.on("vehicle_data", () => {
      version.updateValue(this.getVersion());
    });
  }

  getVersion(): string {
    return (
      this.parent.accessory.context?.vehicle_state?.software_update?.version ??
      "unknown"
    );
  }

  async setIdentify(value: CharacteristicValue) {
    console.log(value);
    return this.parent
      .wake_up()
      .then(() => this.parent.vehicle.flash_lights())
      .then(() => false);
  }
}
