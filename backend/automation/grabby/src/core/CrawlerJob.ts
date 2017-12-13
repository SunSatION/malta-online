import * as rd from "redis";

import * as kue from "kue";
import {Job} from "kue";
import * as fs from "fs";
import * as path_module from "path";
//import {Job} from "kue";
//import {ICrawler} from "./interfaces/ICrawler";
//import {PhantomCrawler} from "./engines/phantomjs/PhantomCrawler";

let module_loader: Array<string> = new Array<string>();

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

export const jobQueue = kue.createQueue(redisConfig);

export const redisClient = rd.createClient(redisConfig);

export class CrawlerJob {

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
                console.log(path_module.basename(crawlerModulesFileList[i], ".js");
                module_loader[path_module.basename(crawlerModulesFileList[i], ".js")] = require(__dirname + "/../" + crawlerModulesFileList[i]);

            }
        }


        jobQueue.process("page", function (job: Job) {
            console.log(JSON.stringify(job));
            let pageJob = <Page>job.data;

            eval("new module_loader[\"" + pageJob.crawlingEngine + "\"]." + pageJob.crawlingEngine + "().load().run()");

            console.log(job)
            console.log(pageJob);
            // engine.run(job);
        })
    }
}
