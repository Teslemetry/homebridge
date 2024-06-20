import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class DefrostService extends BaseService {
  constructor(parent: VehicleAccessory) {
    super(parent, parent.platform.Service.Switch, "Defrost", "defrost");

    const on = this.service
      .getCharacteristic(this.parent.platform.Characteristic.On)
      .onSet(async (value) => {
        await this.parent.wakeUpAndWait()
          .then(() => this.vehicle.set_preconditioning_max(value as boolean, false))
          .then(() => on.updateValue(value));
      });

    this.parent.emitter.on("vehicle_data", (data) => {
      on.updateValue(data.climate_state.defrost_mode > 0);
    });
  }
}
