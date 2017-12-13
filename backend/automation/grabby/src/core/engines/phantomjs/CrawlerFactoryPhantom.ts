import * as genericPool from "generic-pool";
import * as phantom from "phantom";
import {PhantomJS} from "phantom";

export class PhantomCrawlerFactory implements genericPool.Factory<PhantomJS> {

    constructor() {

    }

    create(): Promise<PhantomJS> {
        console.log("Phantom Factory Controller");
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

