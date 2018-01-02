import {Product} from "../entities/Product";
import {Job} from "kue";
import {CrawlerMetadata} from "../entities/CrawlerMetadata";
import {Page} from "../entities/Page";

export interface ICrawler<T, S> {


    extractProductInformationFromProductPage(page: S): Promise<Array<Product>>;

    extractProductInformationFromSearchPage(page: S): Promise<Array<Product>>;

    extractProductPageFromProductPage(page: S): Promise<Array<Page>>

    extractProductPageFromSearchPage(page: S): Promise<Array<Page>>

    extractSearchPageFromProductPage(page: S): Promise<Array<Page>>

    extractSearchPageFromSearchPage(page: S): Promise<Array<Page>>


    retrieveEngineInstance(): Promise<null>;

    releaseEngineInstance(): Promise<null>;

    retrievePageJobContent(): Promise<null>;


    setEngineParameter(page: T): Promise<null>;


    crawlerOnFinishCurrentExtract(page: S): Promise<boolean>;

    crawlerWaitForElementSearchPage(page: T): Promise<boolean>;

    crawlerWaitForElementProductPage(page: T): Promise<boolean>;

    crawlerDetectChangeInSearchPage(page: T): Promise<string>;

    crawlerDetectChangeInProductPage(page: T): Promise<string>;

    run(job: Job, crawlerMetadata: CrawlerMetadata): Promise<Array<Array<Page | Product>>>

}

