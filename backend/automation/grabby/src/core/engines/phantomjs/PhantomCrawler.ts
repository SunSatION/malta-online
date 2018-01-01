import {crawlerPhantomPool} from "../../../crawlers/entertainer/PhantomEntertainerCrawler";
import {PhantomJS, WebPage} from "phantom";


import {ICrawler} from "../../interfaces/ICrawler";
import {Product} from "../../entities/Product";
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

    abstract crawlerDetectChangeInSearchPage(page: WebPage): Promise<string>;

    abstract crawlerDetectChangeInProductPage(page: WebPage): Promise<string>;

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

    async loopForWaitForElementProductPage(this: PhantomCrawler, page: WebPage) {
        return new Promise(resolve => {
            this.crawlerWaitForElementProductPage(page).then((isPresent) => {
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


    async run(job: Job, crawlerMetadata: CrawlerMetadata): Promise<Array<Array<Page | Product>>> {

        /*
                jobQueue.process("page_" + this.crawlerIndexingName, function (job, done) {
                    new PhantomPageCrawler().run(job.)
                })
        */

        let totalSteps: number = 10;

        let currentSite = (<Page>job.data).pageUrl.indexOf('http') == 0 ? (<Page>job.data).pageUrl : (<Page>job.data).baseUri + (<Page>job.data).pageUrl;

        console.log("Opening page: " + currentSite);

        await this.retrieveEngineInstance();

        job.progress(1, totalSteps);

        const page: WebPage = await this.resourcePhantomPromise.createPage();

        job.progress(2, totalSteps);


        await this.setEngineParameter(page);

        page.property('onConsoleMessage', function (a) {
            console.log(a)
        })

        console.log(await page.open(currentSite));

        job.progress(3, totalSteps);

        let newSearchPageToAddToQueue: Array<Page> = new Array<Page>();

        let newProductPageToAddToQueue: Array<Page> = new Array<Page>();

        let newProductInformationToAddToQueue: Array<Product> = new Array<Product>();

        let pageJob: Page = (<Page>(job.data));
        console.log(JSON.stringify(pageJob));

        do {
            let newValue: string = null;
            let retryCount = 0;
            switch (pageJob.type) {
                case "search_page":

                    await this.loopForWaitForElementSearchPage(page);

                    job.progress(5, totalSteps);

                    newValue = null;

                    while ((newValue === this.previousElementValueToDetectChange || (newValue === typeof undefined || newValue === null)) && retryCount < 10) {
                        console.log(newValue);
                        await this.timeout(200);
                        // page.render("debug.png");
                        newValue = await this.crawlerDetectChangeInSearchPage(page);
                        retryCount = retryCount + 1;
                    }

                    job.progress(6, totalSteps);

                    this.previousElementValueToDetectChange = newValue;

                    newSearchPageToAddToQueue = newSearchPageToAddToQueue.concat(await this.extractSearchPageFromSearchPage(page));
                    job.progress(7, totalSteps);
                    newProductPageToAddToQueue = newProductPageToAddToQueue.concat(await this.extractProductPageFromSearchPage(page));
                    job.progress(8, totalSteps);
                    newProductInformationToAddToQueue = newProductInformationToAddToQueue.concat(await this.extractProductInformationFromSearchPage(page));
                    job.progress(9, totalSteps);

                    break;
                case "product_page":

                    await this.loopForWaitForElementProductPage(page);

                    newValue = null;
                    while ((newValue === this.previousElementValueToDetectChange || (newValue === typeof undefined || newValue === null)) && retryCount < 10) {
                        console.log(newValue);
                        await this.timeout(200);
                        //page.render("debug.png");
                        newValue = await this.crawlerDetectChangeInProductPage(page);
                        retryCount = retryCount + 1;
                    }
                    this.previousElementValueToDetectChange = newValue;
                    job.progress(6, totalSteps);

                    newSearchPageToAddToQueue = newSearchPageToAddToQueue.concat(await this.extractSearchPageFromProductPage(page));
                    job.progress(7, totalSteps);
                    newProductPageToAddToQueue = newProductPageToAddToQueue.concat(await this.extractProductPageFromProductPage(page));
                    job.progress(8, totalSteps);
                    newProductInformationToAddToQueue = newProductInformationToAddToQueue.concat(await this.extractProductInformationFromProductPage(page));
                    job.progress(9, totalSteps);
            }


            // newProductPagesToAddToQueue = newProductPagesToAddToQueue.concat(await this.extractSearchFromProductPage(page));


            // console.log(newPagesToAddToQueue);

//            currentProductsToSave = currentProductsToSave.concat(await this.extractProductsFromSearchPage(page));


            // currentProductsToSave = currentProductsToSave.concat(await this.extractProductInformation(page));



        } while (await this.crawlerOnFinishCurrentExtract(page) == false)


        await page.close();

        job.progress(10, totalSteps);

        await this.releaseEngineInstance();

        return [newSearchPageToAddToQueue, newProductPageToAddToQueue, newProductInformationToAddToQueue];

        //await crawlerPhantomPool.drain();
        //await crawlerPhantomPool.clear();
        //CrawlerJob.jobQueue.shutdown(200, () => {
        //});

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
