/*
import * as Redis from "redis";
import {RedisClient} from "redis";



let redisClient: RedisClient = null;


export function getRedisClient() : RedisClient {
    if (this.redisClient == null) {
        this.redisClient = Redis.createClient(redisConfig);

        this.redisClient.on("error", function (err) {
            console.log("Error " + err);
        });
    }
    return redisClient;

}

class CrawlerQueue {

}
*/