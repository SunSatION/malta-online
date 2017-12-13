import {CrawlerJob} from "./core/CrawlerJob";

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

    await new CrawlerJob().run();
    // console.log("returned");

    return 0;

}

/*
setInterval(function () {
    p.dump();
}, 2000)
p.init()*/
main();

