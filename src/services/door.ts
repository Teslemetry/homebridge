import { CharacteristicValue, Service } from "homebridge";
import { VehicleAccessory } from "../vehicle.js";

export class DoorService {
  service: Service;
  key: "ft" | "rt";

  constructor(
    private parent: VehicleAccessory,
    private trunk: "front" | "rear"
  ) {
    this.service =
      this.parent.accessory.getService(this.parent.platform.Service.Door) ||
      this.parent.accessory.addService(this.parent.platform.Service.Door);

    this.key = this.trunk === "front" ? "ft" : "rt";

    const currentPosition = this.service
      .getCharacteristic(this.parent.platform.Characteristic.CurrentPosition)
      .onGet(this.getPosition);

    /*const positionState = this.service
      .getCharacteristic(this.parent.platform.Characteristic.PositionState)
      .onGet(() => this.getChargingState());*/

    const targetPosition = this.service
      .getCharacteristic(this.parent.platform.Characteristic.TargetPosition)
      .onGet(this.getPosition)
      .onSet(this.setPosition);

    this.parent.emitter.on("vehicle_data", () => {
      currentPosition.updateValue(this.getPosition());
      targetPosition.updateValue(this.getPosition());
    });
  }

  getPosition(): number {
    return this.parent.accessory.context?.vehicle_state?.[this.key] ? 100 : 0;
  }

  async setPosition(value: CharacteristicValue) {
    console.log(value);
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
