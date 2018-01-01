import {Job} from "kue";

export class BaseInfo {

    title: string;

    pageUrl: string;

    exportDate: string;

    type: string;

    crawlerIndexingName: string;

    job: Job;

}