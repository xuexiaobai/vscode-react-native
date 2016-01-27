/// <reference path="./packagerStrategy.d.ts" />

import {Packager} from "./packager";

export class PackagerOSXStrategy implements IPackagerStrategy {
    private packager: Packager;

    constructor(packager: Packager) {
        this.packager = packager;
    }

    public startIfNeeded(): Q.Promise<number> {
        // OS X starts the packager automatically, but if we use that
        // feature, we cannot set the REACT_DEBUGGER environment variable
        // for that process, so we start it anywayı
        return this.packager.start();
    }

    public packagerStartExtraParameters(): string[] {
        return [];
    }

    public executableName(): string {
        return "react-native";
    }
}
