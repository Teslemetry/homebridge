// https://developers.homebridge.io/#/service/Thermostat

import { CharacteristicValue } from "homebridge";
import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class ClimateService extends BaseService {
  constructor(parent: VehicleAccessory) {
    super(parent, parent.platform.Service.Thermostat, "Climate");

    const currentState = this.service
      .getCharacteristic(
        this.parent.platform.Characteristic.CurrentHeatingCoolingState
      )
      .onGet(this.getCurrentState.bind(this));

    const targetState = this.service
      .getCharacteristic(
        this.parent.platform.Characteristic.TargetHeatingCoolingState
      )
      .onGet(this.getTargetState.bind(this))
      .onSet(this.setTargetState.bind(this));

    const currentTemp = this.service
      .getCharacteristic(this.parent.platform.Characteristic.CurrentTemperature)
      .onGet(this.getCurrentTemp.bind(this));

    const targetTemp = this.service
      .getCharacteristic(this.parent.platform.Characteristic.TargetTemperature)
      .onGet(this.getTargetTemp.bind(this))
      .onSet(this.setTargetTemp.bind(this));

    this.service.setCharacteristic(
      this.parent.platform.Characteristic.TemperatureDisplayUnits,
      this.parent.platform.Characteristic.TemperatureDisplayUnits.CELSIUS
    );

    this.parent.emitter.on("vehicle_data", () => {
      currentState.updateValue(this.getCurrentState());
      targetState.updateValue(this.getTargetState());
      currentTemp.updateValue(this.getCurrentTemp());
      targetTemp.updateValue(this.getTargetTemp());
    });
  }

  getCurrentState(): number {
    if (!this.parent.accessory.context?.climate_state.is_climate_on) {
      return this.parent.platform.Characteristic.CurrentHeatingCoolingState.OFF;
    }
    if (this.getCurrentTemp() < this.getTargetTemp()) {
      return this.parent.platform.Characteristic.CurrentHeatingCoolingState
        .HEAT;
    }
    return this.parent.platform.Characteristic.CurrentHeatingCoolingState.COOL;
  }

  getTargetState(): number {
    if (!this.parent.accessory.context?.climate_state.is_climate_on) {
      return this.parent.platform.Characteristic.TargetHeatingCoolingState.OFF;
    }
    return this.parent.platform.Characteristic.TargetHeatingCoolingState.AUTO;
  }

  async setTargetState(value: CharacteristicValue) {
    return value
      ? this.parent.vehicle
          .auto_conditioning_start()
          .then(
            () =>
              this.parent.platform.Characteristic.TargetHeatingCoolingState.AUTO
          )
      : this.parent.vehicle
          .auto_conditioning_stop()
          .then(
            () =>
              this.parent.platform.Characteristic.TargetHeatingCoolingState.OFF
          );
  }

  getCurrentTemp(): number {
    return this.parent.accessory.context?.climate_state?.inside_temp ?? 0;
  }

  getTargetTemp(): number {
    return (
      this.parent.accessory.context?.climate_state?.driver_temp_setting ?? 0
    );
  }

  async setTargetTemp(value: CharacteristicValue) {
    return this.parent.vehicle
      .set_temps(value as number, value as number)
      .then(() => value);
  }
}
