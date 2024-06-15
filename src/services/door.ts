//https://developers.homebridge.io/#/service/Door

import { CharacteristicValue } from "homebridge";
import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class DoorService extends BaseService {
  key: "ft" | "rt";

  constructor(parent: VehicleAccessory, private trunk: "front" | "rear") {
    super(
      parent,
      parent.platform.Service.Door,
      trunk === "front" ? "Frunk" : "Trunk",
      trunk
    );

    this.key = this.trunk === "front" ? "ft" : "rt";

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
    return this.parent.accessory.context?.vehicle_state?.[this.key] ? 100 : 0;
  }

  async setPosition(value: CharacteristicValue) {
    const position = this.getPosition();
    if (
      (position === 0 && value === 100) ||
      (position === 100 && value === 0 && this.trunk === "rear")
    ) {
      return this.parent.vehicle.actuate_truck(this.trunk).then(() => value);
    }
    return position;
  }
}
