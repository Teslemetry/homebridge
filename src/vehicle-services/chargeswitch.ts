import { CharacteristicValue } from "homebridge";
import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class ChargeSwitchService extends BaseService {
  constructor(parent: VehicleAccessory) {
    super(parent, parent.platform.Service.Switch, "charge", "charge");

    const on = this.service
      .getCharacteristic(this.parent.platform.Characteristic.On)
      .onGet(this.getOn.bind(this))
      .onSet(this.setOn.bind(this));

    this.parent.emitter.on("vehicle_data", () => {
      on.updateValue(this.getOn());
    });
  }

  getOn(): boolean {
    return this.parent.accessory.context?.charge_state?.user_charge_enable_request
      ?? this.parent.accessory.context?.charge_state?.charge_enable_request;
  }

  setOn(value: CharacteristicValue): Promise<boolean> {
    return value ? this.parent.vehicle.charge_start().then(() => true) : this.parent.vehicle.charge_stop().then(() => false);
  }
}
