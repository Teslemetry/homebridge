import { Characteristic, CharacteristicValue } from "homebridge";
import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class ChargePortService extends BaseService {
  constructor(parent: VehicleAccessory) {
    super(parent, parent.platform.Service.LockMechanism, "Charge Port", "charge_port");

    const currentState = this.service
      .getCharacteristic(this.parent.platform.Characteristic.LockCurrentState);
    //.onGet(this.getState.bind(this));

    const targetState = this.service
      .getCharacteristic(this.parent.platform.Characteristic.LockTargetState)
      //.onGet(this.getState.bind(this))
      .onSet((value) => this.setState(value, targetState));

    this.parent.emitter.on("vehicle_data", (data) => {
      const state = (data.charge_state.charge_port_latch === "Engaged") ?
        this.platform.Characteristic.LockTargetState.SECURED :
        this.platform.Characteristic.LockTargetState.UNSECURED;
      currentState.updateValue(state);
      targetState.updateValue(state);
    });
  }

  async setState(value: CharacteristicValue, characteristic: Characteristic): Promise<void> {
    await this.vehicle.wake_up().then(() =>
      value === this.parent.platform.Characteristic.LockTargetState.SECURED ?
        this.vehicle.charge_port_door_close()
          .then(() =>
            characteristic.updateValue(this.parent.platform.Characteristic.LockTargetState.SECURED)
          ) :
        this.vehicle.charge_port_door_open()
          .then(() =>
            characteristic.updateValue(this.parent.platform.Characteristic.LockTargetState.UNSECURED)
          )
    );
  }
}
