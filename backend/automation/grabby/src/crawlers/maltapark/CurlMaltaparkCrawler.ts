import {Product} from "../../core/entities/Product";
import {CrawlerMetadata} from "../../core/entities/CrawlerMetadata"
import {Page} from "../../core/entities/Page";
import {CurlCrawler} from "../../core/engines/curl/CurlCrawler";
import {Curl} from "libcurl";
import {unescape} from "querystring";

const libcurl = require('node-libcurl');
const atob = require('atob');
declare var $;

declare var newPage: Page;


export class CurlMaltaparkCrawler extends CurlCrawler {


    private _selectorSearchPageFromSearchPage: Array<string> = ['.pager a', '.hasdd a'];
    private _selectorProductPageFromSearchPage: Array<string> = ['div#item_list div.title a'];

    constructor() {
        super();
        console.log("Phantom Crawler Created");
    }

    async extractSearchPageFromSearchPage($: CheerioStatic): Promise<Array<Page>> {
        let pages: Array<Page> = new Array<Page>();
        for (let selector of this._selectorSearchPageFromSearchPage) {
            let pages2: any = $(selector).map((index, item) => {
                return this.addGenericSearchPage($, item);
            });
            pages = pages.concat(pages2.get());
        }
        return pages;
    }

    async extractSearchPageFromProductPage($: CheerioStatic): Promise<Array<Page>> {
        return null;
    }

    async crawlerDetectChangeInSearchPage(page: Curl): Promise<string> {
        return;
    }

    async crawlerDetectChangeInProductPage(page: Curl): Promise<string> {
        return Math.random().toString(36).substring(7);
        ;
    }

    async crawlerOnFinishCurrentExtract($: CheerioStatic): Promise<boolean> {
        /*
        await page.evaluate(function () {
            $('li.next a')[0].click()
        });
        return false; */
        return await true;
    }

    async crawlerWaitForElementSearchPage(page: Curl): Promise<boolean> {
        return true;
    }

    crawlerWaitForElementProductPage(page: Curl): Promise<boolean> {
        return new Promise((resolve) => {
            resolve(true)
        });
        ;
    }

    async extractProductInformationFromSearchPage($: CheerioStatic): Promise<Product[]> {
        return [];

    }

    async extractProductPageFromProductPage($: CheerioStatic): Promise<Array<Page>> {
        return [];
    }

    async extractProductPageFromSearchPage($: CheerioStatic): Promise<Array<Page>> {
        let pages: Array<Page> = new Array<Page>();
        for (let selector of this._selectorProductPageFromSearchPage) {
            let pages2: any = $(selector).map((index, item) => {
                return this.addGenericSearchPage($, item);
            });
            pages = pages.concat(pages2.get());
        }
        return pages;
    }

    async extractProductInformationFromProductPage($: CheerioStatic): Promise<Array<Product>> {
        let products: Array<Product> = new Array<Product>();

        let product: Product = new Product();

        product.title = $('div.title').first().text();
        product.attributes = new Map<string, string>();
        product['id'] = $('#updControls h1').text();
        product['price'] = $('#divPrice').text();
        let tmp: any = $('#updControls ul > li').map((i, el) => {
            return {
                'category': $(el).find('label').text().replace(':', ''),
                'value': $($(el).contents()[1]).text().trim()
            }
        }).get();
        for (let t of tmp) {
            product.attributes[t.category.trim()] = t.value;
        }

        product['description'] = $('#divMainPane > div.detailwrap > div.section').text().replace('Description', '').trim();
        product['image'] = $('#metaOGImage').attr('content');
        product['phone'] = atob(unescape($('#divTelephone > img:nth-child(2)').attr('src').split('=')[1])).split('=')[1];

        products.push(product)

        return products;
    };

    initialParameters(): CrawlerMetadata {
        var s = new CrawlerMetadata();
        s.initialWebsite = "http://www.maltapark.com";
        s.crawlerIndexingName = "maltapark";
        s.crawlerCronExpression = "0 0 0 1 */1 *";
        s.failedJobsReattampt = 2;
        s.backoffMs = 30000;
        s.jobTTLMs = 60000;
        s.delayBetweenCallsMs = 10000;
        return s;
    }

    async setEngineParameter(page: Curl): Promise<null> {
        page.setOpt(libcurl.Curl.option.HTTPHEADER, ['User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36']);
        page.setOpt(libcurl.Curl.option.VERBOSE, false);
        return null;
    }

    private addGenericSearchPage($, item) {
        let singlePage: Page = new Page();
        singlePage.title = $(item).text();
        singlePage.exportDate = new Date().toISOString();
        singlePage.pageUrl = $(item).attr('href');
        singlePage.baseUri = "http://www.maltapark.com"
        singlePage.crawlingEngine = "CurlMaltaparkCrawler";
        singlePage.type = 'product_page';
        return singlePage;
    }

}
