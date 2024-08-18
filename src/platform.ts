import {
  API,
  Categories,
  Characteristic,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformConfig,
  Service,
} from "homebridge";

import { EnergyAccessory, EnergyContext } from "./energy.js";
import { PLATFORM_NAME, PLUGIN_NAME } from "./settings.js";
import { VehicleAccessory, VehicleContext } from "./vehicle.js";

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
  public readonly accessories: PlatformAccessory<
    VehicleContext | EnergyContext
  >[] = [];

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig,
    public readonly api: API,
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
    this.api.on("didFinishLaunching", async () => {
      log.debug("Executed didFinishLaunching callback");
      // run the method to discover / register your devices as accessories

      this.TeslaFleetApi.metadata()
        .then(({ scopes }) =>
          this.TeslaFleetApi.products_by_type().then(
            async ({ vehicles, energy_sites }) => {
              const newAccessories: PlatformAccessory<
                VehicleContext | EnergyContext
              >[] = [];
              if (scopes.includes("vehicle_device_data")) {
                //const newVehicleAccessories: PlatformAccessory<VehicleContext>[] = [];
                vehicles.forEach(async (product) => {
                  if (this.config?.ignore_vin?.includes(product.vin)) {
                    this.log.info("Ignoring vehicle", product.vin);
                    return;
                  }
                  this.TeslaFleetApi.vehicle!;
                  const uuid = this.api.hap.uuid.generate(
                    `${PLATFORM_NAME}:${product.vin}`,
                  );
                  let accessory = this.accessories.find(
                    (accessory) => accessory.UUID === uuid,
                  ) as PlatformAccessory<VehicleContext> | undefined;

                  if (accessory) {
                    this.log.debug(
                      "Restored existing accessory from cache:",
                      accessory.displayName,
                    );
                  } else {
                    this.log.debug(
                      "Adding new accessory:",
                      product.display_name,
                    );
                    accessory = new this.api.platformAccessory<VehicleContext>(
                      product.display_name,
                      uuid,
                      Categories.OTHER,
                    );
                    newAccessories.push(accessory);
                  }

                  accessory.context.vin = product.vin;
                  accessory.context.state = product.state;
                  accessory.displayName = product.display_name;

                  new VehicleAccessory(this, accessory);
                });
              }

              if (scopes.includes("energy_device_data")) {
                //const newEnergyAccessories: PlatformAccessory<EnergyContext>[] = [];
                energy_sites.forEach((product) => {
                  if (
                    this.config?.ignore_site?.includes(product.asset_site_id)
                  ) {
                    this.log.info(
                      "Ignoring energy site",
                      product.energy_site_id,
                    );
                    return;
                  }
                  this.TeslaFleetApi.energy!;
                  const uuid = this.api.hap.uuid.generate(
                    `${PLATFORM_NAME}:${product.id}`,
                  );
                  let accessory = this.accessories.find(
                    (accessory) => accessory.UUID === uuid,
                  ) as PlatformAccessory<EnergyContext> | undefined;

                  if (accessory) {
                    this.log.debug(
                      "Restoring existing accessory from cache:",
                      accessory.displayName,
                    );
                  } else {
                    this.log.debug("Adding new accessory:", product.site_name);
                    accessory = new this.api.platformAccessory<EnergyContext>(
                      product.site_name,
                      uuid,
                      Categories.OTHER,
                    );
                    newAccessories.push(accessory);
                  }

                  accessory.context.id = product.energy_site_id;
                  accessory.context.battery = product.components.battery;
                  accessory.context.grid = product.components.grid;
                  accessory.context.solar = product.components.solar;
                  accessory.displayName = product.site_name;

                  new EnergyAccessory(this, accessory);
                });
              }

              return newAccessories;
            },
          ),
        )
        .then(
          (newAccessories) => {
            this.api.registerPlatformAccessories(
              PLUGIN_NAME,
              PLATFORM_NAME,
              newAccessories,
            );
          },
          (error) => {
            this.log.error(error?.data?.error ?? error);
          },
        );
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to set up event handlers for characteristics and update respective values.
   */
  configureAccessory(
    accessory: PlatformAccessory<VehicleContext | EnergyContext>,
  ) {
    this.log.debug("Loading accessory from cache:", accessory.displayName);

    // add the restored accessory to the accessories cache, so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {}
}
