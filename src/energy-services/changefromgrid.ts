import { EnergyAccessory } from "../energy.js";
import { BaseService } from "./base.js";

export class ChargeFromGrid extends BaseService {
  constructor(parent: EnergyAccessory) {
    super(parent, parent.platform.Service.Switch, "Charge From Grid", "charge_from_grid");

    const on = this.service
      .getCharacteristic(this.parent.platform.Characteristic.On)
      .onSet(async (value) => {
        if (typeof value === "boolean") {
          // This switch is the inverse of the API value
          await this.energy.grid_import_export(!value).then(() => on.updateValue(value));
        }
      });

    this.parent.emitter.on("site_info", (data) => {
      if (typeof data.components.disallow_charge_from_grid_with_solar_installed === "boolean") {
        on.updateValue(data.components.disallow_charge_from_grid_with_solar_installed);
      }
    });
  }
}
