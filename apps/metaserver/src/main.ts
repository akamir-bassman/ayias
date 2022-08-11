/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app/app.module";
import { Decentverse, srv, db } from "@decentverse/server";
import * as fs from "fs";
import { Model } from "mongoose";
import { getModelToken } from "@nestjs/mongoose";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = "api";
  app.setGlobalPrefix(globalPrefix);
  // const port = process.env.PORT || 8080;
  await app.init();
  console.log({
    address: process.env.ETHER_WALLET_ADDR,
    privateKey: process.env.ETHER_WALLET_PRIVATE_KEY,
    infuraId: process.env.INFURA_PROJECT_ID,
    etherscanApiKey: process.env.ETHERSCAN_API_KEY,
    network: "mainnet",
  });
  const decentverse = new Decentverse({
    objectStorage: {
      region: "ap-northeast-2",
      accessKey: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      bucket: process.env.ASSET_BUCKET_NAME,
      host: process.env.ASSET_BUCKET_HOST,
      distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
    },
    redis: { url: process.env.REDIS_URL },
    mongo: {
      uri: process.env.MONGO_URI,
      dbName: process.env.DB_NAME,
      replSet: process.env.DB_REPLICA_SET,
    },
    klaytn: {
      address: process.env.WALLET_ADDR,
      privateKey: process.env.WALLET_PRIVATE_KEY,
      chainId: process.env.KLAYTN_CHAIN_ID,
      accessKeyId: process.env.KLAYTN_ACCESS_KEY_ID,
      secretAccessKey: process.env.KLAYTN_SECRET_ACCESS_KEY,
    },
    ethereum: {
      address: process.env.ETHER_WALLET_ADDR,
      privateKey: process.env.ETHER_WALLET_PRIVATE_KEY,
      infuraId: process.env.INFURA_PROJECT_ID,
      etherscanApiKey: process.env.ETHERSCAN_API_KEY,
      network: "mainnet",
    },
    // luniverse:{
    //   accessKey: process.env.A,
    //   secretKey:process.env.B
    // },
    item: {
      itemCallbacks: {
        "62f105fce90e09f54e3bb830": async (
          userId: string,
          service: srv.AllService
        ) => {
          await service.userService.syncInventory(userId);
        },
        zxc: async (userId: string, service: srv.AllService) => {
          await service.userService.syncInventory(userId);
        },
      },
    },
  });
  await decentverse.init();
}

bootstrap();
