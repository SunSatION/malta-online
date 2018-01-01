import * as rd from "redis";

import * as kue from "kue";
import {Job} from "kue";
import * as fs from "fs";
import * as path_module from "path";
import {Page} from "./entities/Page";
import * as es from "elasticsearch";
import {Product} from "./entities/Product";
import {CrawlerMetadata} from "./entities/CrawlerMetadata";
//import {Job} from "kue";
//import {ICrawler} from "./interfaces/ICrawler";
//import {PhantomCrawler} from "./engines/phantomjs/PhantomCrawler";

let module_loader: Array<string> = new Array<string>();
let module_instance: Array<any> = new Array<any>();

let cronParser = require('cron-parser')
;

let redisConfig = {
    host: "localhost",
    retry_strategy: function (options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with
            // a individual error
            return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands
            // with a individual error
            return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
            // End reconnecting with built in error
            return undefined;
        }
        // reconnect after
        return Math.min(options.attempt * 100, 3000);
    }
};


export class CrawlerJob {

    static jobQueue = kue.createQueue(redisConfig);

    static redisClient = rd.createClient(redisConfig);


    syncRead(dir, filelist) {
        var fs = fs || require('fs'),
            files = fs.readdirSync(dir);
        filelist = filelist || [];
        files.forEach(function (file) {
            if (fs.statSync(dir + file).isDirectory()) {
                filelist = this.syncRead(dir + file + '/', filelist);
            }
            else {
                filelist.push(dir + file);
            }
        }.bind(this));
        return filelist;
    }


    async run() {


        const crawlerDir = path_module.join("./crawlers/", "");

        let crawlerModulesFileList: Array<string> = [];
        this.syncRead(crawlerDir, crawlerModulesFileList);
        console.log(crawlerModulesFileList);
        for (let i = 0; i < crawlerModulesFileList.length; i++) {
            if (crawlerModulesFileList[i].endsWith(".js")) {
                let pathCrawlerName = path_module.basename(crawlerModulesFileList[i], ".js");

                module_loader[pathCrawlerName] = require(__dirname + "/../" + crawlerModulesFileList[i]);
                module_instance[pathCrawlerName] = eval("new module_loader[\"" + pathCrawlerName + "\"]." + pathCrawlerName + "()");


                console.log("page:" + module_instance[pathCrawlerName].initialParameters().crawlerIndexingName + " job listener created");
                // var crawlingIndexName = module_instance[pathCrawlerName].initialParameters().crawlerIndexingName;

                (function (crawlingMetadata: CrawlerMetadata) {
                    CrawlerJob.jobQueue.process("page:" + pathCrawlerName, async function (job: Job, done: any) {
                            console.log(JSON.stringify(job));
                            let pageJob = <Page>job.data;

                        let newSearchPageToAddToQueue: Array<Page>;
                        let newProductPageToAddToQueue: Array<Page>;
                        let newProductInformationToAddToQueue: Array<Product>;

                        [newSearchPageToAddToQueue, newProductPageToAddToQueue, newProductInformationToAddToQueue] = await module_instance[pageJob.crawlingEngine].run(job, crawlingMetadata);

                        let options = {
                            currentDate: new Date(),
                            endDate: new Date('2019-01-01T00:00:00'),
                            iterator: true
                        };


                        let interval = cronParser.parseExpression(crawlingMetadata.crawlerCronExpression, options);
                        let momentDate = interval.next().value._date;
                        let remainingMilliseconds = momentDate.subtract(new Date().getTime(), 'ms').valueOf()


                        // if (!this.transactionalSave) {

                        // create ElasticSearch Index
                        let esClient: es.Client = new es.Client({'host': 'localhost:9200'});
                        if (!(await esClient.indices.exists({index: crawlingMetadata.crawlerIndexingName}))) {
                            await esClient.indices.create({
                                index: crawlingMetadata.crawlerIndexingName
                            });
                        }

                        // Save Products
                        for (let currentProduct of newProductInformationToAddToQueue) {
                            currentProduct.job = job;
                            console.log(esClient.index<Product>({
                                index: crawlingMetadata.crawlerIndexingName,
                                type: 'product',
                                body: currentProduct
                            }));
                        }
                        let allPages: Array<Page> = newSearchPageToAddToQueue.concat(newProductPageToAddToQueue);

                        let currentPage: any;
                        let currentPageIndex = 0;
                        while ((currentPage = allPages.pop()) != null) {

                            // console.log("check exists - " + 'page:' + currentPage.crawlingEngine + ":" + crawlerMetadata.crawlerIndexingName, currentPage.pageUrl );
                            CrawlerJob.redisClient.exists('page:' + currentPage.crawlingEngine + ":" + crawlingMetadata.crawlerIndexingName + ":" + currentPage.pageUrl, function (err, exists) {
                                if (!exists) {
                                    currentPageIndex = currentPageIndex + 1;
                                    CrawlerJob.jobQueue.inactiveCount('page:' + this.currentPage.crawlingEngine, function (err, totalsInactive) {
                                        CrawlerJob.jobQueue.delayedCount('page:' + this.currentPage.crawlingEngine, function (err, totals) {
                                            CrawlerJob.jobQueue.create('page:' + this.currentPage.crawlingEngine, this.currentPage)
                                                .delay(crawlingMetadata.delayBetweenCallsMs * (totals + 1 + this.currentPageIndex + this.totalsInactive))
                                                .backoff(crawlingMetadata.backoffMs)
                                                .attempts(crawlingMetadata.failedJobsReattampt)
                                                .ttl(crawlingMetadata.jobTTLMs)
                                                .save(function (s) {
                                                    // console.log('hset created - ' + 'page:' + this.currentPage.crawlingEngine + ":" + this.crawlerIndexingName, this.currentPage.pageUrl)
                                                    CrawlerJob.redisClient.set('page:' + this.currentPage.crawlingEngine + ":" + this.crawlerIndexingName + ":" + this.currentPage.pageUrl, new Date().toISOString(), "EX", Math.floor(remainingMilliseconds / 1000), function (d) {
                                                        console.log(d);
                                                    });
                                                }.bind({
                                                    currentPage: this.currentPage,
                                                    crawlerIndexingName: this.crawlerIndexingName,
                                                    currentPageIndex: this.currentPageIndex
                                                }));
                                        }.bind({
                                            currentPage: this.currentPage,
                                            crawlerIndexingName: this.crawlerIndexingName,
                                            currentPageIndex: this.currentPageIndex,
                                            totalsInactive: totalsInactive
                                        }))
                                    }.bind({
                                        currentPage: this.currentPage,
                                        crawlerIndexingName: this.crawlerIndexingName,
                                        currentPageIndex: currentPageIndex
                                    }))
                                    // console.log("added to queue");
                                }

                                return 0;
                            }.bind({
                                currentPage: currentPage,
                                crawlerIndexingName: crawlingMetadata.crawlerIndexingName,
                                currentPageIndex: currentPageIndex
                            }))
                        }
                        // }


                            done();

                            // eval("new module_loader[\"" + pageJob.crawlingEngine + "\"]." + pageJob.crawlingEngine + "().load().run()");

                            // console.log(job)
                            // console.log(pageJob);
                            // engine.run(job);
                        }
                    )
                })(module_instance[pathCrawlerName].initialParameters());
            }
        }
    }
}
