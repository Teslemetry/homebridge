import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class LockService extends BaseService {
  constructor(parent: VehicleAccessory) {
    super(parent, parent.platform.Service.LockMechanism, "Lock", "lock");

    const currentState = this.service.getCharacteristic(
      this.parent.platform.Characteristic.LockCurrentState,
    );

    const targetState = this.service
      .getCharacteristic(this.parent.platform.Characteristic.LockTargetState)
      .onSet(async (value) => {
        this.service.setCharacteristic(
          this.parent.platform.Characteristic.LockTargetState,
          value,
        );
        targetState.updateValue(value);
        await this.parent.wakeUpAndWait().then(() =>
          value
            ? this.parent.vehicle
              .door_lock()
            //.then(() => wait())
              .then(() => currentState.updateValue(value))
              .catch((e) =>
                this.log.error(`${this.name} vehicle door_lock failed: ${e}`),
              )
            : this.parent.vehicle
              .door_unlock()
            //.then(() => wait())
              .then(() => currentState.updateValue(value))
              .catch((e) =>
                this.log.error(
                  `${this.name} vehicle door_unlock failed: ${e}`,
                ),
              ),
        );
      });

    this.parent.emitter.on("vehicle_data", (data) => {
      const state = data.vehicle_state.locked ? 1 : 0;
      currentState.updateValue(state);
      targetState.updateValue(state);
    });
  }
}
