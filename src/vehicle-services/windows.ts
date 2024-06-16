// https://developers.homebridge.io/#/service/Window

import { CharacteristicValue } from "homebridge";
import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class WindowService extends BaseService {
  constructor(parent: VehicleAccessory) {
    super(parent, parent.platform.Service.Window, "vent windows", "vent_windows");

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
    if (!this.parent.accessory.context?.vehicle_state) {
      return 0;
    }
    return this.parent.accessory.context.vehicle_state.fd_window * 25 +
      this.parent.accessory.context.vehicle_state.fp_window * 25 +
      this.parent.accessory.context.vehicle_state.rd_window * 25 +
      this.parent.accessory.context.vehicle_state.rp_window * 25;
  }

  async setPosition(value: CharacteristicValue): Promise<void> {
    if (value === 100 || value === 0) {

      this.log.info("Setting windows to", value);
      const { latitude, longitude } =
        this.parent.accessory.context?.drive_state ?? {};

      await this.parent.vehicle
        .window_control(value === 100 ? "vent" : "close", latitude, longitude);
    }
  }
}
