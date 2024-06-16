import { Characteristic, CharacteristicValue } from "homebridge";
import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class ChargeSwitchService extends BaseService {
  constructor(parent: VehicleAccessory) {
    super(parent, parent.platform.Service.Switch, "Charge", "charge");

    const on = this.service
      .getCharacteristic(this.parent.platform.Characteristic.On)
      //.onGet(this.getOn.bind(this))
      .onSet((value) => this.setOn(value, on));

    this.parent.emitter.on("vehicle_data", (data) => {
      on.updateValue(data.charge_state?.user_charge_enable_request ?? data.charge_state?.charge_enable_request);
    });
  }

  getOn(): boolean {
    return !!(this.parent.accessory.context?.charge_state?.user_charge_enable_request
      ?? this.parent.accessory.context?.charge_state?.charge_enable_request);
  }

  async setOn(value: CharacteristicValue, characteristic: Characteristic): Promise<void> {
    await this.parent.wake_up().then(() =>
      value ? this.parent.vehicle.charge_start().then(() => characteristic.updateValue(value))
        : this.parent.vehicle.charge_stop().then(() => characteristic.updateValue(value))
    );
  }
}
