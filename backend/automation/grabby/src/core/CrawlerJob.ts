import * as rd from "redis";

import * as kue from "kue";
import {Job} from "kue";
import * as fs from "fs";
import * as path_module from "path";
import {Page} from "./entities/Page";
//import {Job} from "kue";
//import {ICrawler} from "./interfaces/ICrawler";
//import {PhantomCrawler} from "./engines/phantomjs/PhantomCrawler";

let module_loader: Array<string> = new Array<string>();
let module_instance: Array<any> = new Array<any>();


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

        var crawlerModulesFileList: Array<string> = [];
        this.syncRead(crawlerDir, crawlerModulesFileList);
        console.log(crawlerModulesFileList);
        for (var i = 0; i < crawlerModulesFileList.length; i++) {
            if (crawlerModulesFileList[i].endsWith(".js")) {
                var pathCrawlerName = path_module.basename(crawlerModulesFileList[i], ".js");

                module_loader[pathCrawlerName] = require(__dirname + "/../" + crawlerModulesFileList[i]);
                module_instance[pathCrawlerName] = eval("new module_loader[\"" + pathCrawlerName + "\"]." + pathCrawlerName + "()");
                console.log("page:" + module_instance[pathCrawlerName].initialParameters().crawlerIndexingName + " job listener created");
                var crawlingIndexName = module_instance[pathCrawlerName].initialParameters().crawlerIndexingName;
                (function (crawlingMetadata) {
                    CrawlerJob.jobQueue.process("page:" + pathCrawlerName, async function (job: Job, done: any) {
                            console.log(JSON.stringify(job));
                            let pageJob = <Page>job.data;

                            await module_instance[pageJob.crawlingEngine].run(job, crawlingMetadata);
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
