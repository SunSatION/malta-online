import {crawlerPhantomPool} from "../../../crawlers/entertainer/PhantomEntertainerCrawler";
import {PhantomJS, WebPage} from "phantom";

import {jobQueue, redisClient} from "../../CrawlerJob";
import {ICrawler} from "../../interfaces/ICrawler";
import {Product} from "../../entities/Product";

import * as es from "elasticsearch";
import {Job} from "kue";

export abstract class PhantomCrawler implements ICrawler<WebPage> {

    private previousElementValueToDetectChange: string = null;

    private resourcePhantomPromise: PhantomJS = null;

    private currentCrawlingSite: string = "https://www.theentertainerme.com/search-outlets/index?SearchOutletsForm%5Blocation_id%5D=21&page=10";

    private crawlerIndexingName: string = "entertainerme";

    private transactionalSave: boolean = false;

    constructor() {
    }

    load(): ICrawler<WebPage> {
        console.log(this.constructor().toString() + " for  " + this.crawlerIndexingName + " loaded.")
        return this;
    }

    abstract extractProductInformationFromProductPage(page: WebPage): Promise<Array<Product>>;

    abstract extractProductInformationFromSearchPage(page: WebPage): Promise<Array<Product>>;

    abstract extractProductPageFromProductPage(page: WebPage): Promise<Array<Page & Product>>

    abstract extractProductPageFromSearchPage(page: WebPage): Promise<Array<Page & Product>>

    abstract extractSearchPageFromProductPage(page: WebPage): Promise<Array<Page>>

    abstract extractSearchPageFromSearchPage(page: WebPage): Promise<Array<Page>>

    abstract crawlerOnFinishCurrentExtract(page: WebPage): Promise<boolean>;

    abstract crawlerWaitForElement(page: WebPage): Promise<boolean>;

    abstract crawlerDetectChangeInPage(page: WebPage): Promise<string>;

    async retrievePageJobContent(): Promise<null> {
        const page: WebPage = await this.resourcePhantomPromise.createPage();
        jobQueue.process('page');
        return null;
    }

    async retrieveEngineInstance(): Promise<null> {
        this.resourcePhantomPromise = await crawlerPhantomPool.acquire();
        console.log("retrieving from pool");
        return null;
    }

    async releaseEngineInstance(): Promise<null> {
        crawlerPhantomPool.release(this.resourcePhantomPromise);
        return null;
    }


    async loopForWaitForElement(this: PhantomCrawler, page: WebPage) {
        return new Promise(resolve => {
            this.crawlerWaitForElement(page).then((isPresent) => {
                console.log("isPresent results: " + isPresent);
                if (isPresent == true) {
                    resolve();
                }
            });
        })
    }

    async timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


    async run(job: Job): Promise<null> {

        /*
                jobQueue.process("page_" + this.crawlerIndexingName, function (job, done) {
                    new PhantomPageCrawler().run(job.)
                })
        */


        let currentSite = this.currentCrawlingSite;
        console.log("retrieved");

        await this.retrieveEngineInstance();

        const page: WebPage = await this.resourcePhantomPromise.createPage();

        page.property('onConsoleMessage', function (a) {
            console.log(a)
        })

        console.log(await page.open(currentSite));

        console.log("ma il mio mistero");

        let newSearchPageToAddToQueue: Array<Page> = new Array<Page>();

        let currentProductsToSave: Array<Product> = new Array<Product>();

        do {


            await this.loopForWaitForElement(page);


            let newValue: string = null;
            while ((newValue === this.previousElementValueToDetectChange || (newValue === typeof undefined || newValue === null))) {
                console.log(newValue);
                await this.timeout(2000);
                newValue = await this.crawlerDetectChangeInPage(page);
            }
            this.previousElementValueToDetectChange = newValue;

            newSearchPageToAddToQueue = newSearchPageToAddToQueue.concat(await this.extractSearchPageFromSearchPage(page));


            //newPagesToAddToQueue = newPagesToAddToQueue.concat(await this.extractProductPageFromProductPage(page));


            // console.log(newPagesToAddToQueue);

//            currentProductsToSave = currentProductsToSave.concat(await this.extractProductsFromSearchPage(page));


            // currentProductsToSave = currentProductsToSave.concat(await this.extractProductInformation(page));

            console.log(newSearchPageToAddToQueue);

            if (!this.transactionalSave) {

                // create ElasticSearch Index
                let esClient: es.Client = new es.Client({'host': 'localhost:9200'});
                if (!(await esClient.indices.exists({index: this.crawlerIndexingName}))) {
                    await esClient.indices.create({
                        index: this.crawlerIndexingName
                    });
                }

                // Save Products
                for (let currentProduct of currentProductsToSave) {
                    console.log(esClient.index<Product>({
                        index: this.crawlerIndexingName,
                        type: 'product',
                        body: currentProduct
                    }));
                    console.log(currentProduct);
                }

                let currentPage: any;
                while ((currentPage = newSearchPageToAddToQueue.pop()) != null) {
                    console.log("check exists");
                    redisClient.hexists('page:' + currentPage.crawlingEngine + ":" + this.crawlerIndexingName, currentPage.pageUrl, function (exists) {
                        if (!exists) {
                            jobQueue.create('page:' + this.currentPage.crawlingEngine, this.currentPage).save(function (s) {
                                redisClient.hset(this.currentPage.crawlingEngine + ":" + this.crawlerIndexingName, this.currentPage.pageUrl, null, function () {
                                });
                            }.bind({currentPage: this.currentPage, crawlerIndexingName: this.crawlerIndexingName}));

                            console.log("added to queue");
                        }
                        ;
                        return 0;
                    }.bind({currentPage: currentPage, crawlerIndexingName: this.crawlerIndexingName}))
                }
            }
        } while (await this.crawlerOnFinishCurrentExtract(page) == false)


        await page.close();


        await this.releaseEngineInstance();
        await crawlerPhantomPool.drain();
        await crawlerPhantomPool.clear();
        jobQueue.shutdown(200, () => {
        });
        return null;
    }

}

/*



    /*
    async detectChangeLoop(page : WebPage) : Promise<string> {

            let newValue: string = await this.crawlerDetectChangeInPage(page);
            //let newValue = 'yo';
            console.log("oldValue: " + this.previousElementValueToDetectChange);
            if (1===1)  {
                console.log("time to retry: " + newValue);
                setTimeout(() => { this.detectChangeLoop(page) }, 1000);
            } else {
                this.previousElementValueToDetectChange = newValue;
                console.log("newValue: " + newValue);

                return newValue;
            }
    };
*/
