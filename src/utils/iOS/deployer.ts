// TODO: Review and Refactor this whole file

import * as path from "path";
import {Project} from "./project";

export class Deployer {
    private project: Project;

    constructor(project: Project) {
        this.project = project;
    }

    public deployToSimulator(projectPath: any, projectName: any) {
            let appPath = path.join(projectPath, "build", "emulator", projectName + ".app");
            return this.deployToSim(appPath, null /* target */);
            /*
            if (!buildOpts.device || buildOpts.noSign) {
                return;
            }
            let buildOutputDir = path.join(projectPath, "build", "device");
            let pathToApp = path.join(buildOutputDir, projectName + ".app");
            let pathToIpa = path.join(buildOutputDir, projectName + ".ipa");
            let xcRunArgs = ["-sdk", "iphoneos", "PackageApplication",
                "-v", pathToApp,
                "-o", pathToIpa];
            if (buildOpts.codeSignIdentity) {
                xcRunArgs.concat("--sign", buildOpts.codeSignIdentity);
            }
            if (buildOpts.provisioningProfile) {
                xcRunArgs.concat("--embed", buildOpts.provisioningProfile);
            }
            return spawn("xcrun", xcRunArgs, projectPath);
            */

    }

    public justDeployToSimulator(buildOpts: any) {
        return this.project.name.then(projectName => {
            return this.deployToSimulator(this.project.path, projectName);
        });
    }

    /**
     * Deploy specified app package to ios-sim simulator
     * @param  {String} appPath Path to application package
     * @param  {String} target  Target device type
     * @return {Promise}        Resolves when deploy succeeds otherwise rejects
     */
    private deployToSim(appPath: any, target: any) {
        // Select target device for emulator. Default is "iPhone-6"
        if (!target) {
            target = this.chooseSimulator();
            console.log("No target specified for emulator. Deploying to " + target + " simulator");
            return this.startSim(appPath, target);
        } else {
            return this.startSim(appPath, target);
        }
    }

    public chooseSimulator() {
        let iosSim = require("ios-sim");
        let emulators = iosSim.getdevicetypes();
        let target: any;
        if (emulators.length > 0) {
            target = emulators[0];
        }
        emulators.forEach(function (emulator: any) {
            if (emulator.indexOf("iPhone") === 0) {
                target = emulator;
            }
        });
        return target;
    }

    private startSim(appPath: any, target: any) {
        let logPath = path.join(this.project.path, "console.log");

        let iosSim = require("ios-sim");
        return iosSim.launch(appPath, "com.apple.CoreSimulator.SimDeviceType." + target, logPath);
    }
}
