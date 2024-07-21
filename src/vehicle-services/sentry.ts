import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class SentryService extends BaseService {
  constructor(parent: VehicleAccessory) {
    super(parent, parent.platform.Service.SecuritySystem, "Sentry", "sentry");

    const current = this.service
      .getCharacteristic(this.parent.platform.Characteristic.SecuritySystemCurrentState);

    const target = this.service
      .getCharacteristic(this.parent.platform.Characteristic.SecuritySystemTargetState)
      .onSet(async (value) => {
        value = value === 3 ? 3 : 1;
        target.updateValue(value);
        await this.parent.wakeUpAndWait()
          .then(() => this.vehicle.set_sentry_mode(value !== 3))
          .then(() => current.updateValue(value))
          .catch((e) => this.log.error(`${this.name} vehicle set_sentry_mode failed: ${e}`))
      });

    this.parent.emitter.on("vehicle_data", (data) => {
      const value = data.vehicle_state.sentry_mode ? 1 : 3;
      current.updateValue(value);
      target.updateValue(value);
    });
  }
}
