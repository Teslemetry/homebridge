import {
  CharacteristicGetCallback,
  CharacteristicValue,
  HAP,
  HAPStatus,
  Logging,
  Nullable,
  Service,
} from "homebridge";
import { VehicleDataResponse } from "tesla-fleet-api/dist/types/vehicle_data.js";
import { VehicleAccessory } from "../vehicle.js";

export abstract class VehicleService {
  service: Service;

  constructor(
    public readonly parent: VehicleAccessory,
    public readonly serviceType: ServiceType
  ) {
    this.service =
      this.parent.accessory.getService(serviceType) ||
      this.parent.accessory.addService(serviceType);

    this.setupCharacteristics();
  }

  /*protected createGetter<T extends CharacteristicValue>(
    getter: Getter<T>
  ): GetterCallback {
    return (callback) => {
      this.context.tesla
        .getVehicleData()
        .then((data) => getter.call(this, data))
        .then((value) => callback(null, value))
        .catch((error: Error) => callback(error));
    };
  }

  protected createSetter<T extends CharacteristicValue>(
    setter: Setter<T>
  ): SetterCallback {
    return (value, callback) => {
      setter
        .call(this, value as T)
        .then((writeResponse) => callback(null, writeResponse ?? undefined))
        .catch((error: Error) => callback(error));
    };
  }*/

  abstract setupCharacteristics(): void;
}
