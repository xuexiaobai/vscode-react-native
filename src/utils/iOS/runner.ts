import * as Q from "q";
import {Project} from "./project";
import {Builder} from "./Builder";
import {Deployer} from "./deployer";
import {Log} from "../../utils/commands/log";

export class Runner {
    private project: Project;
    private builder: Builder;
    private deployer: Deployer;
    private BUILD_IOS_APP_TITLE = "Building iOS App";
    private DEPLOY_IOS_APP_TO_SIMULATOR_TITLE = "Deploy iOS App to Simulator";
    private log: Log = new Log();

    constructor(project: Project, configuration: string) {
        this.project = project;
        this.builder = new Builder(project, configuration);
        this.deployer = new Deployer(project);
    }

    public run(buildOpts: any): Q.Promise<any> {
        return this.project.name.then(projectName => {
            this.log.commandStarted(this.BUILD_IOS_APP_TITLE);
            return Q({})
                .then(() => this.builder.build(buildOpts))
                .then(() => this.log.commandEnded(this.BUILD_IOS_APP_TITLE))
                .then(() => this.log.commandStarted(this.DEPLOY_IOS_APP_TO_SIMULATOR_TITLE))
                .then(() => this.deployer.deployToSimulator(this.project.path, projectName))
                .then(() => this.log.commandEnded(this.DEPLOY_IOS_APP_TO_SIMULATOR_TITLE));
        });
    }
}
