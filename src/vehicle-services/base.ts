import { Logging, PlatformAccessory, Service, WithUUID } from "homebridge";
import { TeslaFleetApiPlatform } from "../platform.js";
import { VehicleAccessory, VehicleContext } from "../vehicle.js";

export abstract class BaseService {
  protected service: Service;
  protected log: Logging;
  protected platform: TeslaFleetApiPlatform;
  protected accessory: PlatformAccessory<VehicleContext>;


  constructor(
    protected parent: VehicleAccessory,
    definition: WithUUID<typeof Service>,
    description: string,
    subtype: string,
  ) {
    this.log = parent.platform.log;
    this.platform = parent.platform;
    this.accessory = parent.accessory;


    const name = `${this.parent.accessory.displayName} ${description}`;
    //const uuid = this.parent.platform.api.hap.uuid.generate(this.parent.accessory.context.vin);

    if (this.parent.accessory.getServiceById(definition, subtype)) {
      this.log.info(`Restoring service ${name}`);
    } else {
      this.log.info(`Creating service ${name}`);
    }

    this.service =
      this.parent.accessory.getServiceById(definition, subtype) ||
      this.parent.accessory.addService(definition, name, subtype);

    this.service.setCharacteristic(
      this.parent.platform.Characteristic.Name,
      name
    );
  }
}
