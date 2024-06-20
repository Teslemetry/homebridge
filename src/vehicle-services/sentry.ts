import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class SentryService extends BaseService {
  constructor(parent: VehicleAccessory) {
    super(parent, parent.platform.Service.Switch, "Sentry", "sentry");

    const on = this.service
      .getCharacteristic(this.parent.platform.Characteristic.On)
      .onSet(async (value) => {
        await this.parent.wakeUpAndWait()
          .then(() => this.vehicle.set_sentry_mode(value as boolean))
          .then(() => on.updateValue(value));
      });

    this.parent.emitter.on("vehicle_data", (data) => {
      on.updateValue(data.vehicle_state.sentry_mode);
    });
  }
}
