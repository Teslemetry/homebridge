import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class HomelinkService extends BaseService {
  constructor(parent: VehicleAccessory) {
    super(parent, parent.platform.Service.GarageDoorOpener, "Homelink", "homelink");

    const current = this.service
      .getCharacteristic(this.platform.Characteristic.CurrentDoorState)
      .updateValue(this.platform.Characteristic.CurrentDoorState.CLOSED);

    const target = this.service
      .getCharacteristic(this.platform.Characteristic.TargetDoorState)
      .onSet(async (value) => {
        if (value) {
          target.updateValue(value);
          await this.parent.wakeUpAndWait()
            .then(() => this.vehicle.trigger_homelink(this.platform.config.latitude, this.platform.config.longitude))
            .then(() => {
              current.updateValue(false);
              target.updateValue(false);
            });
        }
      })
      .updateValue(this.platform.Characteristic.TargetDoorState.CLOSED);

  }
}
