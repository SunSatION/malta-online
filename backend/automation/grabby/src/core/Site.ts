class Site {
    constructor() {
        console.log("In constructor");
    }

    private _initialPage: string = "http://www.theentertainerme.com"

    get initialPage(): string {
        return this._initialPage;
    }

    set initialPage(value: string) {
        this._initialPage = value;
    }
}