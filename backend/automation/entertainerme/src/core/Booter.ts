import * as genericPool from "generic-pool";
import {Pool} from "generic-pool";
import {PhantomCrawlerFactory} from "./CrawlerFactoryPhantom";
import {PhantomJS, WebPage} from "phantom";
import {PhantomCrawler} from "./PhantomCrawler";
import {Product} from "./Product";


declare var $;

export const crawlerPool: Pool<PhantomJS> = genericPool.createPool<PhantomJS>(new PhantomCrawlerFactory(), {
    min: 2,
    max: 5
});

export class Booter extends PhantomCrawler {
    constructor() {
        console.log("Phantom Crawler Created");
        super();
        this.run();

    }

    async extractNewPages(page: WebPage): Promise<Page[]> {
        console.log("vinceroooo");
        let ret: String = await page.evaluate(function () {
            return $('h1').text();
        });
        console.log(ret);
        return undefined;
    }

    extractNewProductUrl(page: WebPage): Promise<String[]> {
        return undefined;
    }

    async extractProductInformation(page: WebPage): Promise<Product[]> {
        console.log("product information");
        return JSON.parse(await page.evaluate(function () {
            return JSON.stringify([{
                title: jQuery('h1').first().text(),
                attributes: jQuery('.services-list > ul > li').map(function () {
                    return $(this).text();
                }).get()
            }])
        }))

    }

}