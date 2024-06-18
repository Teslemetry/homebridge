import { Characteristic, CharacteristicValue } from "homebridge";
import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class ChargePortService extends BaseService {
  constructor(parent: VehicleAccessory) {
    super(parent, parent.platform.Service.LockMechanism, "Charge Port", "charge_port");

    const currentState = this.service
      .getCharacteristic(this.parent.platform.Characteristic.LockCurrentState);

    const targetState = this.service
      .getCharacteristic(this.parent.platform.Characteristic.LockTargetState)
      .onSet(async (value) => {
        targetState.updateValue(value);
        await this.parent.wakeUpAndWait().then(() =>
          value === 1 ?
            this.vehicle.charge_port_door_close()
              .then(() =>
                currentState.updateValue(1)
              ) :
            this.vehicle.charge_port_door_open()
              .then(() =>
                currentState.updateValue(0)
              )
        );
      });

    this.parent.emitter.on("vehicle_data", (data) => {
      const state = (data.charge_state.charge_port_latch === "Engaged") ? 1 : 0;
      currentState.updateValue(state);
      targetState.updateValue(state);
    });
  }
}
