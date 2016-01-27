interface IPackagerStrategy {
    startIfNeeded(): Q.Promise<number>;
    packagerStartExtraParameters(): string[];
    executableName(): string;
}