import { EnergyAccessory } from "../energy.js";
import { BaseService } from "./base.js";

export class ExportBattery extends BaseService {
  constructor(parent: EnergyAccessory) {
    super(parent, parent.platform.Service.Switch, "Export To Grid", "export_to_grid");

    const on = this.service
      .getCharacteristic(this.parent.platform.Characteristic.On)
      .onSet(async (value) => {
        await this.energy.grid_import_export(null, value ? "battery_ok" : "pv_only").then(() => on.updateValue(value));
      });

    this.parent.emitter.on("site_info", (data) => {
      on.updateValue(data.components.customer_preferred_export_rule === "battery_ok");
    });
  }
}
