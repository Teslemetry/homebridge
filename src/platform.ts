import {
  API,
  Characteristic,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformConfig,
  Service,
} from "homebridge";

import { PLATFORM_NAME, PLUGIN_NAME } from "./settings.js";
import { VehicleAccessory } from "./vehicle.js";

import { Teslemetry } from "tesla-fleet-api";

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class TeslaFleetApiPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;
  public readonly TeslaFleetApi: Teslemetry;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig,
    public readonly api: API
  ) {
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;

    this.TeslaFleetApi = new Teslemetry(this.config.accessToken);

    this.log.debug("Finished initializing platform:", this.config.accessToken);

    // Homebridge 1.8.0 introduced a `log.success` method that can be used to log success messages
    // For users that are on a version prior to 1.8.0, we need a 'polyfill' for this method
    if (!log.success) {
      log.success = log.info;
    }

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on("didFinishLaunching", () => {
      log.debug("Executed didFinishLaunching callback");
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to set up event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info("Loading accessory from cache:", accessory.displayName);

    // add the restored accessory to the accessories cache, so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {
    this.TeslaFleetApi.products_by_type().then(({ vehicles, energy_sites }) => {
      vehicles.forEach((product) => {
        const uuid = this.api.hap.uuid.generate(product.vin);
        const cachedAccessory = this.accessories.find(
          (accessory) => accessory.UUID === uuid
        );
        if (cachedAccessory) {
          cachedAccessory.context.state = product.state;
          cachedAccessory.displayName = product.display_name;
          this.log.info(
            "Restoring existing accessory from cache:",
            cachedAccessory.displayName
          );
          new VehicleAccessory(this, cachedAccessory);
          return;
        }

        this.log.info("Adding new accessory:", product.display_name);
        const newAccessory = new this.api.platformAccessory(
          product.display_name,
          uuid
        );

        newAccessory.context.vin = product.vin;
        newAccessory.context.state = product.state;
        newAccessory.displayName = product.display_name;

        new VehicleAccessory(this, newAccessory);

        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
          newAccessory,
        ]);
      });

      energy_sites.forEach((product) => {});
    });
  }
}
