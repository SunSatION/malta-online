import * as genericPool from "generic-pool";
import {Pool} from "generic-pool";
import {PhantomCrawlerFactory} from "../../core/engines/phantomjs/CrawlerFactoryPhantom";
import {PhantomJS, WebPage} from "phantom";
import {PhantomCrawler} from "../../core/engines/phantomjs/PhantomCrawler";
import {Product} from "../../core/entities/Product";


export const crawlerPhantomPool: Pool<PhantomJS> = genericPool.createPool<PhantomJS>(new PhantomCrawlerFactory(), {
    min: 1,
    max: 5
});

declare var $;

declare var newPage: Page;

export class PhantomEntertainerCrawler extends PhantomCrawler {


    constructor() {
        console.log("Phantom Crawler Created");
        super();
    }

    async extractSearchPageFromSearchPage(page: WebPage): Promise<Array<Page>> {
        return JSON.parse(await page.evaluate(function () {
            return JSON.stringify($("ul.pagination li a").map(function (j, k) {
                var newPage = <Page>new Object();
                newPage.title = jQuery(k).attr('title');
                newPage.exportDate = new Date().toISOString();
                newPage.pageUrl = jQuery(k).attr('href');
                newPage.baseUri = window.location.origin;
                newPage.crawlingEngine = this.constructor.toString();
                return newPage
            }).get());
        }));
    }

    extractSearchPageFromProductPage(page: WebPage): Promise<Array<Page>> {
        return null;
    }

    async crawlerDetectChangeInPage(page: WebPage): Promise<string> {

        let x = await page.evaluate(function () {
            return $('div.merchant').first().find('a').attr('title');
            // return JSON.stringify(jQuery(jQuery('div.merchant a')[0]).attr('title'));
        });
        return x;

    }

    async crawlerOnFinishCurrentExtract(page: WebPage): Promise<boolean> {
        /*
        await page.evaluate(function () {
            $('li.next a')[0].click()
        });
        return false; */
        return true;
    }

    crawlerWaitForElement(page: WebPage): Promise<boolean> {
        return page.evaluate(function () {
            var haltOn;

            function looping() {
                if ($('div.row.map_view.hidden').attr('style') === typeof undefined)
                    haltOn = setTimeout(looping, 200);
            }

            haltOn = setTimeout(looping, 200);
            return true;
        })
    }

    async extractNewPages(page: WebPage): Promise<Page[]> {
        console.log("vinceroooo");
        return JSON.parse(await page.evaluate(function () {
            return JSON.stringify($('div.merchant a').map(function (k, item) {
                return {
                    pageUrl: jQuery(item).attr('href'),
                    exportDate: new Date().toISOString(),
                    priority: 1,
                    title: jQuery(item).attr('title')
                }
            }).get())
        }));
        //console.log(ret);
    }

    async extractProductInformationFromSearchPage(page: WebPage): Promise<Product[]> {
        return JSON.parse(await page.evaluate(function () {
            if ((jQuery('a#list_view').length > 0)) {

                $('div.merchant').find('a').first().attr('title');

                return JSON.stringify({"a": "b"});
            }
            ;
            return "";
        }));
    }

    async extractProductsFromSearchPage(page: WebPage): Promise<Product[]> {
        return undefined;
    }


    async extractProductPageFromProductPage(page: WebPage): Promise<Array<Page & Product>> {
        return undefined;
    }

    async extractProductPageFromSearchPage(page: WebPage): Promise<Array<Page & Product>> {
        return undefined;
    }

    async extractProductInformationFromProductPage(page: WebPage): Promise<Array<Product & Page>> {
        // console.log("product information");
        return JSON.parse(await page.evaluate(function () {
            return (jQuery('a#list_view').length == 0) ?
                JSON.stringify([{
                    title: jQuery('h1').first().text(),
                    attributes: jQuery('.services-list > ul > li').map(function () {
                        return $(this).text();
                    }).get()
                }])
                : "[]";
        }))
    }
}
