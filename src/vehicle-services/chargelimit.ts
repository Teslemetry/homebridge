import { Characteristic, CharacteristicValue } from "homebridge";
import { debounce } from "../utils/debounce.js";
import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class ChargeLimitService extends BaseService {

  min: number = 50;
  max: number = 100;

  constructor(parent: VehicleAccessory) {
    super(parent, parent.platform.Service.Lightbulb, "Charge Limit", "charge_limit");

    const on = this.service
      .getCharacteristic(this.parent.platform.Characteristic.On);
    //.onGet(this.getOn.bind(this));

    const level = this.service
      .getCharacteristic(this.parent.platform.Characteristic.Brightness)
      //.onGet(this.getLevel.bind(this))
      .onSet(debounce((value) => this.setLevel(value, level), 3000));

    this.parent.emitter.on("vehicle_data", (data) => {
      this.min = data.charge_state.charge_limit_soc_min ?? this.min;
      this.max = data.charge_state.charge_limit_soc_max ?? this.max;
      on.updateValue(true);
      level.updateValue(data.charge_state.charge_limit_soc);
    });
  }

  async setLevel(value: CharacteristicValue, characteristic: Characteristic): Promise<void> {
    value = Math.max(this.min, Math.min(this.max, value as number));
    await this.parent.wakeUpAndWait()
      .then(() => this.vehicle.set_charge_limit(value))
      .then(() => characteristic.updateValue(value));
  }
}
