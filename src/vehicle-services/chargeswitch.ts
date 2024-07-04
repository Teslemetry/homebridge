import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class ChargeSwitchService extends BaseService {
  constructor(parent: VehicleAccessory) {
    super(parent, parent.platform.Service.Switch, "Charge", "charge");

    const on = this.service
      .getCharacteristic(this.parent.platform.Characteristic.On)
      .onSet(async (value) => {
        this.parent.wakeUpAndWait()
          .then(() => value ? this.parent.vehicle.charge_start() : this.parent.vehicle.charge_stop())
          .then(() => on.updateValue(value));
      });

    this.parent.emitter.on("vehicle_data", (data) => {
      on.updateValue(data.charge_state?.user_charge_enable_request ?? data.charge_state?.charge_enable_request);
    });
  }
}
