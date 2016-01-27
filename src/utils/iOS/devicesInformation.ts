// TODO: Review and Refactor this whole file
/* tslint:disable:no-var-requires */

import util = require("util");

export class DevicesInformation {
    public getDeviceFromTarget(target: any) {
        return this.getDeviceFromDeviceTypeId("com.apple.CoreSimulator.SimDeviceType." + target);
    }

    private getDeviceFromDeviceTypeId(devicetypeid: any) {
        /*
            // Example result:
            {
                name : "iPhone 6",
                id : "A1193D97-F5EE-468D-9DBA-786F403766E6",
                runtime : "iOS 8.3"
            }
        */

        // the object to return
        let ret_obj = {
            name : <any>null,
            id : <any>null,
            runtime : <any>null
        };

        let options = { "silent": true };
        let simctl = require("simctl");
        let list = simctl.list(options).json;

        let arr: any = [];
        if (devicetypeid) {
            arr = devicetypeid.split(",");
        }

        // get the devicetype from --devicetypeid
        // --devicetypeid is a string in the form "devicetype, runtime_version" (optional: runtime_version)
        let devicetype: any = null;
        if (arr.length < 1) {
        let dv = this.findFirstAvailableDevice(list);
        console.error(util.format("--devicetypeid was not specified, using first available device: %s.", dv.name));
        return dv;
        } else {
            devicetype = arr[0].trim();
            if (arr.length > 1) {
                ret_obj.runtime = arr[1].trim();
            }
        }

        // check whether devicetype has the "com.apple.CoreSimulator.SimDeviceType." prefix, if not, add it
        let prefix = "com.apple.CoreSimulator.SimDeviceType.";
        if (devicetype.indexOf(prefix) !== 0) {
            devicetype = prefix + devicetype;
        }

        // now find the devicename from the devicetype
        let devicename_found = list.devicetypes.some(function(deviceGroup: any) {
            if (deviceGroup.id === devicetype) {
                ret_obj.name = deviceGroup.name;
                return true;
            }

            return false;
        });

        // device name not found, exit
        if (!devicename_found) {
        console.error(util.format("Device type \"%s\" could not be found.", devicetype));
        process.exit(1);
        }

        // if runtime_version was not specified, we use a default. Use first available that has the device
        if (!ret_obj.runtime) {
            ret_obj.runtime = this.findAvailableRuntime(list, ret_obj.name);
        }

        // prepend iOS to runtime version, if necessary
        if (ret_obj.runtime.indexOf("iOS") === -1) {
            ret_obj.runtime = util.format("iOS %s", ret_obj.runtime);
        }

        // now find the deviceid (by runtime and devicename)
        let deviceid_found = list.devices.some(function(deviceGroup: any) {
            if (deviceGroup.runtime === ret_obj.runtime) { // found the runtime, now find the actual device matching devicename
                return deviceGroup.devices.some(function(device: any) {
                    if (device.name === ret_obj.name) {
                        ret_obj.id = device.id;
                        return true;
                    }
                    return false;
                });
            }
            return false;
        });

        if (!deviceid_found) {
            console.error(util.format("Device id for device name \"%s\" and runtime \"%s\" could not be found, or is not available.", ret_obj.name, ret_obj.runtime));
            process.exit(1);
        }

        return ret_obj;
    }

    private findAvailableRuntime(list: any, device_name: any) {

        let all_druntimes = this.findRuntimesGroupByDeviceProperty(list, "name", true);
        let druntime = all_druntimes[device_name];
        let runtime_found = druntime && druntime.length > 0;

        if (!runtime_found) {
            console.error(util.format("No available runtimes could be found for \"%s\".", device_name));
            process.exit(1);
        }

        // return most modern runtime
        return druntime.sort().pop();
    }



    private findRuntimesGroupByDeviceProperty(list: any, deviceProperty: any, availableOnly: any): any {
        /*
            // Example result:
            {
                "iPhone 6" : [ "iOS 8.2", "iOS 8.3"],
            "iPhone 6 Plus" : [ "iOS 8.2", "iOS 8.3"]
            }
        */

        let runtimes: any = {};
        let available_runtimes: any = {};

        list.runtimes.forEach(function(runtime: any) {
            if (runtime.available) {
                available_runtimes[ runtime.name ] = true;
            }
        });

        list.devices.forEach(function(deviceGroup: any) {
            deviceGroup.devices.forEach(function(device: any){
                let devicePropertyValue = device[deviceProperty];

                if (!runtimes[devicePropertyValue]) {
                    runtimes[devicePropertyValue] = [];
                }
                if (availableOnly) {
                    if (available_runtimes[deviceGroup.runtime]) {
                        runtimes[devicePropertyValue].push(deviceGroup.runtime);
                    }
                } else {
                    runtimes[devicePropertyValue].push(deviceGroup.runtime);
                }
            });
        });

        return runtimes;
    }

    private findFirstAvailableDevice(list: any) {
        /*
            // Example result:
            {
                name : "iPhone 6",
                id : "A1193D97-F5EE-468D-9DBA-786F403766E6",
                runtime : "iOS 8.3"
            }
        */

        // the object to return
        let ret_obj = {
            name : <any>null,
            id : <any>null,
            runtime : <any>null
        };

        let available_runtimes: any = {};

        list.runtimes.forEach(function(runtime: any) {
            if (runtime.available) {
                available_runtimes[ runtime.name ] = true;
            }
        });


        list.devices.some(function(deviceGroup: any) {
            deviceGroup.devices.some(function(device: any){
                if (available_runtimes[deviceGroup.runtime]) {
                    ret_obj = {
                        name : device.name,
                        id : device.id,
                        runtime : deviceGroup.runtime
                    };
                    return true;
                }
                return false;
            });
            return false;
        });

        return ret_obj;
    }
}
