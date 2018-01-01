export class CrawlerMetadata {
    private _failedJobsReattampt: number;

    get failedJobsReattampt(): number {
        return this._failedJobsReattampt;
    }

    set failedJobsReattampt(value: number) {
        this._failedJobsReattampt = value;
    }

    private _backoffMs: number;

    get backoffMs(): number {
        return this._backoffMs;
    }

    set backoffMs(value: number) {
        this._backoffMs = value;
    }

    private _jobTTLMs: number;

    get jobTTLMs(): number {
        return this._jobTTLMs;
    }

    set jobTTLMs(value: number) {
        this._jobTTLMs = value;
    }

    private _delayBetweenCallsMs: number;

    get delayBetweenCallsMs(): number {
        return this._delayBetweenCallsMs;
    }

    set delayBetweenCallsMs(value: number) {
        this._delayBetweenCallsMs = value;
    }

    private _crawlerCronExpression: string;

    get crawlerCronExpression(): string {
        return this._crawlerCronExpression;
    }

    set crawlerCronExpression(value: string) {
        this._crawlerCronExpression = value;
    }


    private _initialWebsite: string;

    get initialWebsite(): string {
        return this._initialWebsite;
    }

    set initialWebsite(value: string) {
        this._initialWebsite = value;
    }

    private _crawlerIndexingName: string;

    get crawlerIndexingName(): string {
        return this._crawlerIndexingName;
    }

    set crawlerIndexingName(value: string) {
        this._crawlerIndexingName = value;
    }


}