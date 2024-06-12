import { PlatformAccessory, Service } from "homebridge";
import { VehicleSpecific } from "tesla-fleet-api";
import { TeslaFleetApiPlatform } from "../platform.js";

export class BatteryService {
  service: Service;

  constructor(
    private platform: TeslaFleetApiPlatform,
    private accessory: PlatformAccessory,
    private vehicle: VehicleSpecific
  ) {
    this.service =
      this.accessory.getService(this.platform.Service.BatteryService) ||
      this.accessory.addService(this.platform.Service.BatteryService);

    const batteryLevel = this.service
      .getCharacteristic(this.platform.Characteristic.BatteryLevel)
      .onGet(this.getLevel.bind(this));

    const chargingState = this.service
      .getCharacteristic(this.platform.Characteristic.ChargingState)
      .onGet(this.getChargingState.bind(this));

    const lowBattery = this.service
      .getCharacteristic(this.platform.Characteristic.StatusLowBattery)
      .onGet(this.getLowBattery.bind(this));

    /*tesla.on("vehicleDataUpdated", (data) => {
      batteryLevel.updateValue(this.getLevel(data));
      chargingState.updateValue(this.getChargingState(data));
      lowBattery.updateValue(this.getLowBattery(data));
    });*/
  }

  getLevel(): number {
    // Assume 50% when not connected and no last-known state.
    return this.accessory.context?.charge_state?.battery_level ?? 0;
  }

  getChargingState(): number {
    return this.accessory.context?.charge_state?.charging_state === "Charging"
      ? this.platform.Characteristic.ChargingState.CHARGING
      : this.platform.Characteristic.ChargingState.NOT_CHARGING;
  }

  getLowBattery(): boolean {
    return this.accessory.context?.charge_state?.battery_level
      ? this.accessory.context.charge_state.battery_level <= 20
      : false;
  }
}
