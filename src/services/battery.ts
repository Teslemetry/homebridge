import { Characteristic, Service } from "homebridge";
import { VehicleDataResponse } from "tesla-fleet-api/dist/types/vehicle_data.js";
import { VehicleAccessory } from "../vehicle.js";

export class BatteryService {
  service: Service;

  constructor(private parent: VehicleAccessory) {
    this.service =
      this.parent.accessory.getService(this.parent.platform.Service.Battery) ||
      this.parent.accessory.addService(this.parent.platform.Service.Battery);

    const batteryLevel = this.service
      .getCharacteristic(this.parent.platform.Characteristic.BatteryLevel)
      .onGet(() => this.getLevel(this.parent.accessory.context.data));

    const chargingState = this.service
      .getCharacteristic(this.parent.platform.Characteristic.ChargingState)
      .onGet(() => this.getChargingState(this.parent.accessory.context.data));

    const lowBattery = this.service
      .getCharacteristic(this.parent.platform.Characteristic.StatusLowBattery)
      .onGet(() => this.getLowBattery(this.parent.accessory.context.data));

    this.parent.emitter.on("vehicle_data", (data) => {
      batteryLevel.updateValue(this.getLevel(data));
      chargingState.updateValue(this.getChargingState(data));
      lowBattery.updateValue(this.getLowBattery(data));
    });
  }

  getLevel(data: VehicleDataResponse): number {
    return data?.charge_state?.battery_level ?? 50;
  }

  getChargingState(data: VehicleDataResponse): number {
    switch (data?.charge_state?.charging_state) {
      case "Starting":
        return this.parent.platform.Characteristic.ChargingState.CHARGING;
      case "Charging":
        return this.parent.platform.Characteristic.ChargingState.CHARGING;
      case "Disconnected":
        return this.parent.platform.Characteristic.ChargingState.NOT_CHARGEABLE;
      case "NoPower":
        return this.parent.platform.Characteristic.ChargingState.NOT_CHARGEABLE;
      default:
        return this.parent.platform.Characteristic.ChargingState.NOT_CHARGING;
    }
  }

  getLowBattery(data: VehicleDataResponse): boolean {
    return data?.charge_state?.battery_level
      ? data.charge_state.battery_level <= 20
      : false;
  }
}
