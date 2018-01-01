import {CrawlerJob} from "./core/CrawlerJob";


const crawlerJobQueue = CrawlerJob.jobQueue;

// import {CrawlerJob, jobQueue} from "./core/CrawlerJob";

// import {CrawlerFactory} from "./core/CrawlerFactoryPhantom";


// export const redisClient = RedisConnection.redisClient()


async function main() {



    /*
    // const pageItem : string = await page.open("https://www.theentertainerme.com/outlets?category=&location_id=&mall=&hotel=&neighborhood=&cuisine=&query_type=both&SearchOutletsForm[location_id]=21&product=4235&find=true&outlet_location=")

    // console.log(pageItem);
    console.log("Hello world 3");
    await page.close()
    await instance.exit(0)

    let site : Site = new Site();
    site.initialPage = "http://tw"
    */

    //let myFactory : f.CrawlerFactory = new f.CrawlerFactory();


//jobQueue.procesxx)

    var crawlerJob = await new CrawlerJob();
    /*
            var d = new Page();
            d.exportDate = new Date().toISOString();
            d.crawlingEngine = "PhantomEntertainerCrawler";
            d.title = "Test";
            d.pageUrl = "/outlets?SearchOutletsForm[location_id]=21";
            d.baseUri = "https://www.theentertainerme.com";
            d.type = "search_page";
        crawlerJobQueue.create("page:PhantomEntertainerCrawler", d).save((x) => console.log(x))
    */
    crawlerJob.run();

    /*
        CrawlerJob.jobQueue.process("page:entertainerme", async function (job: Job, done : any) {
            console.log(job);

        });
    */

    // console.log("returned");

    return 0;

}


/*
setInterval(function () {
    p.dump();
}, 2000)
p.init()*/
main();






