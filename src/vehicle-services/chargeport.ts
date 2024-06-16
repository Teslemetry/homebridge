import { CharacteristicValue } from "homebridge";
import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class ChargePortService extends BaseService {
  constructor(parent: VehicleAccessory) {
    super(parent, parent.platform.Service.LockMechanism, "charge port", "charge_port");

    const currentState = this.service
      .getCharacteristic(this.parent.platform.Characteristic.LockCurrentState)
      .onGet(this.getState.bind(this));

    this.service
      .getCharacteristic(this.parent.platform.Characteristic.LockTargetState)
      .onGet(this.getState.bind(this))
      .onSet(this.setState.bind(this));

    this.parent.emitter.on("vehicle_data", () => {
      currentState.updateValue(this.getState());
    });
  }

  getState(): number {
    return this.parent.accessory.context?.charge_state?.charge_port_latch ?
      this.parent.platform.Characteristic.LockTargetState.SECURED :
      this.parent.platform.Characteristic.LockTargetState.UNSECURED;
  }

  setState(value: CharacteristicValue): Promise<number> {
    const open = value === this.parent.platform.Characteristic.LockTargetState.UNSECURED;

    if (open) {
      return this.parent.vehicle.charge_port_door_open().then(() =>
        this.parent.platform.Characteristic.LockTargetState.SECURED
      );
    }
    return this.parent.vehicle.charge_port_door_close().then(() =>
      this.parent.platform.Characteristic.LockTargetState.UNSECURED
    );
  }
}
