import { Service } from "homebridge";
import { VehicleAccessory } from "../vehicle.js";

export abstract class BaseService {
  protected service: Service;

  constructor(
    protected parent: VehicleAccessory,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    definition: any,
    name: string | undefined = undefined
  ) {
    this.service =
      this.parent.accessory.getService(definition) ||
      this.parent.accessory.addService(definition);

    if (name) {
      this.service.setCharacteristic(
        this.parent.platform.Characteristic.Name,
        `${this.parent.accessory.displayName} ${name}`
      );
    }
  }
}
