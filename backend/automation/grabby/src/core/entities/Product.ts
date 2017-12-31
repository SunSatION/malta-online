import {BaseInfo} from "./BaseInfo";

export class Product extends BaseInfo {

    images: Array<string>;

    attributes: Map<string, string>;

    raw: any;

}