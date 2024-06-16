import { CharacteristicValue } from "homebridge";
import { debounce } from "../utils/debounce.js";
import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class ChargeCurrentService extends BaseService {
  constructor(parent: VehicleAccessory) {
    super(parent, parent.platform.Service.Lightbulb, "charge current", "charge_current");

    const on = this.service
      .getCharacteristic(this.parent.platform.Characteristic.On)
      .onGet(this.getOn.bind(this));

    const level = this.service
      .getCharacteristic(this.parent.platform.Characteristic.Brightness)
      .onGet(this.getLevel.bind(this))
      .onSet(debounce(this.setLevel.bind(this), 3000));

    this.parent.emitter.on("vehicle_data", () => {
      on.updateValue(this.getOn());
      level.updateValue(this.getLevel());
    });
  }

  getOn(): boolean {
    return !!this.parent.accessory.context?.charge_state;
  }

  getLevel(): number {
    return this.parent.accessory.context?.charge_state?.charge_current_request ?? 16;
  }

  setLevel(value: CharacteristicValue): Promise<number> {
    const min = 2;
    const max = this.parent.accessory.context.charge_state.charge_current_request_max ?? 32;
    value = Math.max(min, Math.min(max, value as number));
    return this.parent.vehicle.set_charge_limit(value).then(() => value);
  }
}
