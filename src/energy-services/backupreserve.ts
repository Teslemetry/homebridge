import { EnergyAccessory } from "../energy.js";
import { debounce } from "../utils/debounce.js";
import { BaseService } from "./base.js";

export class BackupReserve extends BaseService {
  constructor(parent: EnergyAccessory) {
    super(parent, parent.platform.Service.Switch, "Backup Reserve", "backup_reserve");

    const on = this.service
      .getCharacteristic(this.parent.platform.Characteristic.On);

    const level = this.service
      .getCharacteristic(this.parent.platform.Characteristic.Brightness)
      .onSet(
        debounce((value) => this.energy.backup(value)
          .then(() => level.updateValue(value))
          .catch((e) => this.log.error(`${this.name} vehicle backup failed: ${e}`)),
          3000));

    this.parent.emitter.on("site_info", (data) => {
      on.updateValue(data.backup_reserve_percent > 0);
      level.updateValue(data.backup_reserve_percent);
    });
  }
}
