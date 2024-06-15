// https://developers.homebridge.io/#/service/Window

import { CharacteristicValue } from "homebridge";
import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class WindowService extends BaseService {
  constructor(parent: VehicleAccessory) {
    super(parent, parent.platform.Service.Window, "windows", "vent_windows");

    const currentPosition = this.service
      .getCharacteristic(this.parent.platform.Characteristic.CurrentPosition)
      .onGet(this.getPosition.bind(this));

    /*const positionState = this.service
      .getCharacteristic(this.parent.platform.Characteristic.PositionState)
      .onGet(() => this.getChargingState());*/

    const targetPosition = this.service
      .getCharacteristic(this.parent.platform.Characteristic.TargetPosition)
      .onGet(this.getPosition.bind(this))
      .onSet(this.setPosition.bind(this));

    this.parent.emitter.on("vehicle_data", () => {
      currentPosition.updateValue(this.getPosition());
      targetPosition.updateValue(this.getPosition());
    });
  }

  getPosition(): number {
    return this.parent.accessory.context?.vehicle_state?.fd_window |
      this.parent.accessory.context?.vehicle_state?.fp_window |
      this.parent.accessory.context?.vehicle_state?.rd_window |
      this.parent.accessory.context?.vehicle_state?.rp_window
      ? 100
      : 0;
  }

  async setPosition(value: CharacteristicValue) {
    const { latitude, longitude } =
      this.parent.accessory.context?.drive_state ?? {};

    return this.parent.vehicle
      .window_control(value === 100 ? "close" : "vent", latitude, longitude)
      .then(() => value);
  }
}
