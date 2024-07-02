import { EnergyAccessory } from "../energy.js";
import { BaseService } from "./base.js";

export class BatteryService extends BaseService {
  constructor(parent: EnergyAccessory) {
    super(parent, parent.platform.Service.Battery, "Battery", "battery");

    const batteryLevel = this.service
      .getCharacteristic(this.parent.platform.Characteristic.BatteryLevel);

    const chargingState = this.service
      .getCharacteristic(this.parent.platform.Characteristic.ChargingState);

    const lowBattery = this.service
      .getCharacteristic(this.parent.platform.Characteristic.StatusLowBattery);

    this.parent.emitter.on("live_status", (data) => {
      batteryLevel.updateValue(this.getLevel(data));
      chargingState.updateValue(this.getChargingState(data));
      lowBattery.updateValue(this.getLowBattery(data));
    });
  }

  getLevel(data): number {
    return data.charge_state?.battery_level ?? 50;
  }

  getChargingState(data): number {
    switch (data.charge_state?.charging_state) {
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

  getLowBattery(data): boolean {
    return this.getLevel(data) <= 20;
  }
}
