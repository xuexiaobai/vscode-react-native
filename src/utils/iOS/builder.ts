// TODO: Review and Refactor this whole file
/// <reference path="./project.ts" />

import * as Q from "q";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import * as child_process from "child_process";
import {Project} from "./project";

export class Builder {
    private project: Project;
    private xcConfigFilePath: string;
    private configuration: any;

    constructor(project: Project, configuration: string) {
        this.project = project;
        this.configuration = configuration;
        this.xcConfigFilePath = path.join(os.tmpdir(), "build-" + this.configuration.toLowerCase() + ".xcconfig");
    }

    /**
     * Returns array of arguments for xcodebuild
     * @param  {String}  projectName   Name of xcode projec
     * @param  {String}  projectPath   Path to project file. Will be used to set CWD for xcodebuild
     * @param  {String}  configuration Configuration name: debug|release
     * @param  {Boolean} isDevice      Flag that specify target for package (device/emulator)
     * @return {Array}                 Array of arguments that could be passed directly to spawn method
     */
    private getXcodeArgs(projectName: any, projectPath: any, isDevice: any) {
        let xcodebuildArgs: any;
        if (isDevice) {
            xcodebuildArgs = [
                "-xcconfig", this.xcConfigFilePath,
                "-project", projectName + ".xcodeproj",
                "ARCHS=armv7 arm64",
                "-scheme", projectName,
                "-configuration", this.configuration,
                "-sdk", "iphoneos",
                "build",
                "VALID_ARCHS=armv7 arm64",
                "CONFIGURATION_BUILD_DIR=" + path.join(projectPath, "build", "device"),
                "SHARED_PRECOMPS_DIR=" + path.join(projectPath, "build", "sharedpch")
            ];
        } else { // emulator
            xcodebuildArgs = [
                "-xcconfig", this.xcConfigFilePath,
                "-project", projectName + ".xcodeproj",
                "ARCHS=i386",
                "-scheme", projectName,
                "-configuration", this.configuration,
                "-sdk", "iphonesimulator",
                "build",
                "VALID_ARCHS=i386",
                "CONFIGURATION_BUILD_DIR=" + path.join(projectPath, "build", "emulator"),
                "SHARED_PRECOMPS_DIR=" + path.join(projectPath, "build", "sharedpch")
            ];
        }
        return xcodebuildArgs;
    }

    public build(buildOpts: any): Q.Promise<any> {
        buildOpts = buildOpts || {};

        if (buildOpts.debug && buildOpts.release) {
            return Q.reject("Only one of \"debug\"/\"release\" options should be specified");
        }

        if (buildOpts.device && buildOpts.emulator) {
            return Q.reject("Only one of \"device\"/\"emulator\" options should be specified");
        }

        if (buildOpts.buildConfig) {
            if (!fs.existsSync(buildOpts.buildConfig)) {
                return Q.reject("Build config file does not exist:" + buildOpts.buildConfig);
            }
            console.log("log", "Reading build config file:", path.resolve(buildOpts.buildConfig));
            let buildConfig = JSON.parse(fs.readFileSync(buildOpts.buildConfig, "utf-8"));
            if (buildConfig.ios) {
                let buildType = buildOpts.release ? "release" : "debug";
                let config = buildConfig.ios[buildType];
                if (config) {
                    ["codeSignIdentity", "codeSignResourceRules", "provisioningProfile"].forEach(
                        function(key) {
                            buildOpts[key] = buildOpts[key] || config[key];
                        });
                }
            }
        }

        let projectName: any;
        return this.project.name.then(name => {
            projectName = name;
            let extraConfig = "";
            if (buildOpts.codeSignIdentity) {
                extraConfig += "CODE_SIGN_IDENTITY = " + buildOpts.codeSignIdentity + "\n";
                extraConfig += "CODE_SIGN_IDENTITY[sdk=iphoneos*] = " + buildOpts.codeSignIdentity + "\n";
            }
            if (buildOpts.codeSignResourceRules) {
                extraConfig += "CODE_SIGN_RESOURCE_RULES_PATH = " + buildOpts.codeSignResourceRules + "\n";
            }
            if (buildOpts.provisioningProfile) {
                extraConfig += "PROVISIONING_PROFILE = " + buildOpts.provisioningProfile + "\n";
            }
            return Q.nfcall(fs.writeFile, this.xcConfigFilePath, extraConfig, "utf-8");
        }).then(() => {
            let configuration = buildOpts.release ? "Release" : "Debug";

            console.log("Building project  : " + path.join(this.project.path, projectName + ".xcodeproj"));
            console.log("\tConfiguration : " + configuration);
            console.log("\tPlatform      : " + (buildOpts.device ? "device" : "emulator"));

            let xcodebuildArgs = this.getXcodeArgs(projectName, this.project.path, buildOpts.device);
            // TODO: FIGURE OUT HOW TO HANDLE CODE SIGING PROPERLY
            xcodebuildArgs = xcodebuildArgs.concat(["CODE_SIGN_IDENTITY=", "CODE_SIGNING_REQUIRED=NO", "CODE_SIGN_ENTITLEMENTS="]);
            console.log("Print arguments: " + JSON.stringify(xcodebuildArgs));
            return this.spawn("xcodebuild", xcodebuildArgs, this.project.path);
        });
    }

    private spawn(cmd: any, args: any, opt_cwd: any) {
        let d = Q.defer<number>();
        try {
            let child = child_process.spawn(cmd, args, { cwd: opt_cwd, stdio: "inherit" });

            child.on("exit", function(code: any) {
                if (code) {
                    d.reject("Error code " + code + " for command: " + cmd + " with args: " + args);
                } else {
                    d.resolve(code);
                }
            });
        } catch (e) {
            d.reject(e);
        }
        return d.promise;
    };
}
