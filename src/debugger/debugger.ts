/// <reference path="./appStrategy.d.ts" />
/// <reference path="./packagerStrategy.d.ts" />

import * as android from "./android/android";
import * as ios from "./iOS/ios";
import * as debuggerWorker from "./debuggerWorker";
import * as packager from "./packager";
import * as scriptImporter from "./scriptImporter";
import * as launcher from "./launcher";

export module Debugger {
    export var Android = android.Android;
    export var iOS = ios.iOS;
    export var DebuggerWorker = debuggerWorker.DebuggerWorker;
    export var Packager = packager.Packager;
    export var ScriptImporter = scriptImporter.ScriptImporter;
    export var Launcher = launcher.Launcher;
}
