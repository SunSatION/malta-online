import {crawlerPool} from "./Booter";
import {PhantomJS, WebPage} from "phantom";

import {jobQueue} from "./CrawlerJob";
import {ICrawler} from "./interfaces/ICrawler";
import {Product} from "./Product";

import * as es from "elasticsearch";


export abstract class PhantomCrawler implements ICrawler<PhantomJS> {

    private resourcePromise: PhantomJS = null;

    constructor() {
    }

    abstract extractNewPages(page: WebPage): Promise<Page[]>;

    abstract extractNewProductUrl(page: WebPage): Promise<String[]>;

    abstract extractProductInformation(page: WebPage): Promise<Product[]>;

    async retrievePageJobContent(): Promise<null> {
        const page: WebPage = await this.resourcePromise.createPage();
        jobQueue.process('page');
        return null;
    }

    async retrieveEngineInstance(): Promise<null> {
        this.resourcePromise = await crawlerPool.acquire();
        console.log("retrieving from pool");
        return null;
    }

    async releaseEngineInstance(): Promise<null> {
        crawlerPool.release(this.resourcePromise);
        return null;
    }

    addPageJob(): boolean {
        return null;
    }

    async run(): Promise<null> {
        let currentSite = "https://www.theentertainerme.com/outlets/717-steakhouse/detail?o=33893&m=20344";
        console.log("retrieved");

        await this.retrieveEngineInstance();

        const page: WebPage = await this.resourcePromise.createPage();
        console.log("nessuno dorma");

        console.log(await page.open(currentSite));

        console.log("ma il mio mistero");

        await this.extractNewPages(page);

        let currentProduct: Array<Product> = await this.extractProductInformation(page);


        let esClient: es.Client = new es.Client({"host": "localhost:9200"});
        console.log(await esClient.indices.create({
            index: 'entertainerme'
        }));
        console.log(esClient.index<Product>({index: 'entertainerme', type: 'product', body: currentProduct[0]}));


        console.log(currentProduct);
        console.log(JSON.stringify(currentProduct));

        await page.close();


        await this.releaseEngineInstance();
        await crawlerPool.drain();
        await crawlerPool.clear();
        jobQueue.shutdown(200, () => {
        });
        return null;
    }
}

/*




async retrievePhantomInstance() {
}

async releasePhantomInstance() {

}

constructor() {

}

}*/