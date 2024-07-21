//https://developers.homebridge.io/#/service/Door

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

    /*const positionState = this.service
      .getCharacteristic(this.parent.platform.Characteristic.PositionState)
      .onGet(() => this.getChargingState());*/

    const targetPosition = this.service
      .getCharacteristic(this.parent.platform.Characteristic.TargetPosition)
      .onSet(async (value) => {
        targetPosition.updateValue(value);
        value = value as number;
        if (
          (!this.open && value > 50) ||
          (this.open && value < 50 && this.trunk === "rear")
        ) {
          await this.parent.wakeUpAndWait()
            .then(() => this.parent.vehicle.actuate_truck(this.trunk))
            .then(() => currentPosition.updateValue(value))
            .catch((e) => this.log.error(`${this.name} vehicle actuate_truck failed: ${e}`));
        }
      });

    this.parent.emitter.on("vehicle_data", (data) => {
      this.open = data.vehicle_state[this.key] === 1;
      const position = this.open ? 100 : 0;
      currentPosition.updateValue(position);
      targetPosition.updateValue(position);
    });
  }
}
