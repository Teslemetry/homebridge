import { EnergyAccessory } from "../energy.js";
import { BaseService } from "./base.js";

export class StormWatch extends BaseService {
  constructor(parent: EnergyAccessory) {
    super(parent, parent.platform.Service.Switch, "Storm Watch", "storm_watch");

    const on = this.service
      .getCharacteristic(this.parent.platform.Characteristic.On)
      .onSet(async (value) => {
        await this.energy.storm_mode(!!value).then(() => on.updateValue(value));
      });

    this.parent.emitter.on("site_info", (data) => {
      on.updateValue(data.user_settings.storm_mode_enabled);
    });
  }
}
