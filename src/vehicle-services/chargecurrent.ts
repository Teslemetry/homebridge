import { Characteristic, CharacteristicValue } from "homebridge";
import { debounce } from "../utils/debounce.js";
import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class ChargeCurrentService extends BaseService {

  min: number = 2;
  max: number = 16;

  constructor(parent: VehicleAccessory) {
    super(parent, parent.platform.Service.Lightbulb, "Charge Current", "charge_current");

    const on = this.service
      .getCharacteristic(this.parent.platform.Characteristic.On);
    //.onGet(this.getOn.bind(this));

    const level = this.service
      .getCharacteristic(this.parent.platform.Characteristic.Brightness)
      //.onGet(this.getLevel.bind(this))
      .onSet(debounce((value) => this.setLevel(value, level), 3000));

    this.parent.emitter.on("vehicle_data", (data) => {
      on.updateValue(true);
      this.max = data.charge_state.charge_current_request_max;
      level.updateValue(data.charge_state.charge_current_request);
    });
  }

  async setLevel(value: CharacteristicValue, characteristic: Characteristic): Promise<void> {
    value = Math.max(this.min, Math.min(this.max, value as number));

    await this.parent.vehicle.wake_up()
      .then(() => this.parent.vehicle.set_charging_amps(value))
      .then(() => characteristic.updateValue(value));
  }
}
