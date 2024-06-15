import { Service } from "homebridge";
import { VehicleAccessory } from "../vehicle.js";

export abstract class BaseService {
  protected service: Service;

  constructor(
    protected parent: VehicleAccessory,
    definition: typeof Service,
    name: string,
    subtype: string,
  ) {
    this.service =
      this.parent.accessory.getService(`${this.parent.accessory.displayName} ${name}`) ||
      this.parent.accessory.addService(definition, `${this.parent.accessory.displayName} ${name}`, subtype);

    if (name) {
      this.service.setCharacteristic(
        this.parent.platform.Characteristic.Name,
        `${this.parent.accessory.displayName} ${name}`
      );
    }
  }
}
