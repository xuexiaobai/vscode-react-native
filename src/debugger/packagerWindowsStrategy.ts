/// <reference path="./packagerStrategy.d.ts" />

import {Packager} from "./packager";

export class PackagerWindowsStrategy implements IPackagerStrategy {
    private packager: Packager;

    constructor(packager: Packager) {
        this.packager = packager;
    }

    public startIfNeeded(): Q.Promise<number> {
        return this.packager.start();
    }

    public packagerStartExtraParameters(): string[] {
        return ["--nonPersistent"];
    }

    public executableName(): string {
        return "react-native.cmd";
    }
}
