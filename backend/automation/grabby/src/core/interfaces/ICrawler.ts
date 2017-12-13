import {Product} from "../entities/Product";
import {Job} from "kue";

export interface ICrawler<T> {


    extractProductInformationFromProductPage(page: T): Promise<Array<Product>>;

    extractProductInformationFromSearchPage(page: T): Promise<Array<Product>>;

    extractProductPageFromProductPage(page: T): Promise<Array<Page & Product>>

    extractProductPageFromSearchPage(page: T): Promise<Array<Page & Product>>

    extractSearchPageFromProductPage(page: T): Promise<Array<Page>>

    extractSearchPageFromSearchPage(page: T): Promise<Array<Page>>


    retrieveEngineInstance(): Promise<null>;

    releaseEngineInstance(): Promise<null>;

    retrievePageJobContent(): Promise<null>;


    crawlerOnFinishCurrentExtract(page: T): Promise<boolean>;

    crawlerWaitForElement(page: T): Promise<boolean>;

    crawlerDetectChangeInPage(page: T): Promise<string>;


    run(job: Job): Promise<null>

}

