class Site {
    constructor() {
        console.log("In constructor");
    }

    private _initialPage: String = "http://www.theentertainerme.com"

    get initialPage(): String {
        return this._initialPage;
    }

    set initialPage(value: String) {
        this._initialPage = value;
    }
}