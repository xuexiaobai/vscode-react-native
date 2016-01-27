import * as builder from "./builder";
import * as deployer from "./deployer";
import * as devicesInformation from "./devicesInformation";
import * as project from "./project";
import * as runner from "./runner";
import * as findAppPFile from "./findAppPFile";

export module iOS {
    export var Builder = builder.Builder;
    export var Deployer = deployer.Deployer;
    export var DevicesInformation = devicesInformation.DevicesInformation;
    export var Project = project.Project;
    export var Runner = runner.Runner;
    export var FindAppPFile = findAppPFile.FindAppPFile;
}
