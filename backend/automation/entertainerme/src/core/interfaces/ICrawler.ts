import {WebPage} from "phantom";
import {Product} from "../Product";

export interface ICrawler<T> {

    extractNewPages(page: WebPage): Promise<Array<Page>>;

    extractNewProductUrl(page: WebPage): Promise<Array<String>>;

    extractProductInformation(page: WebPage): Promise<Array<Product>>;

    retrieveEngineInstance(): Promise<null>;

    releaseEngineInstance(): Promise<null>;

    addPageJob(): boolean;

    addPageJob(): boolean;

    retrievePageJobContent(): Promise<null>;

    run(): Promise<null>

}

