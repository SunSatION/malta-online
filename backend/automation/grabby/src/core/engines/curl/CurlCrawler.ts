import {crawlerCurlPool} from "./CrawlerFactoryCURL";

import {ICrawler} from "../../interfaces/ICrawler";
import {Curl} from "libcurl";
import {CrawlerJob} from "../../CrawlerJob";
import {Product} from "../../entities/Product";
import {Page} from "../../entities/Page";
import {Job} from "kue";
import {CrawlerMetadata} from "../../entities/CrawlerMetadata";
import * as cheerio from "cheerio";

const libcurl = require("node-libcurl");

export abstract class CurlCrawler implements ICrawler<Curl, CheerioStatic> {

    private resourceCurlPromise: Curl = null;

    async run(job: Job, crawlerMetadata: CrawlerMetadata): Promise<(Page | Product)[][]> {
        let totalSteps: number = 10;

        let currentSite = (<Page>job.data).pageUrl.indexOf('http') == 0 ? (<Page>job.data).pageUrl : (<Page>job.data).baseUri + (<Page>job.data).pageUrl;

        console.log("Opening page: " + currentSite);

        await this.retrieveEngineInstance();

        job.progress(1, totalSteps);

        const page: Curl = await this.resourceCurlPromise;

        job.progress(2, totalSteps);

        page.setOpt(libcurl.Curl.option.URL, currentSite);
        page.setOpt(libcurl.Curl.option.FOLLOWLOCATION, true);

        await this.setEngineParameter(page);

        let newSearchPageToAddToQueue: Array<Page> = new Array<Page>();

        let newProductPageToAddToQueue: Array<Page> = new Array<Page>();

        let newProductInformationToAddToQueue: Array<Product> = new Array<Product>();


        let content: string = <string>await new Promise((resolve) => {
            page.perform();

            page.on('end', function (statusCode, body, headers) {
                console.info('Status Code: ', statusCode);
                console.info('Headers: ', headers);
                console.info('Body length: ', body.length);
                resolve(body);
            });

            page.on('error', function (err, curlErrCode) {

                console.error('Err: ', err);
                console.error('Code: ', curlErrCode);
                resolve("");
            });
        })

        const staticCheerio: CheerioStatic = cheerio.load(content);
        switch (job.data.type) {
            case "search_page":
                try {
                    newSearchPageToAddToQueue = newSearchPageToAddToQueue.concat(await this.extractSearchPageFromSearchPage(staticCheerio));
                } catch (e) {

                }
                job.progress(3, totalSteps);
                newProductPageToAddToQueue = newProductPageToAddToQueue.concat(await this.extractProductPageFromSearchPage(staticCheerio));
                job.progress(4, totalSteps);
                newProductInformationToAddToQueue = newProductInformationToAddToQueue.concat(await this.extractProductInformationFromSearchPage(staticCheerio));
                job.progress(5, totalSteps);
                break;
            case "product_page":
                newSearchPageToAddToQueue = newSearchPageToAddToQueue.concat(await this.extractSearchPageFromProductPage(staticCheerio));
                job.progress(3, totalSteps);
                newProductPageToAddToQueue = newProductPageToAddToQueue.concat(await this.extractProductPageFromProductPage(staticCheerio));
                job.progress(4, totalSteps);
                newProductInformationToAddToQueue = newProductInformationToAddToQueue.concat(await this.extractProductInformationFromProductPage(staticCheerio));
                job.progress(5, totalSteps);
                break;
        }
        this.releaseEngineInstance()
        return [newSearchPageToAddToQueue, newProductPageToAddToQueue, newProductInformationToAddToQueue];
    };


    /*

                    await (async function (curObj, page, job) {
                await new Promise((resolve) => {
                    page.perform();

                    page.on('end', function (statusCode, body, headers) {
                        console.info('Status Code: ', statusCode);
                        console.info('Headers: ', headers);
                        console.info('Body length: ', body.length);
                        resolve({curObj: curObj, body: body});
                    });

                    page.on('error', function (err, curlErrCode) {

                        console.error('Err: ', err);
                        console.error('Code: ', curlErrCode);
                        this.close();
                    });

                }).then((s: any) => {
                    let curObj: CurlCrawler = s.curObj;
                    let content: string = s.body;

                    (async function (curObj: CurlCrawler, content: string) {
                        return new Promise( (resolve) => {

                        // console.log(content);

                        const staticCheerio: CheerioStatic = cheerio.load(content);
                        switch (job.data.type) {
                            case "search_page":
                                newSearchPageToAddToQueue = newSearchPageToAddToQueue.concat(await curObj.extractSearchPageFromSearchPage(staticCheerio));
                                job.progress(3, totalSteps);
                                newProductPageToAddToQueue = newProductPageToAddToQueue.concat(await curObj.extractProductPageFromSearchPage(staticCheerio));
                                job.progress(4, totalSteps);
                                newProductInformationToAddToQueue = newProductInformationToAddToQueue.concat(await curObj.extractProductInformationFromSearchPage(staticCheerio));
                                job.progress(5, totalSteps);
                                break;
                            case "product_page":
                                newSearchPageToAddToQueue = newSearchPageToAddToQueue.concat(await curObj.extractSearchPageFromProductPage(staticCheerio));
                                job.progress(3, totalSteps);
                                newProductPageToAddToQueue = newProductPageToAddToQueue.concat(await curObj.extractProductPageFromProductPage(staticCheerio));
                                job.progress(4, totalSteps);
                                newProductInformationToAddToQueue = newProductInformationToAddToQueue.concat(await curObj.extractProductInformationFromProductPage(staticCheerio));
                                job.progress(5, totalSteps);
                                break;
                        }

                        return [newSearchPageToAddToQueue, newProductPageToAddToQueue, newProductInformationToAddToQueue];
                    })

                    })(curObj, content);
                    curObj.releaseEngineInstance();
                })
            })(this, page, job);
    */


    abstract extractProductInformationFromProductPage(page: CheerioStatic): Promise<Array<Product>>;

    abstract extractProductInformationFromSearchPage(page: CheerioStatic): Promise<Array<Product>>;

    abstract extractProductPageFromProductPage(page: CheerioStatic): Promise<Array<Page>>

    abstract extractProductPageFromSearchPage(page: CheerioStatic): Promise<Array<Page>>

    abstract extractSearchPageFromProductPage(page: CheerioStatic): Promise<Array<Page>>

    abstract extractSearchPageFromSearchPage(page: CheerioStatic): Promise<Array<Page>>

    abstract crawlerOnFinishCurrentExtract(page: CheerioStatic): Promise<boolean>;

    abstract crawlerWaitForElementSearchPage(page: Curl): Promise<boolean>;

    abstract crawlerWaitForElementProductPage(page: Curl): Promise<boolean>;

    abstract crawlerDetectChangeInSearchPage(page: Curl): Promise<string>;

    abstract crawlerDetectChangeInProductPage(page: Curl): Promise<string>;

    abstract setEngineParameter(page: Curl): Promise<null>;

    async retrievePageJobContent(): Promise<null> {
        const page: Curl = await this.resourceCurlPromise;
        CrawlerJob.jobQueue.process('page');
        return null;
    }

    async retrieveEngineInstance(): Promise<null> {
        this.resourceCurlPromise = await crawlerCurlPool.acquire();
        console.log("retrieving from pool");
        return null;
    }

    async releaseEngineInstance(): Promise<null> {
        crawlerCurlPool.release(this.resourceCurlPromise);
        return null;
    }



}