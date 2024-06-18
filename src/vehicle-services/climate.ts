// https://developers.homebridge.io/#/service/Thermostat

import { CharacteristicValue } from "homebridge";
import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class ClimateService extends BaseService {
  displayUnits: number = 0; // Celsius by default
  assumedState: number = 0;

  constructor(parent: VehicleAccessory) {
    super(parent, parent.platform.Service.Thermostat, "Climate", "climate");

    const currentState = this.service
      .getCharacteristic(
        this.parent.platform.Characteristic.CurrentHeatingCoolingState
      );

    const targetState = this.service
      .getCharacteristic(
        this.parent.platform.Characteristic.TargetHeatingCoolingState
      )
      .onSet(async (value) => {
        targetState.updateValue(value ?
          this.parent.platform.Characteristic.TargetHeatingCoolingState.AUTO :
          this.parent.platform.Characteristic.TargetHeatingCoolingState.OFF
        );
        await this.parent.wakeUpAndWait()
          .then(() => value
            ? this.vehicle.auto_conditioning_start().then(
              () => currentState.updateValue(this.assumedState)
            )
            : this.vehicle.auto_conditioning_stop().then(
              () => currentState.updateValue(this.parent.platform.Characteristic.CurrentHeatingCoolingState.OFF)
            ));
      });

    const currentTemp = this.service
      .getCharacteristic(this.parent.platform.Characteristic.CurrentTemperature);

    const targetTemp = this.service
      .getCharacteristic(this.parent.platform.Characteristic.TargetTemperature)
      .onSet(async (value) => {
        await this.parent.wakeUpAndWait()
          .then(() => this.vehicle.set_temps(value as number, value as number))
          .then(() => targetTemp.updateValue(value));
      });

    this.service
      .getCharacteristic(this.parent.platform.Characteristic.TemperatureDisplayUnits)
      .onSet((value: CharacteristicValue) => {
        this.displayUnits = value as number;
      });

    this.parent.emitter.on("vehicle_data", (data) => {
      this.assumedState = data.climate_state.inside_temp < data.climate_state.driver_temp_setting
        ? this.platform.Characteristic.CurrentHeatingCoolingState.HEAT
        : this.platform.Characteristic.CurrentHeatingCoolingState.COOL;

      if (data.climate_state.is_climate_on) {
        // On
        currentState.updateValue(this.assumedState);
        targetState.updateValue(this.platform.Characteristic.TargetHeatingCoolingState.AUTO);
      } else {
        // Off
        currentState.updateValue(this.platform.Characteristic.CurrentHeatingCoolingState.OFF);
        targetState.updateValue(this.platform.Characteristic.TargetHeatingCoolingState.OFF);
      }

      currentTemp.updateValue(data.climate_state.inside_temp);
      targetTemp.updateValue(data.climate_state.driver_temp_setting);
    });
  }
}
