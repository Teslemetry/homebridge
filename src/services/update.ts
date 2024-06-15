// https://developers.homebridge.io/#/service/FirmwareUpdate

import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class UpdateService extends BaseService {
  constructor(parent: VehicleAccessory) {
    super(parent, parent.platform.Service.FirmwareUpdate, "Update", "update");

    const readiness = this.service
      .getCharacteristic(
        this.parent.platform.Characteristic.FirmwareUpdateReadiness
      )
      .onGet(this.getReadiness.bind(this));

    const status = this.service
      .getCharacteristic(
        this.parent.platform.Characteristic.FirmwareUpdateStatus
      )
      .onGet(this.getStatus.bind(this));

    const staged = this.service
      .getCharacteristic(
        this.parent.platform.Characteristic.StagedFirmwareVersion
      )
      .onGet(this.getStaged.bind(this));

    this.parent.emitter.on("vehicle_data", () => {
      readiness.updateValue(this.getReadiness());
      status.updateValue(this.getStatus());
      staged.updateValue(this.getStaged());
    });
  }

  getReadiness(): boolean {
    return (
      this.parent.accessory?.context?.vehicle_state?.software_update?.status ===
      "downloaded"
    );
  }

  getStatus(): string {
    return (
      this.parent.accessory?.context?.vehicle_state?.software_update?.status ||
      "No update"
    );
  }

  getStaged(): string {
    return this.parent.accessory?.context?.vehicle_state?.software_update
      ?.version;
  }
}
