import { Service } from "homebridge";
import { VehicleAccessory } from "../vehicle.js";

export class BatteryService {
  service: Service;

  constructor(private parent: VehicleAccessory) {
    this.service =
      this.parent.accessory.getService(this.parent.platform.Service.Battery) ||
      this.parent.accessory.addService(this.parent.platform.Service.Battery);

    const batteryLevel = this.service
      .getCharacteristic(this.parent.platform.Characteristic.BatteryLevel)
      .onGet(this.getLevel);

    const chargingState = this.service
      .getCharacteristic(this.parent.platform.Characteristic.ChargingState)
      .onGet(this.getChargingState);

    const lowBattery = this.service
      .getCharacteristic(this.parent.platform.Characteristic.StatusLowBattery)
      .onGet(this.getLowBattery);

    this.parent.emitter.on("vehicle_data", () => {
      batteryLevel.updateValue(this.getLevel());
      chargingState.updateValue(this.getChargingState());
      lowBattery.updateValue(this.getLowBattery());
    });
  }

  getLevel(): number {
    return this.parent.accessory.context?.charge_state?.battery_level ?? 50;
  }

  getChargingState(): number {
    switch (this.parent.accessory.context?.charge_state?.charging_state) {
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

  getLowBattery(): boolean {
    return this.getLevel() <= 20;
  }
}
