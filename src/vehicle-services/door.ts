//https://developers.homebridge.io/#/service/Door

import { Characteristic, CharacteristicValue } from "homebridge";
import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class DoorService extends BaseService {
  key: "ft" | "rt";
  open: boolean = false;

  constructor(parent: VehicleAccessory, private trunk: "front" | "rear") {
    super(
      parent,
      parent.platform.Service.Door,
      trunk === "front" ? "Frunk" : "Trunk",
      trunk
    );

    this.key = this.trunk === "front" ? "ft" : "rt";

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
      this.open = data.vehicle_state[this.key] === 1;
      const position = this.open ? 100 : 0;
      currentPosition.updateValue(position);
      targetPosition.updateValue(position);
    });
  }

  async setPosition(value: CharacteristicValue, characteristic: Characteristic): Promise<void> {
    value = value as number;
    if (
      (!this.open && value > 50) ||
      (this.open && value < 50 && this.trunk === "rear")
    ) {
      this.parent.wakeUpAndWait()
        .then(() => this.parent.vehicle.actuate_truck(this.trunk))
        .then(() => characteristic.updateValue(value));
    }
  }
}
