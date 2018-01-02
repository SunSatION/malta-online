import * as genericPool from "generic-pool";
import {Pool} from "generic-pool";
import {Curl} from "libcurl";

var Curl = require('node-libcurl').Curl;


export class CurlCrawlerFactory implements genericPool.Factory<Curl> {

    constructor() {

    }

    create(): Promise<Curl> {
        return new Curl();
    }

    destroy(client: Curl): Promise<undefined> {
        client.close();
        return null;
    }

    validate(client): Promise<boolean> {
        return null;
    }
}

export const crawlerCurlPool: Pool<Curl> = genericPool.createPool<Curl>(new CurlCrawlerFactory(), {
    min: 1,
    max: 5
});



