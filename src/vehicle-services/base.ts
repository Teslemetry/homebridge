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

    name = parent.platform.config.prefixName ? `${this.parent.accessory.displayName} ${name}` : name;

    if (this.accessory.getServiceById(definition, subtype)) {
      this.log.info(`Restoring service ${name}`);
    } else {
      this.log.info(`Creating service ${name}`);
    }

    this.service =
      this.accessory.getServiceById(definition, subtype) ||
      this.accessory.addService(definition, name, subtype);

    // Set the configured name if it's not already set since Homekit wont use the display name
    const ConfiguredName = this.service.getCharacteristic(this.platform.Characteristic.ConfiguredName);
    if (!ConfiguredName.value) {
      this.log.debug(`Configured name changing to ${name}`);
      ConfiguredName.updateValue(name);
    } else {
      this.log.debug(`Configured name of ${name} is already set to ${ConfiguredName.value}`);
    }

  }
}
