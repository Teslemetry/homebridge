import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class LockService extends BaseService {
  constructor(parent: VehicleAccessory) {
    super(parent, parent.platform.Service.LockMechanism, "Lock", "lock");

    const currentState = this.service
      .getCharacteristic(this.parent.platform.Characteristic.LockCurrentState);

    const targetState = this.service
      .getCharacteristic(this.parent.platform.Characteristic.LockTargetState)
      .onSet(async (value) => {
        targetState.updateValue(value);
        await this.parent.wakeUpAndWait().then(() =>
          value ?
            this.parent.vehicle.door_lock()
              .then(() => currentState.updateValue(1)) :
            this.parent.vehicle.door_unlock()
              .then(() => currentState.updateValue(0))
        );
      });

    this.parent.emitter.on("vehicle_data", (data) => {
      const state = data.vehicle_state.locked ? 1 : 0;
      currentState.updateValue(state);
      targetState.updateValue(state);
    });
  }
}