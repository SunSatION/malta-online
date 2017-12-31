import {crawlerPhantomPool} from "../../../crawlers/entertainer/PhantomEntertainerCrawler";
import {PhantomJS, WebPage} from "phantom";


import {ICrawler} from "../../interfaces/ICrawler";
import {Product} from "../../entities/Product";

import * as es from "elasticsearch";
import {Job} from "kue";
import {CrawlerMetadata} from "../../entities/CrawlerMetadata";
import {Page} from "../../entities/Page";
import {CrawlerJob} from "../../CrawlerJob";

export abstract class PhantomCrawler implements ICrawler<WebPage> {

    private previousElementValueToDetectChange: string = null;

    private resourcePhantomPromise: PhantomJS = null;

    private currentCrawlingSite: string = "https://www.theentertainerme.com/search-outlets/index?SearchOutletsForm%5Blocation_id%5D=21&page=10";

    private transactionalSave: boolean = false;

    constructor() {
    }

    load(crawlerMetadata: CrawlerMetadata): ICrawler<WebPage> {

        console.log(this.constructor().toString() + " for  " + crawlerMetadata.crawlerIndexingName + " loaded.")
        return this;
    }

    abstract extractProductInformationFromProductPage(page: WebPage): Promise<Array<Product>>;

    abstract extractProductInformationFromSearchPage(page: WebPage): Promise<Array<Product>>;

    abstract extractProductPageFromProductPage(page: WebPage): Promise<Array<Page>>

    abstract extractProductPageFromSearchPage(page: WebPage): Promise<Array<Page>>

    abstract extractSearchPageFromProductPage(page: WebPage): Promise<Array<Page>>

    abstract extractSearchPageFromSearchPage(page: WebPage): Promise<Array<Page>>

    abstract crawlerOnFinishCurrentExtract(page: WebPage): Promise<boolean>;

    abstract crawlerWaitForElementSearchPage(page: WebPage): Promise<boolean>;

    abstract crawlerWaitForElementProductPage(page: WebPage): Promise<boolean>;

    abstract crawlerDetectChangeInPage(page: WebPage): Promise<string>;

    abstract setEngineParameter(page: WebPage): Promise<null>;

    async retrievePageJobContent(): Promise<null> {
        const page: WebPage = await this.resourcePhantomPromise.createPage();
        CrawlerJob.jobQueue.process('page');
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


    async loopForWaitForElementSearchPage(this: PhantomCrawler, page: WebPage) {
        return new Promise(resolve => {
            this.crawlerWaitForElementSearchPage(page).then((isPresent) => {
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


    async run(job: Job, crawlerMetadata: CrawlerMetadata): Promise<null> {

        /*
                jobQueue.process("page_" + this.crawlerIndexingName, function (job, done) {
                    new PhantomPageCrawler().run(job.)
                })
        */


        let currentSite = (<Page>job.data).baseUri + (<Page>job.data).pageUrl;
        console.log("retrieved");

        await this.retrieveEngineInstance();

        const page: WebPage = await this.resourcePhantomPromise.createPage();

        await this.setEngineParameter(page);

        page.property('onConsoleMessage', function (a) {
            console.log(a)
        })

        console.log(await page.open(currentSite));

        console.log("ma il mio mistero");

        let newSearchPageToAddToQueue: Array<Page> = new Array<Page>();

        let newProductPageToAddToQueue: Array<Page> = new Array<Page>();

        let newProductInformationToAddToQueue: Array<Product> = new Array<Product>();

        let pageJob: Page = (<Page>(job.data));

        let currentProductsToSave: Array<Product> = new Array<Product>();

        do {
            let newValue: string = null;

            switch (pageJob.type) {
                case "search_page":

                    await this.loopForWaitForElementSearchPage(page);

                    newValue = null;
                    while ((newValue === this.previousElementValueToDetectChange || (newValue === typeof undefined || newValue === null))) {
                        console.log(newValue);
                        await this.timeout(200);
                        page.render("debug.png");
                        newValue = await this.crawlerDetectChangeInPage(page);
                    }
                    this.previousElementValueToDetectChange = newValue;

                    newSearchPageToAddToQueue = newSearchPageToAddToQueue.concat(await this.extractSearchPageFromSearchPage(page));
                    newProductPageToAddToQueue = newProductPageToAddToQueue.concat(await this.extractProductPageFromSearchPage(page));
                    newProductInformationToAddToQueue = newProductInformationToAddToQueue.concat(await this.extractProductInformationFromSearchPage(page));
                    break;
                case "product_page":

                    await this.loopForWaitForElementSearchPage(page);

                    newValue = null;
                    while ((newValue === this.previousElementValueToDetectChange || (newValue === typeof undefined || newValue === null))) {
                        console.log(newValue);
                        await this.timeout(200);
                        page.render("debug.png");
                        newValue = await this.crawlerDetectChangeInPage(page);
                    }
                    this.previousElementValueToDetectChange = newValue;

                    newSearchPageToAddToQueue = newSearchPageToAddToQueue.concat(await this.extractSearchPageFromProductPage(page));
                    newProductPageToAddToQueue = newProductPageToAddToQueue.concat(await this.extractProductPageFromProductPage(page));
                    newProductInformationToAddToQueue = newProductInformationToAddToQueue.concat(await this.extractProductInformationFromProductPage(page));
            }


            // newProductPagesToAddToQueue = newProductPagesToAddToQueue.concat(await this.extractSearchFromProductPage(page));


            // console.log(newPagesToAddToQueue);

//            currentProductsToSave = currentProductsToSave.concat(await this.extractProductsFromSearchPage(page));


            // currentProductsToSave = currentProductsToSave.concat(await this.extractProductInformation(page));

            if (!this.transactionalSave) {

                // create ElasticSearch Index
                let esClient: es.Client = new es.Client({'host': 'localhost:9200'});
                if (!(await esClient.indices.exists({index: crawlerMetadata.crawlerIndexingName}))) {
                    await esClient.indices.create({
                        index: crawlerMetadata.crawlerIndexingName
                    });
                }

                // Save Products
                for (let currentProduct of newProductInformationToAddToQueue) {
                    console.log(esClient.index<Product>({
                        index: crawlerMetadata.crawlerIndexingName,
                        type: 'product',
                        body: currentProduct
                    }));
                    console.log(currentProduct);
                }

                let currentPage: any;
                while ((currentPage = newSearchPageToAddToQueue.pop()) != null) {
                    // console.log("check exists - " + 'page:' + currentPage.crawlingEngine + ":" + crawlerMetadata.crawlerIndexingName, currentPage.pageUrl );
                    CrawlerJob.redisClient.hexists('page:' + currentPage.crawlingEngine + ":" + crawlerMetadata.crawlerIndexingName, currentPage.pageUrl, function (err, exists) {
                        if (!exists) {
                            CrawlerJob.jobQueue.create('page:' + this.currentPage.crawlingEngine, this.currentPage).save(function (s) {
                                // console.log('hset created - ' + 'page:' + this.currentPage.crawlingEngine + ":" + this.crawlerIndexingName, this.currentPage.pageUrl)
                                CrawlerJob.redisClient.hset('page:' + this.currentPage.crawlingEngine + ":" + this.crawlerIndexingName, this.currentPage.pageUrl, new Date().toISOString(), function (d) {
                                    console.log(d);
                                });
                            }.bind({currentPage: this.currentPage, crawlerIndexingName: this.crawlerIndexingName}));

                            // console.log("added to queue");
                        }
                        return 0;
                    }.bind({currentPage: currentPage, crawlerIndexingName: crawlerMetadata.crawlerIndexingName}))
                }
            }
        } while (await this.crawlerOnFinishCurrentExtract(page) == false)


        await page.close();


        await this.releaseEngineInstance();
        //await crawlerPhantomPool.drain();
        //await crawlerPhantomPool.clear();
        //CrawlerJob.jobQueue.shutdown(200, () => {
        //});
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
