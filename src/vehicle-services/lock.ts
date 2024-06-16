import { Characteristic, CharacteristicValue } from "homebridge";
import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class LockService extends BaseService {
  constructor(parent: VehicleAccessory) {
    super(parent, parent.platform.Service.LockMechanism, "Lock", "lock");

    const currentState = this.service
      .getCharacteristic(this.parent.platform.Characteristic.LockCurrentState);
    //.onGet(this.getState.bind(this));

    const targetState = this.service
      .getCharacteristic(this.parent.platform.Characteristic.LockTargetState)
      //.onGet(this.getState.bind(this))
      .onSet((value) => this.setState(value, targetState));

    this.parent.emitter.on("vehicle_data", (data) => {
      currentState.updateValue(data.vehicle_state.locked ?
        this.platform.Characteristic.LockTargetState.SECURED :
        this.platform.Characteristic.LockTargetState.UNSECURED);
    });
  }

  async setState(value: CharacteristicValue, characteristic: Characteristic): Promise<void> {
    const open = value === this.parent.platform.Characteristic.LockTargetState.UNSECURED;

    await this.parent.wake_up().then(() =>
      open ?
        this.parent.vehicle.door_lock()
          .then(() => characteristic.updateValue(this.parent.platform.Characteristic.LockTargetState.SECURED)) :
        this.parent.vehicle.door_unlock()
          .then(() => characteristic.updateValue(this.parent.platform.Characteristic.LockTargetState.UNSECURED))
    );
  }
}
