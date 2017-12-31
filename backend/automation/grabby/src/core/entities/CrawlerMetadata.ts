export class CrawlerMetadata {

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