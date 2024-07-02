import { Logging, PlatformAccessory, Service, WithUUID } from "homebridge";
import { EnergySpecific, } from "tesla-fleet-api";
import { TeslaFleetApiPlatform } from "../platform.js";
import { EventEmitter } from "../utils/event.js";
import { EnergyAccessory, EnergyContext, EnergyDataEvent } from "../energy.js";

export abstract class BaseService {
  protected service: Service;
  protected log: Logging;
  protected platform: TeslaFleetApiPlatform;
  protected accessory: PlatformAccessory<EnergyContext>;
  protected emitter: EventEmitter<EnergyDataEvent>;
  protected energy: EnergySpecific;

  constructor(
    protected parent: EnergyAccessory,
    definition: WithUUID<typeof Service>,
    name: string,
    subtype: string,
  ) {
    this.log = parent.platform.log;
    this.platform = parent.platform;
    this.accessory = parent.accessory;
    this.emitter = parent.emitter;
    this.energy = parent.energy;

    name = parent.platform.config.prefixName ? `${this.parent.accessory.displayName} ${name}` : name;

    this.service =
      this.accessory.getServiceById(definition, subtype) ||
      this.accessory.addService(definition, name, subtype);

    // Set the configured name if it's not already set since Homekit wont use the display name
    const ConfiguredName = this.service.getCharacteristic(this.platform.Characteristic.ConfiguredName);
    if (!ConfiguredName.value) {
      this.log.debug(`Configured name changing to ${name}`);
      ConfiguredName.updateValue(name);
    }
  }
}
