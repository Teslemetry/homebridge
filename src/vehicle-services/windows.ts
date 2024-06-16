// https://developers.homebridge.io/#/service/Window

import { Characteristic, CharacteristicValue } from "homebridge";
import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class WindowService extends BaseService {
  constructor(parent: VehicleAccessory) {
    super(parent, parent.platform.Service.Window, "Vent Windows", "vent_windows");

    const currentPosition = this.service
      .getCharacteristic(this.parent.platform.Characteristic.CurrentPosition);
    //.onGet(this.getPosition.bind(this));

    /*const positionState = this.service
      .getCharacteristic(this.parent.platform.Characteristic.PositionState)
      .onGet(() => this.getChargingState());*/

    const targetPosition = this.service
      .getCharacteristic(this.parent.platform.Characteristic.TargetPosition)
      //.onGet(this.getPosition.bind(this))
      .onSet((value) => this.setPosition(value, targetPosition));

    this.parent.emitter.on("vehicle_data", (data) => {
      const position = data.vehicle_state.fd_window * 25 +
        data.vehicle_state.fp_window * 25 +
        data.vehicle_state.rd_window * 25 +
        data.vehicle_state.rp_window * 25;
      currentPosition.updateValue(position);
      targetPosition.updateValue(position);
    });
  }

  async setPosition(value: CharacteristicValue, characteristic: Characteristic): Promise<void> {
    value = Math.round(value as number / 100) * 100;
    this.log.debug("Setting windows to", value);
    const { latitude, longitude } =
      this.parent.accessory.context?.drive_state ?? {};

    await this.parent.vehicle.wake_up()
      .then(() => this.parent.vehicle.window_control(value === 100 ? "vent" : "close", latitude, longitude))
      .then(() => characteristic.updateValue(value));
  }
}
