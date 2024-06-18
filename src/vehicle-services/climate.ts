// https://developers.homebridge.io/#/service/Thermostat

import { Characteristic, CharacteristicValue } from "homebridge";
import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class ClimateService extends BaseService {
  displayUnits: number = 0; // Celsius by default
  constructor(parent: VehicleAccessory) {
    super(parent, parent.platform.Service.Thermostat, "Climate", "climate");

    const currentState = this.service
      .getCharacteristic(
        this.parent.platform.Characteristic.CurrentHeatingCoolingState
      );
    //.onGet(this.getCurrentState.bind(this));

    const targetState = this.service
      .getCharacteristic(
        this.parent.platform.Characteristic.TargetHeatingCoolingState
      )
      //.onGet(this.getTargetState.bind(this))
      .onSet((value) => this.setTargetState(value, targetState));

    const currentTemp = this.service
      .getCharacteristic(this.parent.platform.Characteristic.CurrentTemperature);
    //.onGet(this.getCurrentTemp.bind(this));

    const targetTemp = this.service
      .getCharacteristic(this.parent.platform.Characteristic.TargetTemperature)
      //.onGet(this.getTargetTemp.bind(this))
      .onSet((value) => this.setTargetTemp(value, targetTemp));

    this.service
      .getCharacteristic(this.parent.platform.Characteristic.TemperatureDisplayUnits)
      //.onGet(() => this.displayUnits)
      .onSet((value: CharacteristicValue) => {
        this.displayUnits = value as number;
      });

    /*this.service.setCharacteristic(
      this.parent.platform.Characteristic.TemperatureDisplayUnits,
      this.parent.platform.Characteristic.TemperatureDisplayUnits.CELSIUS
    );*/

    this.parent.emitter.on("vehicle_data", (data) => {
      if (data.climate_state.is_climate_on === false) {
        // Off
        currentState.updateValue(this.platform.Characteristic.CurrentHeatingCoolingState.OFF);
        targetState.updateValue(this.platform.Characteristic.TargetHeatingCoolingState.OFF);
      } else {
        // On
        currentState.updateValue(data.climate_state.inside_temp < data.climate_state.driver_temp_setting
          ? this.platform.Characteristic.CurrentHeatingCoolingState.HEAT
          : this.platform.Characteristic.CurrentHeatingCoolingState.COOL
        );
        targetState.updateValue(this.platform.Characteristic.TargetHeatingCoolingState.AUTO);
      }

      currentTemp.updateValue(data.climate_state.inside_temp);
      targetTemp.updateValue(data.climate_state.driver_temp_setting);
    });
  }

  async setTargetState(value: CharacteristicValue, characteristic: Characteristic): Promise<void> {
    await this.parent.wakeUpAndWait()
      .then(() => value
        ? this.vehicle
          .auto_conditioning_start()
          .then(
            () =>
              characteristic.updateValue(this.parent.platform.Characteristic.TargetHeatingCoolingState.AUTO)
          )
        : this.vehicle
          .auto_conditioning_stop()
          .then(
            () =>
              characteristic.updateValue(this.parent.platform.Characteristic.TargetHeatingCoolingState.OFF)
          ));
  }

  async setTargetTemp(value: CharacteristicValue, characteristic: Characteristic): Promise<void> {
    await this.parent.wakeUpAndWait().then(() =>
      this.vehicle.set_temps(value as number, value as number)
        .then(() => characteristic.updateValue(value)));
  }
}
