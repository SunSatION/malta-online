import * as genericPool from "generic-pool";
import * as phantom from "phantom";
import {PhantomJS} from "phantom";

export class CrawlerFactoryCURL implements genericPool.Factory<PhantomJS> {

    constructor() {

    }

    create(): Promise<PhantomJS> {
        return phantom.create();
    }

    destroy(client: PhantomJS): Promise<undefined> {
        client.exit();
        return null;
    }

    validate(client): Promise<boolean> {
        return null;
    }
}

