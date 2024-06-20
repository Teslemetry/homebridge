import { VehicleAccessory } from "../vehicle.js";
import { BaseService } from "./base.js";

export class WakeService extends BaseService {
  constructor(parent: VehicleAccessory) {
    super(parent, parent.platform.Service.Switch, "Awake", "wake");

    const on = this.service
      .getCharacteristic(this.parent.platform.Characteristic.On)
      .onSet(async (value) => {
        if (value) {
          await this.parent.wakeUpAndWait().then(() => on.updateValue(true));
        }
      });

    this.parent.emitter.on("vehicle_data", (data) => {
      on.updateValue(data.state === "online");
    });
  }
}
