import { Logging, PlatformAccessory, Service, WithUUID } from "homebridge";
import { VehicleSpecific } from "tesla-fleet-api";
import { TeslaFleetApiPlatform } from "../platform.js";
import { EventEmitter } from "../utils/event.js";
import { VehicleAccessory, VehicleContext, VehicleDataEvent } from "../vehicle.js";

export abstract class BaseService {
  protected service: Service;
  protected log: Logging;
  protected platform: TeslaFleetApiPlatform;
  protected accessory: PlatformAccessory<VehicleContext>;
  protected emitter: EventEmitter<VehicleDataEvent>;
  protected vehicle: VehicleSpecific;

  constructor(
    protected parent: VehicleAccessory,
    definition: WithUUID<typeof Service>,
    name: string,
    subtype: string,
  ) {
    this.log = parent.platform.log;
    this.platform = parent.platform;
    this.accessory = parent.accessory;
    this.emitter = parent.emitter;
    this.vehicle = parent.vehicle;

    name = `${this.parent.accessory.displayName} ${name}`;

    if (this.parent.accessory.getServiceById(definition, subtype)) {
      this.log.info(`Restoring ${this.accessory.displayName} service ${name}`);
    } else {
      this.log.info(`Creating ${this.accessory.displayName} service ${name}`);
    }

    this.service =
      this.parent.accessory.getServiceById(definition, subtype) ||
      this.parent.accessory.addService(definition, name, subtype);

    console.log(this.service.getCharacteristic(this.parent.platform.Characteristic.Name).value);
    /*this.service.updateCharacteristic(
      this.parent.platform.Characteristic.Name,
      name
    );*/
  }
}
