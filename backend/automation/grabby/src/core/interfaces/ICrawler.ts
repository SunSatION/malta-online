import {Product} from "../entities/Product";
import {Job} from "kue";
import {CrawlerMetadata} from "../entities/CrawlerMetadata";
import {Page} from "../entities/Page";

export interface ICrawler<T> {


    extractProductInformationFromProductPage(page: T): Promise<Array<Product>>;

    extractProductInformationFromSearchPage(page: T): Promise<Array<Product>>;

    extractProductPageFromProductPage(page: T): Promise<Array<Page>>

    extractProductPageFromSearchPage(page: T): Promise<Array<Page>>

    extractSearchPageFromProductPage(page: T): Promise<Array<Page>>

    extractSearchPageFromSearchPage(page: T): Promise<Array<Page>>


    retrieveEngineInstance(): Promise<null>;

    releaseEngineInstance(): Promise<null>;

    retrievePageJobContent(): Promise<null>;


    setEngineParameter(page: T): Promise<null>;


    crawlerOnFinishCurrentExtract(page: T): Promise<boolean>;

    crawlerWaitForElementSearchPage(page: T): Promise<boolean>;

    crawlerWaitForElementProductPage(page: T): Promise<boolean>;

    crawlerDetectChangeInSearchPage(page: T): Promise<string>;

    crawlerDetectChangeInProductPage(page: T): Promise<string>;

    run(job: Job, crawlerMetadata: CrawlerMetadata): Promise<Array<Array<Page | Product>>>

}

