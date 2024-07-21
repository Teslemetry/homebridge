import { EnergyAccessory } from "../energy.js";
import { BaseService } from "./base.js";

export class Autonomous extends BaseService {
  constructor(parent: EnergyAccessory) {
    super(parent, parent.platform.Service.Switch, "Autonomous Mode", "autonomous");

    const on = this.service
      .getCharacteristic(this.parent.platform.Characteristic.On)
      .onSet(async (value) => {
        await this.energy.operation(value ? "autonomous" : "self_consumption")
          .then(() => on.updateValue(value))
          .catch((e) => this.log.error(`${this.name} energy operation failed: ${e}`));
      });

    this.parent.emitter.on("site_info", (data) => {
      on.updateValue(data.default_real_mode === "autonomous");
    });
  }
}
