import * as genericPool from "generic-pool";
import {Pool} from "generic-pool";
import {PhantomCrawlerFactory} from "../../core/engines/phantomjs/CrawlerFactoryPhantom";
import {PhantomJS, WebPage} from "phantom";
import {PhantomCrawler} from "../../core/engines/phantomjs/PhantomCrawler";
import {Product} from "../../core/entities/Product";
import {CrawlerMetadata} from "../../core/entities/CrawlerMetadata"
import {Page} from "../../core/entities/Page";

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
        var k: Array<Page> = (JSON.parse(await page.evaluate(function () {
            return JSON.stringify($("ul.pagination li a").map(function (j, k) {
                var newPage = <Page>new Object();
                newPage.title = jQuery(k).attr('title');
                newPage.exportDate = new Date().toISOString();
                newPage.pageUrl = jQuery(k).attr('href');
                newPage.baseUri = window.location.origin;
                newPage.crawlingEngine = "PhantomEntertainerCrawler";
                newPage.type = 'search_page';
                return newPage
            }).get());
        })));
        return k;
    }

    async extractSearchPageFromProductPage(page: WebPage): Promise<Array<Page>> {
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

    crawlerWaitForElementSearchPage(page: WebPage): Promise<boolean> {
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

    crawlerWaitForElementProductPage(page: WebPage): Promise<boolean> {
        return new Promise((resolve) => {
            resolve(true)
        });
        ;
    }

    /*
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
    */

    async extractProductInformationFromSearchPage(page: WebPage): Promise<Product[]> {
        return [];
        /*
        return JSON.parse(await page.evaluate(function () {
            if ((jQuery('a#list_view').length > 0)) {
                $('div.merchant').find('a').first().attr('title');
                return JSON.stringify({"a": "b"});
            };
            return "";
        }));
        */
    }

    async extractProductPageFromProductPage(page: WebPage): Promise<Array<Page>> {
        return [];
    }

    async extractProductPageFromSearchPage(page: WebPage): Promise<Array<Page>> {
        return JSON.parse(await page.evaluate(function () {
            return JSON.stringify($('div.merchant a').map(function (k, item) {
                return {
                    baseUri: window.location.origin,
                    pageUrl: jQuery(item).attr('href'),
                    exportDate: new Date().toISOString(),
                    priority: 1,
                    title: jQuery(item).attr('title'),
                    crawlingEngine: "PhantomEntertainerCrawler",
                    type: "product_page"
                }
            }).get())
        }));

    }

    async extractProductInformationFromProductPage(page: WebPage): Promise<Array<Product & Page>> {
        // console.log("product information");
        return JSON.parse(await page.evaluate(function () {
            if (jQuery('a#list_view').length == 0) {
                var product: Product = new Product();
                product = JSON.parse($('script[type="application/ld+json"]').first().text());
                product.title = jQuery('h1').first().text();
                Object.assign(product, {
                    "attributes": jQuery('.services-list > ul > li').map(function () {
                        return $(this).text();
                    }).get()
                });
                Object.assign(product, {
                    "offers": $('.product-block').map(function (x) {
                        return {
                            "product": $(this).find('h2').first().text(),
                            "offers": $(this).find('.offer-tab').map(function (l) {
                                return {
                                    "offerTitle": $(this).find('h3').first().text()
                                }
                            }).get()
                        }
                    }).get()
                });
                return JSON.stringify(product);
            } else {
                return "[]";
            }
        }))
    };

    /*
                JSON.stringify(
                    [{
                    }])
            }))
        }
    */

    initialParameters(): CrawlerMetadata {
        var s = new CrawlerMetadata();
        s.initialWebsite = "http://www.entertainerme.com";
        s.crawlerIndexingName = "entertainerme";
        return s;
    }

    async setEngineParameter(page: WebPage): Promise<null> {
        await page.setting('userAgent', "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36");
        await page.property('viewportSize', {width: 1024, height: 768});
        await page.setting('loadImages', 'false');
        return null;
    }

}
