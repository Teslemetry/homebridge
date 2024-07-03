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
      batteryLevel.updateValue(data.percentage_charged ?? 50);
      chargingState.updateValue((data.battery_power ?? 0) < 0 ? 1 : 0);
      lowBattery.updateValue((data.percentage_charged ?? 50) <= 20);
    });
  }
}
