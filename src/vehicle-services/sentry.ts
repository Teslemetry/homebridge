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
        const disarmed = this.parent.platform.hap.Characteristic.SecuritySystemTargetState.DISARM;
        value = value === disarmed ? disarmed : this.parent.platform.hap.Characteristic.SecuritySystemTargetState.STAY_ARM;
        target.updateValue(value);
        await this.parent.wakeUpAndWait()
          .then(() => this.vehicle.set_sentry_mode(value !== disarmed))
          .then(() => current.updateValue(value))
          .catch((e) => this.log.error(`${this.name} vehicle set_sentry_mode failed: ${e}`));
      });

    this.parent.emitter.on("vehicle_data", (data) => {
      const value = data.vehicle_state.sentry_mode
        ? this.parent.platform.hap.Characteristic.SecuritySystemCurrentState.STAY_ARM
        : this.parent.platform.hap.Characteristic.SecuritySystemCurrentState.DISARMED;
      current.updateValue(value);
      target.updateValue(value);
    });
  }
}
