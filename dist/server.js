"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/app.ts
var import_express13 = __toESM(require("express"));
var import_cors = __toESM(require("cors"));
var import_dotenv = __toESM(require("dotenv"));

// src/middleware/auth.middleware.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const decoded = import_jsonwebtoken.default.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId, role: decoded.role };
    next();
    return;
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
    return;
  }
};
var adminOnly = (req, res, next) => {
  if (req.user?.role !== "ADMIN") {
    res.status(403).json({ message: "Forbidden: Admins only" });
    return;
  }
  next();
};
var adminOrManager = (req, res, next) => {
  if (req.user?.role !== "ADMIN" && req.user?.role !== "MANAGER") {
    res.status(403).json({ message: "Forbidden: Admins or Managers only" });
    return;
  }
  next();
};

// src/middleware/error.middleware.ts
var errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  const errorWithStatus = err;
  let statusCode = errorWithStatus.statusCode ?? 500;
  let message = errorWithStatus.message || "Internal Server Error";
  if (errorWithStatus.name === "JsonWebTokenError" || errorWithStatus.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Invalid or expired token";
  }
  if (errorWithStatus.code === "P2002") {
    statusCode = 409;
    message = "Duplicate value violates a unique constraint";
  }
  if (errorWithStatus.code === "P2025") {
    statusCode = 404;
    message = "Requested resource was not found";
  }
  if (statusCode >= 500) {
    console.error(err);
  }
  res.status(statusCode).json({ message });
};

// src/middleware/auth/auth.route.ts
var import_express = require("express");

// src/middleware/auth/auth.controller.ts
var import_axios = __toESM(require("axios"));

// src/config/Prisma.ts
var import_adapter_pg = require("@prisma/adapter-pg");
var import_config = require("dotenv/config");

// src/generated/prisma/internal/class.ts
var runtime = __toESM(require("@prisma/client/runtime/client"));
var config = {
  "previewFeatures": [],
  "clientVersion": "7.5.0",
  "engineVersion": "280c870be64f457428992c43c1f6d557fab6e29e",
  "activeProvider": "postgresql",
  "inlineSchema": 'model Category {\n  id    String @id @default(uuid())\n  name  String @unique\n  ideas Idea[]\n}\n\nmodel Comment {\n  id        String    @id @default(uuid())\n  text      String\n  userId    String\n  ideaId    String\n  parentId  String?\n  user      User      @relation(fields: [userId], references: [id])\n  idea      Idea      @relation(fields: [ideaId], references: [id], onDelete: Cascade)\n  parent    Comment?  @relation("replies", fields: [parentId], references: [id], onDelete: Cascade)\n  replies   Comment[] @relation("replies")\n  createdAt DateTime  @default(now())\n}\n\nenum Role {\n  MEMBER\n  MANAGER\n  ADMIN\n}\n\nenum Status {\n  DRAFT\n  UNDER_REVIEW\n  APPROVED\n  REJECTED\n}\n\nenum VoteType {\n  UP\n  DOWN\n}\n\nenum PaymentStatus {\n  PENDING\n  SUCCESS\n  FAILED\n}\n\nmodel Idea {\n  id            String            @id @default(uuid())\n  title         String\n  problem       String\n  solution      String\n  description   String\n  images        String[]\n  isPaid        Boolean           @default(false)\n  price         Float             @default(0)\n  status        Status            @default(DRAFT)\n  adminFeedback String?\n  categoryId    String\n  authorId      String\n  author        User              @relation(fields: [authorId], references: [id])\n  category      Category          @relation(fields: [categoryId], references: [id])\n  votes         Vote[]\n  comments      Comment[]\n  reviews       Review[]\n  watchlist     Watchlist[]\n  payments      Payment[]\n  interactions  IdeaInteraction[]\n  createdAt     DateTime          @default(now())\n}\n\nmodel IdeaInteraction {\n  id        String   @id @default(uuid())\n  userId    String\n  ideaId    String\n  type      String\n  createdAt DateTime @default(now())\n\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n  idea Idea @relation(fields: [ideaId], references: [id], onDelete: Cascade)\n\n  @@index([userId, createdAt])\n  @@index([ideaId, createdAt])\n  @@index([type, createdAt])\n}\n\nmodel Payment {\n  id        String        @id @default(uuid())\n  userId    String\n  ideaId    String\n  amount    Float\n  status    PaymentStatus @default(PENDING)\n  tranId    String?       @unique\n  user      User          @relation(fields: [userId], references: [id])\n  idea      Idea          @relation(fields: [ideaId], references: [id], onDelete: Cascade)\n  createdAt DateTime      @default(now())\n}\n\nmodel Review {\n  id        String   @id @default(uuid())\n  rating    Int\n  comment   String\n  userId    String\n  ideaId    String\n  user      User     @relation(fields: [userId], references: [id])\n  idea      Idea     @relation(fields: [ideaId], references: [id], onDelete: Cascade)\n  createdAt DateTime @default(now())\n}\n\n// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?\n// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "../src/generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nmodel User {\n  id           String            @id @default(uuid())\n  name         String\n  email        String            @unique\n  password     String\n  role         Role              @default(MEMBER)\n  isActive     Boolean           @default(true)\n  avatar       String?\n  ideas        Idea[]\n  votes        Vote[]\n  comments     Comment[]\n  reviews      Review[]\n  watchlist    Watchlist[]\n  payments     Payment[]\n  interactions IdeaInteraction[]\n  createdAt    DateTime          @default(now())\n}\n\nmodel Vote {\n  id     String   @id @default(uuid())\n  type   VoteType\n  userId String\n  ideaId String\n  user   User     @relation(fields: [userId], references: [id])\n  idea   Idea     @relation(fields: [ideaId], references: [id], onDelete: Cascade)\n\n  @@unique([userId, ideaId])\n}\n\nmodel Watchlist {\n  id     String @id @default(uuid())\n  userId String\n  ideaId String\n  user   User   @relation(fields: [userId], references: [id])\n  idea   Idea   @relation(fields: [ideaId], references: [id], onDelete: Cascade)\n\n  @@unique([userId, ideaId])\n}\n',
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  },
  "parameterizationSchema": {
    "strings": [],
    "graph": ""
  }
};
config.runtimeDataModel = JSON.parse('{"models":{"Category":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"ideas","kind":"object","type":"Idea","relationName":"CategoryToIdea"}],"dbName":null},"Comment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"text","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"ideaId","kind":"scalar","type":"String"},{"name":"parentId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"CommentToUser"},{"name":"idea","kind":"object","type":"Idea","relationName":"CommentToIdea"},{"name":"parent","kind":"object","type":"Comment","relationName":"replies"},{"name":"replies","kind":"object","type":"Comment","relationName":"replies"},{"name":"createdAt","kind":"scalar","type":"DateTime"}],"dbName":null},"Idea":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"problem","kind":"scalar","type":"String"},{"name":"solution","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"images","kind":"scalar","type":"String"},{"name":"isPaid","kind":"scalar","type":"Boolean"},{"name":"price","kind":"scalar","type":"Float"},{"name":"status","kind":"enum","type":"Status"},{"name":"adminFeedback","kind":"scalar","type":"String"},{"name":"categoryId","kind":"scalar","type":"String"},{"name":"authorId","kind":"scalar","type":"String"},{"name":"author","kind":"object","type":"User","relationName":"IdeaToUser"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToIdea"},{"name":"votes","kind":"object","type":"Vote","relationName":"IdeaToVote"},{"name":"comments","kind":"object","type":"Comment","relationName":"CommentToIdea"},{"name":"reviews","kind":"object","type":"Review","relationName":"IdeaToReview"},{"name":"watchlist","kind":"object","type":"Watchlist","relationName":"IdeaToWatchlist"},{"name":"payments","kind":"object","type":"Payment","relationName":"IdeaToPayment"},{"name":"interactions","kind":"object","type":"IdeaInteraction","relationName":"IdeaToIdeaInteraction"},{"name":"createdAt","kind":"scalar","type":"DateTime"}],"dbName":null},"IdeaInteraction":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"ideaId","kind":"scalar","type":"String"},{"name":"type","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"IdeaInteractionToUser"},{"name":"idea","kind":"object","type":"Idea","relationName":"IdeaToIdeaInteraction"}],"dbName":null},"Payment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"ideaId","kind":"scalar","type":"String"},{"name":"amount","kind":"scalar","type":"Float"},{"name":"status","kind":"enum","type":"PaymentStatus"},{"name":"tranId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"PaymentToUser"},{"name":"idea","kind":"object","type":"Idea","relationName":"IdeaToPayment"},{"name":"createdAt","kind":"scalar","type":"DateTime"}],"dbName":null},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"ideaId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"ReviewToUser"},{"name":"idea","kind":"object","type":"Idea","relationName":"IdeaToReview"},{"name":"createdAt","kind":"scalar","type":"DateTime"}],"dbName":null},"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"role","kind":"enum","type":"Role"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"avatar","kind":"scalar","type":"String"},{"name":"ideas","kind":"object","type":"Idea","relationName":"IdeaToUser"},{"name":"votes","kind":"object","type":"Vote","relationName":"UserToVote"},{"name":"comments","kind":"object","type":"Comment","relationName":"CommentToUser"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToUser"},{"name":"watchlist","kind":"object","type":"Watchlist","relationName":"UserToWatchlist"},{"name":"payments","kind":"object","type":"Payment","relationName":"PaymentToUser"},{"name":"interactions","kind":"object","type":"IdeaInteraction","relationName":"IdeaInteractionToUser"},{"name":"createdAt","kind":"scalar","type":"DateTime"}],"dbName":null},"Vote":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"type","kind":"enum","type":"VoteType"},{"name":"userId","kind":"scalar","type":"String"},{"name":"ideaId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"UserToVote"},{"name":"idea","kind":"object","type":"Idea","relationName":"IdeaToVote"}],"dbName":null},"Watchlist":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"ideaId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"UserToWatchlist"},{"name":"idea","kind":"object","type":"Idea","relationName":"IdeaToWatchlist"}],"dbName":null}},"enums":{},"types":{}}');
config.parameterizationSchema = {
  strings: JSON.parse('["where","orderBy","cursor","ideas","user","idea","votes","parent","replies","_count","comments","reviews","watchlist","payments","interactions","author","category","Category.findUnique","Category.findUniqueOrThrow","Category.findFirst","Category.findFirstOrThrow","Category.findMany","data","Category.createOne","Category.createMany","Category.createManyAndReturn","Category.updateOne","Category.updateMany","Category.updateManyAndReturn","create","update","Category.upsertOne","Category.deleteOne","Category.deleteMany","having","_min","_max","Category.groupBy","Category.aggregate","Comment.findUnique","Comment.findUniqueOrThrow","Comment.findFirst","Comment.findFirstOrThrow","Comment.findMany","Comment.createOne","Comment.createMany","Comment.createManyAndReturn","Comment.updateOne","Comment.updateMany","Comment.updateManyAndReturn","Comment.upsertOne","Comment.deleteOne","Comment.deleteMany","Comment.groupBy","Comment.aggregate","Idea.findUnique","Idea.findUniqueOrThrow","Idea.findFirst","Idea.findFirstOrThrow","Idea.findMany","Idea.createOne","Idea.createMany","Idea.createManyAndReturn","Idea.updateOne","Idea.updateMany","Idea.updateManyAndReturn","Idea.upsertOne","Idea.deleteOne","Idea.deleteMany","_avg","_sum","Idea.groupBy","Idea.aggregate","IdeaInteraction.findUnique","IdeaInteraction.findUniqueOrThrow","IdeaInteraction.findFirst","IdeaInteraction.findFirstOrThrow","IdeaInteraction.findMany","IdeaInteraction.createOne","IdeaInteraction.createMany","IdeaInteraction.createManyAndReturn","IdeaInteraction.updateOne","IdeaInteraction.updateMany","IdeaInteraction.updateManyAndReturn","IdeaInteraction.upsertOne","IdeaInteraction.deleteOne","IdeaInteraction.deleteMany","IdeaInteraction.groupBy","IdeaInteraction.aggregate","Payment.findUnique","Payment.findUniqueOrThrow","Payment.findFirst","Payment.findFirstOrThrow","Payment.findMany","Payment.createOne","Payment.createMany","Payment.createManyAndReturn","Payment.updateOne","Payment.updateMany","Payment.updateManyAndReturn","Payment.upsertOne","Payment.deleteOne","Payment.deleteMany","Payment.groupBy","Payment.aggregate","Review.findUnique","Review.findUniqueOrThrow","Review.findFirst","Review.findFirstOrThrow","Review.findMany","Review.createOne","Review.createMany","Review.createManyAndReturn","Review.updateOne","Review.updateMany","Review.updateManyAndReturn","Review.upsertOne","Review.deleteOne","Review.deleteMany","Review.groupBy","Review.aggregate","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","User.upsertOne","User.deleteOne","User.deleteMany","User.groupBy","User.aggregate","Vote.findUnique","Vote.findUniqueOrThrow","Vote.findFirst","Vote.findFirstOrThrow","Vote.findMany","Vote.createOne","Vote.createMany","Vote.createManyAndReturn","Vote.updateOne","Vote.updateMany","Vote.updateManyAndReturn","Vote.upsertOne","Vote.deleteOne","Vote.deleteMany","Vote.groupBy","Vote.aggregate","Watchlist.findUnique","Watchlist.findUniqueOrThrow","Watchlist.findFirst","Watchlist.findFirstOrThrow","Watchlist.findMany","Watchlist.createOne","Watchlist.createMany","Watchlist.createManyAndReturn","Watchlist.updateOne","Watchlist.updateMany","Watchlist.updateManyAndReturn","Watchlist.upsertOne","Watchlist.deleteOne","Watchlist.deleteMany","Watchlist.groupBy","Watchlist.aggregate","AND","OR","NOT","id","userId","ideaId","equals","in","notIn","lt","lte","gt","gte","contains","startsWith","endsWith","not","VoteType","type","name","email","password","Role","role","isActive","avatar","createdAt","every","some","none","rating","comment","amount","PaymentStatus","status","tranId","title","problem","solution","description","images","isPaid","price","Status","adminFeedback","categoryId","authorId","has","hasEvery","hasSome","text","parentId","userId_ideaId","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","push","increment","decrement","multiply","divide"]'),
  graph: "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_ADABFgAAPwAwAwMAAM4EACCsAQEAzwIAIbwBAQDPAgAhAgAAAAEAIBYAAEIAIAKsAQEAzwIAIbwBAQDPAgAhAgAAADgAIBYAAEQAIAIAAAA4ACAWAABEACADAAAAAQAgHQAAPQAgHgAAQgAgAQAAAAEAIAEAAAA4ACADCQAAywQAICMAAM0EACAkAADMBAAgBakBAAC4AgAwqgEAAEsAEKsBAAC4AgAwrAEBAIQCACG8AQEAhAIAIQMAAAA4ACABAABKADAiAABLACADAAAAOAAgAQAAOQAwAgAAAQAgAQAAAA4AIAEAAAAOACADAAAADAAgAQAADQAwAgAADgAgAwAAAAwAIAEAAA0AMAIAAA4AIAMAAAAMACABAAANADACAAAOACAKBAAAvAMAIAUAAL0DACAHAADAAwAgCAAAvgMAIKwBAQAAAAGtAQEAAAABrgEBAAAAAcMBQAAAAAHbAQEAAAAB3AEBAAAAAQEWAABTACAGrAEBAAAAAa0BAQAAAAGuAQEAAAABwwFAAAAAAdsBAQAAAAHcAQEAAAABARYAAFUAMAEWAABVADABAAAADAAgCgQAALoDACAFAACvAwAgBwAAsAMAIAgAALEDACCsAQEAzwIAIa0BAQDPAgAhrgEBAM8CACHDAUAA4wIAIdsBAQDPAgAh3AEBAOICACECAAAADgAgFgAAWQAgBqwBAQDPAgAhrQEBAM8CACGuAQEAzwIAIcMBQADjAgAh2wEBAM8CACHcAQEA4gIAIQIAAAAMACAWAABbACACAAAADAAgFgAAWwAgAQAAAAwAIAMAAAAOACAdAABTACAeAABZACABAAAADgAgAQAAAAwAIAQJAADIBAAgIwAAygQAICQAAMkEACDcAQAA3AIAIAmpAQAAtwIAMKoBAABjABCrAQAAtwIAMKwBAQCEAgAhrQEBAIQCACGuAQEAhAIAIcMBQACQAgAh2wEBAIQCACHcAQEAjwIAIQMAAAAMACABAABiADAiAABjACADAAAADAAgAQAADQAwAgAADgAgAQAAAAUAIAEAAAAFACADAAAAAwAgAQAABAAwAgAABQAgAwAAAAMAIAEAAAQAMAIAAAUAIAMAAAADACABAAAEADACAAAFACAVBgAAoAQAIAoAAKEEACALAACiBAAgDAAAowQAIA0AAKQEACAOAAClBAAgDwAAxwQAIBAAAJ8EACCsAQEAAAABwwFAAAAAAcsBAAAA1QECzQEBAAAAAc4BAQAAAAHPAQEAAAAB0AEBAAAAAdEBAACeBAAg0gEgAAAAAdMBCAAAAAHVAQEAAAAB1gEBAAAAAdcBAQAAAAEBFgAAawAgDawBAQAAAAHDAUAAAAABywEAAADVAQLNAQEAAAABzgEBAAAAAc8BAQAAAAHQAQEAAAAB0QEAAJ4EACDSASAAAAAB0wEIAAAAAdUBAQAAAAHWAQEAAAAB1wEBAAAAAQEWAABtADABFgAAbQAwFQYAANsDACAKAADcAwAgCwAA3QMAIAwAAN4DACANAADfAwAgDgAA4AMAIA8AAMYEACAQAADaAwAgrAEBAM8CACHDAUAA4wIAIcsBAADYA9UBIs0BAQDPAgAhzgEBAM8CACHPAQEAzwIAIdABAQDPAgAh0QEAANcDACDSASAA4QIAIdMBCACDAwAh1QEBAOICACHWAQEAzwIAIdcBAQDPAgAhAgAAAAUAIBYAAHAAIA2sAQEAzwIAIcMBQADjAgAhywEAANgD1QEizQEBAM8CACHOAQEAzwIAIc8BAQDPAgAh0AEBAM8CACHRAQAA1wMAINIBIADhAgAh0wEIAIMDACHVAQEA4gIAIdYBAQDPAgAh1wEBAM8CACECAAAAAwAgFgAAcgAgAgAAAAMAIBYAAHIAIAMAAAAFACAdAABrACAeAABwACABAAAABQAgAQAAAAMAIAYJAADBBAAgIwAAxAQAICQAAMMEACBFAADCBAAgRgAAxQQAINUBAADcAgAgEKkBAACyAgAwqgEAAHkAEKsBAACyAgAwrAEBAIQCACHDAUAAkAIAIcsBAAC0AtUBIs0BAQCEAgAhzgEBAIQCACHPAQEAhAIAIdABAQCEAgAh0QEAALMCACDSASAAjgIAIdMBCACsAgAh1QEBAI8CACHWAQEAhAIAIdcBAQCEAgAhAwAAAAMAIAEAAHgAMCIAAHkAIAMAAAADACABAAAEADACAAAFACABAAAAIQAgAQAAACEAIAMAAAAfACABAAAgADACAAAhACADAAAAHwAgAQAAIAAwAgAAIQAgAwAAAB8AIAEAACAAMAIAACEAIAcEAADrAwAgBQAA-AIAIKwBAQAAAAGtAQEAAAABrgEBAAAAAbsBAQAAAAHDAUAAAAABARYAAIEBACAFrAEBAAAAAa0BAQAAAAGuAQEAAAABuwEBAAAAAcMBQAAAAAEBFgAAgwEAMAEWAACDAQAwBwQAAOkDACAFAAD2AgAgrAEBAM8CACGtAQEAzwIAIa4BAQDPAgAhuwEBAM8CACHDAUAA4wIAIQIAAAAhACAWAACGAQAgBawBAQDPAgAhrQEBAM8CACGuAQEAzwIAIbsBAQDPAgAhwwFAAOMCACECAAAAHwAgFgAAiAEAIAIAAAAfACAWAACIAQAgAwAAACEAIB0AAIEBACAeAACGAQAgAQAAACEAIAEAAAAfACADCQAAvgQAICMAAMAEACAkAAC_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_wEAMCIAAIACACADAAAAFwAgAQAAGAAwAgAAGQAgBqkBAACDAgAwqgEAAIACABCrAQAAgwIAMKwBAQCEAgAhrQEBAIQCACGuAQEAhAIAIQ4JAACGAgAgIwAAhwIAICQAAIcCACCvAQEAAAABsAEBAAAABLEBAQAAAASyAQEAAAABswEBAAAAAbQBAQAAAAG1AQEAAAABtgEBAAAAAbcBAQAAAAG4AQEAAAABuQEBAIUCACEOCQAAhgIAICMAAIcCACAkAACHAgAgrwEBAAAAAbABAQAAAASxAQEAAAAEsgEBAAAAAbMBAQAAAAG0AQEAAAABtQEBAAAAAbYBAQAAAAG3AQEAAAABuAEBAAAAAbkBAQCFAgAhCK8BAgAAAAGwAQIAAAAEsQECAAAABLIBAgAAAAGzAQIAAAABtAECAAAAAbUBAgAAAAG5AQIAhgIAIQuvAQEAAAABsAEBAAAABLEBAQAAAASyAQEAAAABswEBAAAAAbQBAQAAAAG1AQEAAAABtgEBAAAAAbcBAQAAAAG4AQEAAAABuQEBAIcCACEHqQEAAIgCADCqAQAA6gEAEKsBAACIAgAwrAEBAIQCACGtAQEAhAIAIa4BAQCEAgAhuwEAAIkCuwEiBwkAAIYCACAjAACLAgAgJAAAiwIAIK8BAAAAuwECsAEAAAC7AQixAQAAALsBCLkBAACKArsBIgcJAACGAgAgIwAAiwIAICQAAIsCACCvAQAAALsBArABAAAAuwEIsQEAAAC7AQi5AQAAigK7ASIErwEAAAC7AQKwAQAAALsBCLEBAAAAuwEIuQEAAIsCuwEiC6kBAACMAgAwqgEAANQBABCrAQAAjAIAMKwBAQCEAgAhvAEBAIQCACG9AQEAhAIAIb4BAQCEAgAhwAEAAI0CwAEiwQEgAI4CACHCAQEAjwIAIcMBQACQAgAhBwkAAIYCACAjAACZAgAgJAAAmQIAIK8BAAAAwAECsAEAAADAAQixAQAAAMABCLkBAACYAsABIgUJAACGAgAgIwAAlwIAICQAAJcCACCvASAAAAABuQEgAJYCACEOCQAAlAIAICMAAJUCACAkAACVAgAgrwEBAAAAAbABAQAAAAWxAQEAAAAFsgEBAAAAAbMBAQAAAAG0AQEAAAABtQEBAAAAAbYBAQAAAAG3AQEAAAABuAEBAAAAAbkBAQCTAgAhCwkAAIYCACAjAACSAgAgJAAAkgIAIK8BQAAAAAGwAUAAAAAEsQFAAAAABLIBQAAAAAGzAUAAAAABtAFAAAAAAbUBQAAAAAG5AUAAkQIAIQsJAACGAgAgIwAAkgIAICQAAJICACCvAUAAAAABsAFAAAAABLEBQAAAAASyAUAAAAABswFAAAAAAbQBQAAAAAG1AUAAAAABuQFAAJECACEIrwFAAAAAAbABQAAAAASxAUAAAAAEsgFAAAAAAbMBQAAAAAG0AUAAAAABtQFAAAAAAbkBQACSAgAhDgkAAJQCACAjAACVAgAgJAAAlQIAIK8BAQAAAAGwAQEAAAAFsQEBAAAABbIBAQAAAAGzAQEAAAABtAEBAAAAAbUBAQAAAAG2AQEAAAABtwEBAAAAAbgBAQAAAAG5AQEAkwIAIQivAQIAAAABsAECAAAABbEBAgAAAAWyAQIAAAABswECAAAAAbQBAgAAAAG1AQIAAAABuQECAJQCACELrwEBAAAAAbABAQAAAAWxAQEAAAAFsgEBAAAAAbMBAQAAAAG0AQEAAAABtQEBAAAAAbYBAQAAAAG3AQEAAAABuAEBAAAAAbkBAQCVAgAhBQkAAIYCACAjAACXAgAgJAAAlwIAIK8BIAAAAAG5ASAAlgIAIQKvASAAAAABuQEgAJcCACEHCQAAhgIAICMAAJkCACAkAACZAgAgrwEAAADAAQKwAQAAAMABCLEBAAAAwAEIuQEAAJgCwAEiBK8BAAAAwAECsAEAAADAAQixAQAAAMABCLkBAACZAsABIhIDAACgAgAgBgAAoQIAIAoAAKICACALAACjAgAgDAAApAIAIA0AAKUCACAOAACmAgAgqQEAAJoCADCqAQAAwQEAEKsBAACaAgAwrAEBAJsCACG8AQEAmwIAIb0BAQCbAgAhvgEBAJsCACHAAQAAnALAASLBASAAnQIAIcIBAQCeAgAhwwFAAJ8CACELrwEBAAAAAbABAQAAAASxAQEAAAAEsgEBAAAAAbMBAQAAAAG0AQEAAAABtQEBAAAAAbYBAQAAAAG3AQEAAAABuAEBAAAAAbkBAQCHAgAhBK8BAAAAwAECsAEAAADAAQixAQAAAMABCLkBAACZAsABIgKvASAAAAABuQEgAJcCACELrwEBAAAAAbABAQAAAAWxAQEAAAAFsgEBAAAAAbMBAQAAAAG0AQEAAAABtQEBAAAAAbYBAQAAAAG3AQEAAAABuAEBAAAAAbkBAQCVAgAhCK8BQAAAAAGwAUAAAAAEsQFAAAAABLIBQAAAAAGzAUAAAAABtAFAAAAAAbUBQAAAAAG5AUAAkgIAIQPEAQAAAwAgxQEAAAMAIMYBAAADACADxAEAAAgAIMUBAAAIACDGAQAACAAgA8QBAAAMACDFAQAADAAgxgEAAAwAIAPEAQAAEwAgxQEAABMAIMYBAAATACADxAEAABcAIMUBAAAXACDGAQAAFwAgA8QBAAAbACDFAQAAGwAgxgEAABsAIAPEAQAAHwAgxQEAAB8AIMYBAAAfACAJqQEAAKcCADCqAQAAuwEAEKsBAACnAgAwrAEBAIQCACGtAQEAhAIAIa4BAQCEAgAhwwFAAJACACHHAQIAqAIAIcgBAQCEAgAhDQkAAIYCACAjAACGAgAgJAAAhgIAIEUAAKoCACBGAACGAgAgrwECAAAAAbABAgAAAASxAQIAAAAEsgECAAAAAbMBAgAAAAG0AQIAAAABtQECAAAAAbkBAgCpAgAhDQkAAIYCACAjAACGAgAgJAAAhgIAIEUAAKoCACBGAACGAgAgrwECAAAAAbABAgAAAASxAQIAAAAEsgECAAAAAbMBAgAAAAG0AQIAAAABtQECAAAAAbkBAgCpAgAhCK8BCAAAAAGwAQgAAAAEsQEIAAAABLIBCAAAAAGzAQgAAAABtAEIAAAAAbUBCAAAAAG5AQgAqgIAIQqpAQAAqwIAMKoBAAClAQAQqwEAAKsCADCsAQEAhAIAIa0BAQCEAgAhrgEBAIQCACHDAUAAkAIAIckBCACsAgAhywEAAK0CywEizAEBAI8CACENCQAAhgIAICMAAKoCACAkAACqAgAgRQAAqgIAIEYAAKoCACCvAQgAAAABsAEIAAAABLEBCAAAAASyAQgAAAABswEIAAAAAbQBCAAAAAG1AQgAAAABuQEIALACACEHCQAAhgIAICMAAK8CACAkAACvAgAgrwEAAADLAQKwAQAAAMsBCLEBAAAAywEIuQEAAK4CywEiBwkAAIYCACAjAACvAgAgJAAArwIAIK8BAAAAywECsAEAAADLAQixAQAAAMsBCLkBAACuAssBIgSvAQAAAMsBArABAAAAywEIsQEAAADLAQi5AQAArwLLASINCQAAhgIAICMAAKoCACAkAACqAgAgRQAAqgIAIEYAAKoCACCvAQgAAAABsAEIAAAABLEBCAAAAASyAQgAAAABswEIAAAAAbQBCAAAAAG1AQgAAAABuQEIALACACEIqQEAALECADCqAQAAjwEAEKsBAACxAgAwrAEBAIQCACGtAQEAhAIAIa4BAQCEAgAhuwEBAIQCACHDAUAAkAIAIRCpAQAAsgIAMKoBAAB5ABCrAQAAsgIAMKwBAQCEAgAhwwFAAJACACHLAQAAtALVASLNAQEAhAIAIc4BAQCEAgAhzwEBAIQCACHQAQEAhAIAIdEBAACzAgAg0gEgAI4CACHTAQgArAIAIdUBAQCPAgAh1gEBAIQCACHXAQEAhAIAIQSvAQEAAAAF2AEBAAAAAdkBAQAAAATaAQEAAAAEBwkAAIYCACAjAAC2AgAgJAAAtgIAIK8BAAAA1QECsAEAAADVAQixAQAAANUBCLkBAAC1AtUBIgcJAACGAgAgIwAAtgIAICQAALYCACCvAQAAANUBArABAAAA1QEIsQEAAADVAQi5AQAAtQLVASIErwEAAADVAQKwAQAAANUBCLEBAAAA1QEIuQEAALYC1QEiCakBAAC3AgAwqgEAAGMAEKsBAAC3AgAwrAEBAIQCACGtAQEAhAIAIa4BAQCEAgAhwwFAAJACACHbAQEAhAIAIdwBAQCPAgAhBakBAAC4AgAwqgEAAEsAEKsBAAC4AgAwrAEBAIQCACG8AQEAhAIAIQYDAACgAgAgqQEAALkCADCqAQAAOAAQqwEAALkCADCsAQEAmwIAIbwBAQCbAgAhCgQAALsCACAFAAC8AgAgqQEAALoCADCqAQAAHwAQqwEAALoCADCsAQEAmwIAIa0BAQCbAgAhrgEBAJsCACG7AQEAmwIAIcMBQACfAgAhFAMAAKACACAGAAChAgAgCgAAogIAIAsAAKMCACAMAACkAgAgDQAApQIAIA4AAKYCACCpAQAAmgIAMKoBAADBAQAQqwEAAJoCADCsAQEAmwIAIbwBAQCbAgAhvQEBAJsCACG-AQEAmwIAIcABAACcAsABIsEBIACdAgAhwgEBAJ4CACHDAUAAnwIAId4BAADBAQAg3wEAAMEBACAaBgAAoQIAIAoAAKICACALAACjAgAgDAAApAIAIA0AAKUCACAOAACmAgAgDwAAuwIAIBAAAMsCACCpAQAAyQIAMKoBAAADABCrAQAAyQIAMKwBAQCbAgAhwwFAAJ8CACHLAQAAygLVASLNAQEAmwIAIc4BAQCbAgAhzwEBAJsCACHQAQEAmwIAIdEBAACzAgAg0gEgAJ0CACHTAQgAvgIAIdUBAQCeAgAh1gEBAJsCACHXAQEAmwIAId4BAAADACDfAQAAAwAgDAQAALsCACAFAAC8AgAgqQEAAL0CADCqAQAAGwAQqwEAAL0CADCsAQEAmwIAIa0BAQCbAgAhrgEBAJsCACHDAUAAnwIAIckBCAC-AgAhywEAAL8CywEizAEBAJ4CACEIrwEIAAAAAbABCAAAAASxAQgAAAAEsgEIAAAAAbMBCAAAAAG0AQgAAAABtQEIAAAAAbkBCACqAgAhBK8BAAAAywECsAEAAADLAQixAQAAAMsBCLkBAACvAssBIgKtAQEAAAABrgEBAAAAAQgEAAC7AgAgBQAAvAIAIKkBAADBAgAwqgEAABcAEKsBAADBAgAwrAEBAJsCACGtAQEAmwIAIa4BAQCbAgAhCwQAALsCACAFAAC8AgAgqQEAAMICADCqAQAAEwAQqwEAAMICADCsAQEAmwIAIa0BAQCbAgAhrgEBAJsCACHDAUAAnwIAIccBAgDDAgAhyAEBAJsCACEIrwECAAAAAbABAgAAAASxAQIAAAAEsgECAAAAAbMBAgAAAAG0AQIAAAABtQECAAAAAbkBAgCGAgAhDQQAALsCACAFAAC8AgAgBwAAxQIAIAgAAKICACCpAQAAxAIAMKoBAAAMABCrAQAAxAIAMKwBAQCbAgAhrQEBAJsCACGuAQEAmwIAIcMBQACfAgAh2wEBAJsCACHcAQEAngIAIQ8EAAC7AgAgBQAAvAIAIAcAAMUCACAIAACiAgAgqQEAAMQCADCqAQAADAAQqwEAAMQCADCsAQEAmwIAIa0BAQCbAgAhrgEBAJsCACHDAUAAnwIAIdsBAQCbAgAh3AEBAJ4CACHeAQAADAAg3wEAAAwAIAKtAQEAAAABrgEBAAAAAQkEAAC7AgAgBQAAvAIAIKkBAADHAgAwqgEAAAgAEKsBAADHAgAwrAEBAJsCACGtAQEAmwIAIa4BAQCbAgAhuwEAAMgCuwEiBK8BAAAAuwECsAEAAAC7AQixAQAAALsBCLkBAACLArsBIhgGAAChAgAgCgAAogIAIAsAAKMCACAMAACkAgAgDQAApQIAIA4AAKYCACAPAAC7AgAgEAAAywIAIKkBAADJAgAwqgEAAAMAEKsBAADJAgAwrAEBAJsCACHDAUAAnwIAIcsBAADKAtUBIs0BAQCbAgAhzgEBAJsCACHPAQEAmwIAIdABAQCbAgAh0QEAALMCACDSASAAnQIAIdMBCAC-AgAh1QEBAJ4CACHWAQEAmwIAIdcBAQCbAgAhBK8BAAAA1QECsAEAAADVAQixAQAAANUBCLkBAAC2AtUBIggDAACgAgAgqQEAALkCADCqAQAAOAAQqwEAALkCADCsAQEAmwIAIbwBAQCbAgAh3gEAADgAIN8BAAA4ACAAAAAB4wEBAAAAAQUdAACvBQAgHgAAtQUAIOABAACwBQAg4QEAALQFACDmAQAAvgEAIAUdAACtBQAgHgAAsgUAIOABAACuBQAg4QEAALEFACDmAQAABQAgAx0AAK8FACDgAQAAsAUAIOYBAAC-AQAgAx0AAK0FACDgAQAArgUAIOYBAAAFACAAAAAB4wEAAAC7AQIFHQAApQUAIB4AAKsFACDgAQAApgUAIOEBAACqBQAg5gEAAL4BACAFHQAAowUAIB4AAKgFACDgAQAApAUAIOEBAACnBQAg5gEAAAUAIAMdAAClBQAg4AEAAKYFACDmAQAAvgEAIAMdAACjBQAg4AEAAKQFACDmAQAABQAgAAAAAAHjAQAAAMABAgHjASAAAAABAeMBAQAAAAEB4wFAAAAAAQsdAADNAwAwHgAA0gMAMOABAADOAwAw4QEAAM8DADDiAQAA0AMAIOMBAADRAwAw5AEAANEDADDlAQAA0QMAMOYBAADRAwAw5wEAANMDADDoAQAA1AMAMAsdAADBAwAwHgAAxgMAMOABAADCAwAw4QEAAMMDADDiAQAAxAMAIOMBAADFAwAw5AEAAMUDADDlAQAAxQMAMOYBAADFAwAw5wEAAMcDADDoAQAAyAMAMAsdAACkAwAwHgAAqQMAMOABAAClAwAw4QEAAKYDADDiAQAApwMAIOMBAACoAwAw5AEAAKgDADDlAQAAqAMAMOYBAACoAwAw5wEAAKoDADDoAQAAqwMAMAsdAACVAwAwHgAAmgMAMOABAACWAwAw4QEAAJcDADDiAQAAmAMAIOMBAACZAwAw5AEAAJkDADDlAQAAmQMAMOYBAACZAwAw5wEAAJsDADDoAQAAnAMAMAsdAACJAwAwHgAAjgMAMOABAACKAwAw4QEAAIsDADDiAQAAjAMAIOMBAACNAwAw5AEAAI0DADDlAQAAjQMAMOYBAACNAwAw5wEAAI8DADDoAQAAkAMAMAsdAAD5AgAwHgAA_gIAMOABAAD6AgAw4QEAAPsCADDiAQAA_AIAIOMBAAD9AgAw5AEAAP0CADDlAQAA_QIAMOYBAAD9AgAw5wEAAP8CADDoAQAAgAMAMAsdAADrAgAwHgAA8AIAMOABAADsAgAw4QEAAO0CADDiAQAA7gIAIOMBAADvAgAw5AEAAO8CADDlAQAA7wIAMOYBAADvAgAw5wEAAPECADDoAQAA8gIAMAUFAAD4AgAgrAEBAAAAAa4BAQAAAAG7AQEAAAABwwFAAAAAAQIAAAAhACAdAAD3AgAgAwAAACEAIB0AAPcCACAeAAD1AgAgARYAAKIFADAKBAAAuwIAIAUAALwCACCpAQAAugIAMKoBAAAfABCrAQAAugIAMKwBAQAAAAGtAQEAmwIAIa4BAQCbAgAhuwEBAJsCACHDAUAAnwIAIQIAAAAhACAWAAD1AgAgAgAAAPMCACAWAAD0AgAgCKkBAADyAgAwqgEAAPMCABCrAQAA8gIAMKwBAQCbAgAhrQEBAJsCACGuAQEAmwIAIbsBAQCbAgAhwwFAAJ8CACEIqQEAAPICADCqAQAA8wIAEKsBAADyAgAwrAEBAJsCACGtAQEAmwIAIa4BAQCbAgAhuwEBAJsCACHDAUAAnwIAIQSsAQEAzwIAIa4BAQDPAgAhuwEBAM8CACHDAUAA4wIAIQUFAAD2AgAgrAEBAM8CACGuAQEAzwIAIbsBAQDPAgAhwwFAAOMCACEFHQAAnQUAIB4AAKAFACDgAQAAngUAIOEBAACfBQAg5gEAAAUAIAUFAAD4AgAgrAEBAAAAAa4BAQAAAAG7AQEAAAABwwFAAAAAAQMdAACdBQAg4AEAAJ4FACDmAQAABQAgBwUAAIgDACCsAQEAAAABrgEBAAAAAcMBQAAAAAHJAQgAAAABywEAAADLAQLMAQEAAAABAgAAAB0AIB0AAIcDACADAAAAHQAgHQAAhwMAIB4AAIUDACABFgAAnAUAMAwEAAC7AgAgBQAAvAIAIKkBAAC9AgAwqgEAABsAEKsBAAC9AgAwrAEBAAAAAa0BAQCbAgAhrgEBAJsCACHDAUAAnwIAIckBCAC-AgAhywEAAL8CywEizAEBAAAAAQIAAAAdACAWAACFAwAgAgAAAIEDACAWAACCAwAgCqkBAACAAwAwqgEAAIEDABCrAQAAgAMAMKwBAQCbAgAhrQEBAJsCACGuAQEAmwIAIcMBQACfAgAhyQEIAL4CACHLAQAAvwLLASLMAQEAngIAIQqpAQAAgAMAMKoBAACBAwAQqwEAAIADADCsAQEAmwIAIa0BAQCbAgAhrgEBAJsCACHDAUAAnwIAIckBCAC-AgAhywEAAL8CywEizAEBAJ4CACEGrAEBAM8CACGuAQEAzwIAIcMBQADjAgAhyQEIAIMDACHLAQAAhAPLASLMAQEA4gIAIQXjAQgAAAAB6gEIAAAAAesBCAAAAAHsAQgAAAAB7QEIAAAAAQHjAQAAAMsBAgcFAACGAwAgrAEBAM8CACGuAQEAzwIAIcMBQADjAgAhyQEIAIMDACHLAQAAhAPLASLMAQEA4gIAIQUdAACXBQAgHgAAmgUAIOABAACYBQAg4QEAAJkFACDmAQAABQAgBwUAAIgDACCsAQEAAAABrgEBAAAAAcMBQAAAAAHJAQgAAAABywEAAADLAQLMAQEAAAABAx0AAJcFACDgAQAAmAUAIOYBAAAFACADBQAA0wIAIKwBAQAAAAGuAQEAAAABAgAAABkAIB0AAJQDACADAAAAGQAgHQAAlAMAIB4AAJMDACABFgAAlgUAMAkEAAC7AgAgBQAAvAIAIKkBAADBAgAwqgEAABcAEKsBAADBAgAwrAEBAAAAAa0BAQCbAgAhrgEBAJsCACHdAQAAwAIAIAIAAAAZACAWAACTAwAgAgAAAJEDACAWAACSAwAgBqkBAACQAwAwqgEAAJEDABCrAQAAkAMAMKwBAQCbAgAhrQEBAJsCACGuAQEAmwIAIQapAQAAkAMAMKoBAACRAwAQqwEAAJADADCsAQEAmwIAIa0BAQCbAgAhrgEBAJsCACECrAEBAM8CACGuAQEAzwIAIQMFAADRAgAgrAEBAM8CACGuAQEAzwIAIQMFAADTAgAgrAEBAAAAAa4BAQAAAAEGBQAAowMAIKwBAQAAAAGuAQEAAAABwwFAAAAAAccBAgAAAAHIAQEAAAABAgAAABUAIB0AAKIDACADAAAAFQAgHQAAogMAIB4AAKADACABFgAAlQUAMAsEAAC7AgAgBQAAvAIAIKkBAADCAgAwqgEAABMAEKsBAADCAgAwrAEBAAAAAa0BAQCbAgAhrgEBAJsCACHDAUAAnwIAIccBAgDDAgAhyAEBAJsCACECAAAAFQAgFgAAoAMAIAIAAACdAwAgFgAAngMAIAmpAQAAnAMAMKoBAACdAwAQqwEAAJwDADCsAQEAmwIAIa0BAQCbAgAhrgEBAJsCACHDAUAAnwIAIccBAgDDAgAhyAEBAJsCACEJqQEAAJwDADCqAQAAnQMAEKsBAACcAwAwrAEBAJsCACGtAQEAmwIAIa4BAQCbAgAhwwFAAJ8CACHHAQIAwwIAIcgBAQCbAgAhBawBAQDPAgAhrgEBAM8CACHDAUAA4wIAIccBAgCfAwAhyAEBAM8CACEF4wECAAAAAeoBAgAAAAHrAQIAAAAB7AECAAAAAe0BAgAAAAEGBQAAoQMAIKwBAQDPAgAhrgEBAM8CACHDAUAA4wIAIccBAgCfAwAhyAEBAM8CACEFHQAAkAUAIB4AAJMFACDgAQAAkQUAIOEBAACSBQAg5gEAAAUAIAYFAACjAwAgrAEBAAAAAa4BAQAAAAHDAUAAAAABxwECAAAAAcgBAQAAAAEDHQAAkAUAIOABAACRBQAg5gEAAAUAIAgFAAC9AwAgBwAAwAMAIAgAAL4DACCsAQEAAAABrgEBAAAAAcMBQAAAAAHbAQEAAAAB3AEBAAAAAQIAAAAOACAdAAC_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_QIAMOQBAAD9AgAw5QEAAP0CADDmAQAA_QIAMOcBAADxAwAw6AEAAIADADALHQAA4QMAMB4AAOUDADDgAQAA4gMAMOEBAADjAwAw4gEAAOQDACDjAQAA7wIAMOQBAADvAgAw5QEAAO8CADDmAQAA7wIAMOcBAADmAwAw6AEAAPICADAFBAAA6wMAIKwBAQAAAAGtAQEAAAABuwEBAAAAAcMBQAAAAAECAAAAIQAgHQAA6gMAIAMAAAAhACAdAADqAwAgHgAA6AMAIAEWAAD5BAAwAgAAACEAIBYAAOgDACACAAAA8wIAIBYAAOcDACAErAEBAM8CACGtAQEAzwIAIbsBAQDPAgAhwwFAAOMCACEFBAAA6QMAIKwBAQDPAgAhrQEBAM8CACG7AQEAzwIAIcMBQADjAgAhBR0AAPQEACAeAAD3BAAg4AEAAPUEACDhAQAA9gQAIOYBAAC-AQAgBQQAAOsDACCsAQEAAAABrQEBAAAAAbsBAQAAAAHDAUAAAAABAx0AAPQEACDgAQAA9QQAIOYBAAC-AQAgBwQAAPYDACCsAQEAAAABrQEBAAAAAcMBQAAAAAHJAQgAAAABywEAAADLAQLMAQEAAAABAgAAAB0AIB0AAPUDACADAAAAHQAgHQAA9QMAIB4AAPMDACABFgAA8wQAMAIAAAAdACAWAADzAwAgAgAAAIEDACAWAADyAwAgBqwBAQDPAgAhrQEBAM8CACHDAUAA4wIAIckBCACDAwAhywEAAIQDywEizAEBAOICACEHBAAA9AMAIKwBAQDPAgAhrQEBAM8CACHDAUAA4wIAIckBCACDAwAhywEAAIQDywEizAEBAOICACEFHQAA7gQAIB4AAPEEACDgAQAA7wQAIOEBAADwBAAg5gEAAL4BACAHBAAA9gMAIKwBAQAAAAGtAQEAAAABwwFAAAAAAckBCAAAAAHLAQAAAMsBAswBAQAAAAEDHQAA7gQAIOABAADvBAAg5gEAAL4BACADBAAA0gIAIKwBAQAAAAGtAQEAAAABAgAAABkAIB0AAP8DACADAAAAGQAgHQAA_wMAIB4AAP4DACABFgAA7QQAMAIAAAAZACAWAAD-AwAgAgAAAJEDACAWAAD9AwAgAqwBAQDPAgAhrQEBAM8CACEDBAAA0AIAIKwBAQDPAgAhrQEBAM8CACEDBAAA0gIAIKwBAQAAAAGtAQEAAAABBgQAAIoEACCsAQEAAAABrQEBAAAAAcMBQAAAAAHHAQIAAAAByAEBAAAAAQIAAAAVACAdAACJBAAgAwAAABUAIB0AAIkEACAeAACHBAAgARYAAOwEADACAAAAFQAgFgAAhwQAIAIAAACdAwAgFgAAhgQAIAWsAQEAzwIAIa0BAQDPAgAhwwFAAOMCACHHAQIAnwMAIcgBAQDPAgAhBgQAAIgEACCsAQEAzwIAIa0BAQDPAgAhwwFAAOMCACHHAQIAnwMAIcgBAQDPAgAhBR0AAOcEACAeAADqBAAg4AEAAOgEACDhAQAA6QQAIOYBAAC-AQAgBgQAAIoEACCsAQEAAAABrQEBAAAAAcMBQAAAAAHHAQIAAAAByAEBAAAAAQMdAADnBAAg4AEAAOgEACDmAQAAvgEAIAgEAAC8AwAgBwAAwAMAIAgAAL4DACCsAQEAAAABrQEBAAAAAcMBQAAAAAHbAQEAAAAB3AEBAAAAAQIAAAAOACAdAACTBAAgAwAAAA4AIB0AAJMEACAeAACSBAAgARYAAOYEADACAAAADgAgFgAAkgQAIAIAAACsAwAgFgAAkQQAIAWsAQEAzwIAIa0BAQDPAgAhwwFAAOMCACHbAQEAzwIAIdwBAQDiAgAhCAQAALoDACAHAACwAwAgCAAAsQMAIKwBAQDPAgAhrQEBAM8CACHDAUAA4wIAIdsBAQDPAgAh3AEBAOICACEIBAAAvAMAIAcAAMADACAIAAC-AwAgrAEBAAAAAa0BAQAAAAHDAUAAAAAB2wEBAAAAAdwBAQAAAAEEBAAA2gIAIKwBAQAAAAGtAQEAAAABuwEAAAC7AQICAAAACgAgHQAAnAQAIAMAAAAKACAdAACcBAAgHgAAmwQAIAEWAADlBAAwAgAAAAoAIBYAAJsEACACAAAAyQMAIBYAAJoEACADrAEBAM8CACGtAQEAzwIAIbsBAADXArsBIgQEAADYAgAgrAEBAM8CACGtAQEAzwIAIbsBAADXArsBIgQEAADaAgAgrAEBAAAAAa0BAQAAAAG7AQAAALsBAhMGAACgBAAgCgAAoQQAIAsAAKIEACAMAACjBAAgDQAApAQAIA4AAKUEACAQAACfBAAgrAEBAAAAAcMBQAAAAAHLAQAAANUBAs0BAQAAAAHOAQEAAAABzwEBAAAAAdABAQAAAAHRAQAAngQAINIBIAAAAAHTAQgAAAAB1QEBAAAAAdYBAQAAAAEB4wEBAAAABAMdAADjBAAg4AEAAOQEACDmAQAAAQAgBB0AAJQEADDgAQAAlQQAMOIBAACXBAAg5gEAAMUDADAEHQAAiwQAMOABAACMBAAw4gEAAI4EACDmAQAAqAMAMAQdAACABAAw4AEAAIEEADDiAQAAgwQAIOYBAACZAwAwBB0AAPcDADDgAQAA-AMAMOIBAAD6AwAg5gEAAI0DADAEHQAA7AMAMOABAADtAwAw4gEAAO8DACDmAQAA_QIAMAQdAADhAwAw4AEAAOIDADDiAQAA5AMAIOYBAADvAgAwBB0AAM0DADDgAQAAzgMAMOIBAADQAwAg5gEAANEDADAEHQAAwQMAMOABAADCAwAw4gEAAMQDACDmAQAAxQMAMAQdAACkAwAw4AEAAKUDADDiAQAApwMAIOYBAACoAwAwBB0AAJUDADDgAQAAlgMAMOIBAACYAwAg5gEAAJkDADAEHQAAiQMAMOABAACKAwAw4gEAAIwDACDmAQAAjQMAMAQdAAD5AgAw4AEAAPoCADDiAQAA_AIAIOYBAAD9AgAwBB0AAOsCADDgAQAA7AIAMOIBAADuAgAg5gEAAO8CADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABR0AAN4EACAeAADhBAAg4AEAAN8EACDhAQAA4AQAIOYBAAC-AQAgAx0AAN4EACDgAQAA3wQAIOYBAAC-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_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-Ckx_Ck2AAQpOggEKT4QBDlCFASZRhwEKUokBDlOKASdUiwEKVYwBClaNAQ5XkAEoWJEBLFmSAQlakwEJW5QBCVyVAQldlgEJXpgBCV-aAQ5gmwEtYZ0BCWKfAQ5joAEuZKEBCWWiAQlmowEOZ6YBL2inATVpqAEHaqkBB2uqAQdsqwEHbawBB26uAQdvsAEOcLEBNnGzAQdytQEOc7YBN3S3AQd1uAEHdrkBDne8ATh4vQE-eb8BA3rAAQN7wwEDfMQBA33FAQN-xwEDf8kBDoABygE_gQHMAQOCAc4BDoMBzwFAhAHQAQOFAdEBA4YB0gEOhwHVAUGIAdYBRYkB1wEEigHYAQSLAdkBBIwB2gEEjQHbAQSOAd0BBI8B3wEOkAHgAUaRAeIBBJIB5AEOkwHlAUeUAeYBBJUB5wEElgHoAQ6XAesBSJgB7AFMmQHtAQiaAe4BCJsB7wEInAHwAQidAfEBCJ4B8wEInwH1AQ6gAfYBTaEB-AEIogH6AQ6jAfsBTqQB_AEIpQH9AQimAf4BDqcBgQJPqAGCAlM"
};
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer: Buffer2 } = await import("buffer");
  const wasmArray = Buffer2.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.js"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.js");
    return await decodeBase64AsWasm(wasm);
  },
  importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
  return runtime.getPrismaClient(config);
}

// src/generated/prisma/internal/prismaNamespace.ts
var runtime2 = __toESM(require("@prisma/client/runtime/client"));
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var defineExtension = runtime2.Extensions.defineExtension;

// src/generated/prisma/enums.ts
var Status = {
  DRAFT: "DRAFT",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED"
};
var VoteType = {
  UP: "UP",
  DOWN: "DOWN"
};
var PaymentStatus = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED"
};

// src/generated/prisma/client.ts
var PrismaClient = getPrismaClientClass();

// src/config/Prisma.ts
var prismaClient = null;
var normalizePostgresConnectionString = (connectionString) => {
  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get("sslmode");
    const useLibpqCompat = url.searchParams.get("uselibpqcompat");
    if (useLibpqCompat !== "true" && (sslMode === "prefer" || sslMode === "require" || sslMode === "verify-ca")) {
      url.searchParams.set("sslmode", "verify-full");
      return url.toString();
    }
  } catch {
  }
  return connectionString;
};
var getPrismaClient2 = () => {
  if (prismaClient) {
    return prismaClient;
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }
  const normalizedConnectionString = normalizePostgresConnectionString(connectionString);
  const adapter = new import_adapter_pg.PrismaPg({ connectionString: normalizedConnectionString });
  prismaClient = new PrismaClient({ adapter });
  return prismaClient;
};
var prisma = new Proxy({}, {
  get(_target, property, receiver) {
    const client = getPrismaClient2();
    return Reflect.get(client, property, receiver);
  }
});

// src/middleware/auth/auth.service.ts
var import_bcryptjs = __toESM(require("bcryptjs"));
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"));
var import_crypto = __toESM(require("crypto"));
var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var createHttpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};
var issueTokens = (payload) => {
  const accessToken = import_jsonwebtoken2.default.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "15m"
  });
  const refreshToken = import_jsonwebtoken2.default.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });
  return { accessToken, refreshToken };
};
var buildAuthPayload = (user) => {
  const { accessToken, refreshToken } = issueTokens({
    userId: user.id,
    role: user.role
  });
  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};
var loginOrRegisterSocialUser = async (input) => {
  const normalizedEmail = input.email?.trim().toLowerCase() || `${input.provider}_${input.providerId}@social.ecospark.local`;
  const displayName = input.name?.trim() || `${input.provider} user`;
  let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    const randomPassword = import_crypto.default.randomBytes(24).toString("hex");
    const hashedPassword = await import_bcryptjs.default.hash(randomPassword, 10);
    user = await prisma.user.create({
      data: {
        name: displayName,
        email: normalizedEmail,
        password: hashedPassword,
        role: "MEMBER",
        isActive: true
      }
    });
  } else if (displayName && user.name !== displayName) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { name: displayName }
    });
  }
  return buildAuthPayload({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });
};
var registerUser = async (name, email, password) => {
  if (!name?.trim()) {
    throw createHttpError("Name is required", 400);
  }
  if (!email?.trim() || !emailRegex.test(email)) {
    throw createHttpError("Valid email is required", 400);
  }
  if (!password || password.length < 6) {
    throw createHttpError("Password must be at least 6 characters long", 400);
  }
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    throw createHttpError("User already exists", 409);
  }
  const hashedPassword = await import_bcryptjs.default.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: "MEMBER"
      // Default role, adjust as needed
    }
  });
  return buildAuthPayload({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });
};
var loginUser = async (email, password) => {
  if (!email?.trim() || !password) {
    throw createHttpError("Email and password are required", 400);
  }
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) {
    throw createHttpError("Invalid credentials", 401);
  }
  const isMatch = await import_bcryptjs.default.compare(password, user.password);
  if (!isMatch) {
    throw createHttpError("Invalid credentials", 401);
  }
  return buildAuthPayload({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });
};
var refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw createHttpError("Refresh token is required", 401);
  }
  let decoded;
  try {
    decoded = import_jsonwebtoken2.default.verify(refreshToken, process.env.JWT_SECRET);
  } catch {
    throw createHttpError("Invalid or expired refresh token", 401);
  }
  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user) {
    throw createHttpError("User not found", 404);
  }
  const accessToken = import_jsonwebtoken2.default.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  return {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};
var getme = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });
  if (!user) {
    throw createHttpError("User not found", 404);
  }
  return user;
};
var updateMe = async (userId, input) => {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true }
  });
  if (!currentUser) {
    throw createHttpError("User not found", 404);
  }
  const name = input.name?.trim();
  const email = input.email?.trim().toLowerCase();
  if (!name && !email) {
    throw createHttpError("Name or email is required", 400);
  }
  if (name && name.length < 3) {
    throw createHttpError("Name must be at least 3 characters long", 400);
  }
  if (email && !emailRegex.test(email)) {
    throw createHttpError("Valid email is required", 400);
  }
  if (currentUser.role === "ADMIN" && email && email !== currentUser.email) {
    throw createHttpError("Admin can only change name", 403);
  }
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== userId) {
      throw createHttpError("Email already in use", 409);
    }
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...name ? { name } : {},
      ...email ? { email } : {}
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });
  return user;
};

// src/middleware/auth/auth.controller.ts
var getCookieValue = (cookieHeader, key) => {
  if (!cookieHeader) return void 0;
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const cookie = parts.find((part) => part.startsWith(`${key}=`));
  if (!cookie) return void 0;
  return decodeURIComponent(cookie.split("=").slice(1).join("="));
};
var getErrorStatus = (error, fallback = 400) => {
  const maybeError = error;
  return maybeError?.statusCode ?? fallback;
};
var getErrorMessage = (error) => {
  if (error instanceof Error) return error.message;
  return "Unexpected error";
};
var getClientBaseUrl = () => process.env.CLIENT_URL || "http://localhost:3000";
var getServerBaseUrl = (req) => {
  if (process.env.SERVER_PUBLIC_URL) return process.env.SERVER_PUBLIC_URL;
  return `${req.protocol}://${req.get("host")}`;
};
var getRedirectUri = (req, provider) => {
  return `${getServerBaseUrl(req)}/api/auth/${provider}/callback`;
};
var setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1e3
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1e3
  });
};
var redirectWithAuthPayload = (res, payload) => {
  setAuthCookies(res, payload.accessToken, payload.refreshToken);
  const encodedUser = Buffer.from(JSON.stringify(payload.user)).toString("base64url");
  const callbackUrl = `${getClientBaseUrl()}/auth/social-callback?accessToken=${encodeURIComponent(payload.accessToken)}&refreshToken=${encodeURIComponent(payload.refreshToken)}&user=${encodeURIComponent(encodedUser)}`;
  return res.redirect(callbackUrl);
};
var redirectWithAuthError = (res, message) => {
  const callbackUrl = `${getClientBaseUrl()}/auth/social-callback?error=${encodeURIComponent(message)}`;
  return res.redirect(callbackUrl);
};
var register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const result = await registerUser(name, email, password);
    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1e3
      // 15 minutes
    });
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1e3
      // 7 days
    });
    res.status(201).json({ message: "User registered successfully", ...result });
  } catch (error) {
    res.status(getErrorStatus(error, 400)).json({ error: getErrorMessage(error) });
  }
};
var login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1e3
      // 15 minutes
    });
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1e3
      // 7 days
    });
    res.status(200).json({ message: "User logged in successfully", ...result });
  } catch (error) {
    res.status(getErrorStatus(error, 400)).json({ error: getErrorMessage(error) });
  }
};
var refresh = async (req, res) => {
  try {
    const fromCookie = getCookieValue(req.headers.cookie, "refreshToken");
    const refreshToken = fromCookie || req.body?.refreshToken;
    const result = await refreshAccessToken(refreshToken);
    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1e3
    });
    res.status(200).json({ message: "Access token refreshed successfully", ...result });
  } catch (error) {
    res.status(getErrorStatus(error, 401)).json({ error: getErrorMessage(error) });
  }
};
var getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await getme(userId);
    res.status(200).json({ message: "User details fetched successfully", ...result });
  } catch (error) {
    res.status(getErrorStatus(error, 400)).json({ error: getErrorMessage(error) });
  }
};
var updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await updateMe(userId, {
      name: req.body?.name,
      email: req.body?.email
    });
    res.status(200).json({ message: "Profile updated successfully", ...result });
  } catch (error) {
    res.status(getErrorStatus(error, 400)).json({ error: getErrorMessage(error) });
  }
};
var startGoogleAuth = async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = getRedirectUri(req, "google");
  if (!clientId) {
    return res.status(500).json({ error: "Google OAuth is not configured" });
  }
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&prompt=select_account`;
  return res.redirect(googleAuthUrl);
};
var googleCallback = async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) {
      return redirectWithAuthError(res, "Missing Google authorization code");
    }
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = getRedirectUri(req, "google");
    if (!clientId || !clientSecret) {
      return redirectWithAuthError(res, "Google OAuth is not configured");
    }
    const tokenResponse = await import_axios.default.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    });
    const idToken = tokenResponse.data?.id_token;
    const accessToken = tokenResponse.data?.access_token;
    let googleProfile = {};
    if (idToken) {
      const profileResponse = await import_axios.default.get("https://oauth2.googleapis.com/tokeninfo", {
        params: { id_token: idToken }
      });
      googleProfile = {
        id: profileResponse.data?.sub,
        email: profileResponse.data?.email,
        name: profileResponse.data?.name
      };
    } else if (accessToken) {
      const profileResponse = await import_axios.default.get("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      googleProfile = {
        id: profileResponse.data?.id,
        email: profileResponse.data?.email,
        name: profileResponse.data?.name
      };
    }
    if (!googleProfile.id && !googleProfile.email) {
      return redirectWithAuthError(res, "Unable to fetch Google profile");
    }
    const payload = await loginOrRegisterSocialUser({
      provider: "google",
      providerId: googleProfile.id || googleProfile.email || "unknown",
      email: googleProfile.email,
      name: googleProfile.name
    });
    return redirectWithAuthPayload(res, payload);
  } catch (error) {
    return redirectWithAuthError(res, getErrorMessage(error));
  }
};
var startFacebookAuth = async (req, res) => {
  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const redirectUri = getRedirectUri(req, "facebook");
  if (!clientId) {
    return res.status(500).json({ error: "Facebook OAuth is not configured" });
  }
  const facebookAuthUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email,public_profile`;
  return res.redirect(facebookAuthUrl);
};
var facebookCallback = async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) {
      return redirectWithAuthError(res, "Missing Facebook authorization code");
    }
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
    const redirectUri = getRedirectUri(req, "facebook");
    if (!clientId || !clientSecret) {
      return redirectWithAuthError(res, "Facebook OAuth is not configured");
    }
    const tokenResponse = await import_axios.default.get("https://graph.facebook.com/v20.0/oauth/access_token", {
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code
      }
    });
    const providerAccessToken = tokenResponse.data?.access_token;
    if (!providerAccessToken) {
      return redirectWithAuthError(res, "Unable to fetch Facebook access token");
    }
    const profileResponse = await import_axios.default.get("https://graph.facebook.com/me", {
      params: {
        fields: "id,name,email",
        access_token: providerAccessToken
      }
    });
    const profile = {
      id: profileResponse.data?.id,
      name: profileResponse.data?.name,
      email: profileResponse.data?.email
    };
    if (!profile.id && !profile.email) {
      return redirectWithAuthError(res, "Unable to fetch Facebook profile");
    }
    const payload = await loginOrRegisterSocialUser({
      provider: "facebook",
      providerId: profile.id || profile.email || "unknown",
      email: profile.email,
      name: profile.name
    });
    return redirectWithAuthPayload(res, payload);
  } catch (error) {
    return redirectWithAuthError(res, getErrorMessage(error));
  }
};

// src/middleware/auth/auth.route.ts
var router = (0, import_express.Router)();
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.get("/me", authMiddleware, getMe);
router.patch("/me", authMiddleware, updateProfile);
router.get("/google", startGoogleAuth);
router.get("/google/callback", googleCallback);
router.get("/facebook", startFacebookAuth);
router.get("/facebook/callback", facebookCallback);
var auth_route_default = router;

// src/modules/comment/comment.routes.ts
var import_express2 = require("express");

// src/modules/comment/comment.service.ts
var getcomments = async (ideaId) => {
  const allComments = await prisma.comment.findMany({
    where: { ideaId },
    include: {
      user: {
        select: {
          name: true,
          avatar: true
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  });
  const byParent = /* @__PURE__ */ new Map();
  for (const item of allComments) {
    const key = item.parentId ?? null;
    const list = byParent.get(key) ?? [];
    list.push({ ...item, replies: [] });
    byParent.set(key, list);
  }
  const buildTree = (parentId) => {
    const nodes = byParent.get(parentId) ?? [];
    for (const node of nodes) {
      node.replies = buildTree(node.id);
    }
    return nodes;
  };
  return buildTree(null).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};
var addComment = async (ideaId, userId, text, parentId) => {
  const comment = await prisma.comment.create({
    data: {
      text,
      userId,
      ideaId,
      parentId: parentId || null
    },
    include: {
      user: {
        select: {
          name: true,
          avatar: true
        }
      }
    }
  });
  return comment;
};
var deleteComment = async (commentId, userId, role) => {
  const commentfind = await prisma.comment.findUnique({
    where: { id: commentId }
  });
  if (!commentfind) {
    throw new Error("Comment not found");
  }
  if (commentfind.userId !== userId && role !== "ADMIN" && role !== "MANAGER") {
    throw new Error("Unauthorized");
  }
  await prisma.comment.delete({
    where: { id: commentId }
  });
};
var buildCommentWhere = (filters) => {
  const search = filters.search?.trim();
  const where = {};
  if (filters.type === "MAIN") {
    where.parentId = null;
  } else if (filters.type === "REPLY") {
    where.parentId = { not: null };
  }
  if (search) {
    where.OR = [
      { text: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { idea: { title: { contains: search, mode: "insensitive" } } }
    ];
  }
  return where;
};
var getAllCommentsForAdmin = async (page = 1, limit = 10, filters = {}) => {
  const skip = (page - 1) * limit;
  const where = buildCommentWhere(filters);
  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        idea: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: limit
    }),
    prisma.comment.count({ where })
  ]);
  return {
    comments,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
};

// src/modules/comment/commet.controller.ts
var getComments = async (req, res) => {
  try {
    const ideaId = req.params.ideaId;
    const comments = await getcomments(ideaId);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
var addComment2 = async (req, res) => {
  try {
    const ideaId = req.params.ideaId;
    const text = req.body.text ?? req.body.content;
    const parentId = req.body.parentId || void 0;
    const userId = req.user.id;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Comment text is required" });
    }
    await addComment(ideaId, userId, text, parentId);
    res.json({ message: "Comment added successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
var deleteComment2 = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;
    const role = req.user.role;
    await deleteComment(commentId, userId, role);
    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
var getAllCommentsAdmin = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const search = String(req.query.search || "").trim();
    const rawType = String(req.query.type || "").trim().toUpperCase();
    const type = rawType === "MAIN" || rawType === "REPLY" ? rawType : void 0;
    const comments = await getAllCommentsForAdmin(page, limit, {
      search: search || void 0,
      type
    });
    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch comments"
    });
  }
};

// src/modules/comment/comment.routes.ts
var router2 = (0, import_express2.Router)();
router2.get("/admin/all", authMiddleware, adminOrManager, getAllCommentsAdmin);
router2.get("/:ideaId", getComments);
router2.post("/:ideaId", authMiddleware, addComment2);
router2.delete("/:id", authMiddleware, deleteComment2);
var comment_routes_default = router2;

// src/modules/idea/idea.route.ts
var import_express3 = require("express");

// src/modules/idea/idea.service.ts
var SEARCH_AI_MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free";
var createHttpError2 = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};
var daysBetween = (from, to = /* @__PURE__ */ new Date()) => {
  return Math.floor((to.getTime() - from.getTime()) / (1e3 * 60 * 60 * 24));
};
var normalizeText = (value) => value.trim().toLowerCase();
var getAiSearchTerms = async (query) => {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return [];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3200);
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: SEARCH_AI_MODEL,
        messages: [
          {
            role: "system",
            content: "Return only a JSON array of up to 5 short search terms related to the user query. No explanation."
          },
          { role: "user", content: query }
        ],
        temperature: 0.2
      }),
      signal: controller.signal
    });
    if (!response.ok) return [];
    const json = await response.json();
    const raw2 = json.choices?.[0]?.message?.content;
    if (!raw2) return [];
    const parsed = JSON.parse(raw2);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => typeof item === "string" ? item.trim() : "").filter(Boolean).slice(0, 5);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
};
var getSearchSuggestions = async (query, userId) => {
  const input = query.trim();
  if (input.length < 2) return [];
  const aiTerms = await getAiSearchTerms(input);
  const terms = Array.from(
    new Set([input, ...aiTerms].map(normalizeText).filter((term) => term.length >= 2))
  ).slice(0, 6);
  const containsOr = terms.flatMap((term) => [
    { title: { contains: term, mode: "insensitive" } },
    { description: { contains: term, mode: "insensitive" } },
    { problem: { contains: term, mode: "insensitive" } },
    { category: { name: { contains: term, mode: "insensitive" } } }
  ]);
  const [ideas, categories, userPaidCount] = await Promise.all([
    prisma.idea.findMany({
      where: {
        status: Status.APPROVED,
        OR: containsOr
      },
      select: {
        id: true,
        title: true,
        isPaid: true,
        price: true,
        category: { select: { name: true } },
        _count: {
          select: {
            votes: true,
            comments: true,
            reviews: true,
            payments: true
          }
        }
      },
      take: 12,
      orderBy: { createdAt: "desc" }
    }),
    prisma.category.findMany({
      where: {
        OR: terms.map((term) => ({
          name: { contains: term, mode: "insensitive" }
        }))
      },
      select: {
        id: true,
        name: true,
        _count: { select: { ideas: true } }
      },
      take: 6
    }),
    userId ? prisma.payment.count({
      where: {
        userId,
        status: PaymentStatus.SUCCESS
      }
    }) : Promise.resolve(0)
  ]);
  const q = normalizeText(input);
  const ideaSuggestions = ideas.map((idea) => {
    let score = 0;
    const title = normalizeText(idea.title);
    if (title.startsWith(q)) score += 70;
    if (title.includes(q)) score += 30;
    score += Math.min(35, idea._count.votes * 2 + idea._count.reviews * 3 + idea._count.comments);
    if (idea.isPaid && userPaidCount > 0) score += 8;
    return {
      id: idea.id,
      type: "IDEA",
      title: idea.title,
      subtitle: `${idea.category.name} \u2022 ${idea.isPaid ? `Paid $${idea.price.toFixed(2)}` : "Free"}`,
      score
    };
  });
  const categorySuggestions = categories.map((category) => {
    const name = normalizeText(category.name);
    let score = 20;
    if (name.startsWith(q)) score += 45;
    if (name.includes(q)) score += 20;
    score += Math.min(20, category._count.ideas);
    return {
      id: category.id,
      type: "CATEGORY",
      title: category.name,
      subtitle: `${category._count.ideas} ideas`,
      score
    };
  });
  return [...ideaSuggestions, ...categorySuggestions].sort((a, b) => b.score - a.score).slice(0, 10);
};
var getPersonalRecommendations = async (userId) => {
  const ideaInteractionDelegate = prisma.ideaInteraction;
  const [watchlist, successfulPayments, createdIdeas, votes, reviews, comments, interactions] = await Promise.all([
    prisma.watchlist.findMany({
      where: { userId },
      select: { idea: { select: { categoryId: true, category: { select: { name: true } } } } }
    }),
    prisma.payment.findMany({
      where: { userId, status: PaymentStatus.SUCCESS },
      select: {
        idea: {
          select: {
            categoryId: true,
            category: { select: { name: true } },
            isPaid: true
          }
        }
      }
    }),
    prisma.idea.findMany({
      where: { authorId: userId },
      select: { categoryId: true, category: { select: { name: true } } },
      take: 40,
      orderBy: { createdAt: "desc" }
    }),
    prisma.vote.findMany({
      where: { userId },
      select: { idea: { select: { categoryId: true, category: { select: { name: true } } } } },
      take: 80
    }),
    prisma.review.findMany({
      where: { userId },
      select: { idea: { select: { categoryId: true, category: { select: { name: true } } } } },
      take: 80
    }),
    prisma.comment.findMany({
      where: { userId },
      select: { idea: { select: { categoryId: true, category: { select: { name: true } } } } },
      take: 80
    }),
    ideaInteractionDelegate?.findMany ? ideaInteractionDelegate.findMany({
      where: { userId, type: "RECOMMENDATION_CLICK" },
      select: {
        idea: {
          select: {
            categoryId: true,
            category: { select: { name: true } }
          }
        }
      },
      take: 120,
      orderBy: { createdAt: "desc" }
    }).catch(() => []) : Promise.resolve([])
  ]);
  const categoryWeights = /* @__PURE__ */ new Map();
  const addWeight = (categoryId, name, weight) => {
    const prev = categoryWeights.get(categoryId);
    categoryWeights.set(categoryId, {
      name,
      weight: (prev?.weight || 0) + weight
    });
  };
  for (const item of watchlist) addWeight(item.idea.categoryId, item.idea.category.name, 3);
  for (const item of successfulPayments) addWeight(item.idea.categoryId, item.idea.category.name, 4);
  for (const item of createdIdeas) addWeight(item.categoryId, item.category.name, 2);
  for (const item of votes) addWeight(item.idea.categoryId, item.idea.category.name, 2);
  for (const item of reviews) addWeight(item.idea.categoryId, item.idea.category.name, 2);
  for (const item of comments) addWeight(item.idea.categoryId, item.idea.category.name, 1);
  for (const item of interactions) addWeight(item.idea.categoryId, item.idea.category.name, 3);
  const hasPaidBehavior = successfulPayments.length > 0;
  const candidateIdeas = await prisma.idea.findMany({
    where: {
      status: Status.APPROVED,
      authorId: { not: userId }
    },
    select: {
      id: true,
      title: true,
      description: true,
      isPaid: true,
      price: true,
      createdAt: true,
      categoryId: true,
      category: { select: { name: true } },
      _count: {
        select: {
          votes: true,
          comments: true,
          reviews: true,
          payments: true
        }
      }
    },
    take: 120,
    orderBy: { createdAt: "desc" }
  });
  return candidateIdeas.map((idea) => {
    let score = 0;
    const reasons = [];
    const categorySignal = categoryWeights.get(idea.categoryId);
    if (categorySignal) {
      score += categorySignal.weight * 3;
      reasons.push(`matches your interest in ${idea.category.name}`);
    }
    const engagement = idea._count.votes * 2 + idea._count.reviews * 3 + idea._count.comments + idea._count.payments * 4;
    if (engagement > 0) {
      score += Math.min(50, engagement);
      reasons.push("high engagement");
    }
    const ageDays = daysBetween(idea.createdAt);
    const recencyBonus = Math.max(0, 14 - ageDays);
    if (recencyBonus > 0) {
      score += recencyBonus;
      reasons.push("fresh this week");
    }
    if (hasPaidBehavior && idea.isPaid) {
      score += 8;
      reasons.push("premium match");
    }
    if (!hasPaidBehavior && !idea.isPaid) {
      score += 5;
      reasons.push("free starter fit");
    }
    return {
      id: idea.id,
      title: idea.title,
      category: idea.category.name,
      isPaid: idea.isPaid,
      price: idea.price,
      score,
      reasons
    };
  }).sort((a, b) => b.score - a.score).slice(0, 10);
};
var getTrendingRecommendations = async () => {
  const ideas = await prisma.idea.findMany({
    where: { status: Status.APPROVED },
    select: {
      id: true,
      title: true,
      isPaid: true,
      price: true,
      createdAt: true,
      category: { select: { name: true } },
      _count: {
        select: {
          votes: true,
          comments: true,
          reviews: true,
          payments: true
        }
      }
    },
    take: 150,
    orderBy: { createdAt: "desc" }
  });
  return ideas.map((idea) => {
    const engagement = idea._count.votes * 2 + idea._count.reviews * 3 + idea._count.comments + idea._count.payments * 4;
    const recencyBonus = Math.max(0, 14 - daysBetween(idea.createdAt));
    const score = engagement + recencyBonus;
    const reasons = [];
    if (engagement > 0) reasons.push("popular now");
    if (recencyBonus > 0) reasons.push("newly posted");
    return {
      id: idea.id,
      title: idea.title,
      category: idea.category.name,
      isPaid: idea.isPaid,
      price: idea.price,
      score,
      reasons
    };
  }).sort((a, b) => b.score - a.score).slice(0, 10);
};
var trackIdeaInteraction = async (ideaId, userId, type) => {
  const ideaInteractionDelegate = prisma.ideaInteraction;
  if (!ideaInteractionDelegate?.create) {
    return;
  }
  await ideaInteractionDelegate.create({
    data: {
      ideaId,
      userId,
      type
    }
  }).catch(() => {
  });
};
var getRecommendationClickAnalytics = async (days = 7) => {
  const ideaInteractionDelegate = prisma.ideaInteraction;
  if (!ideaInteractionDelegate?.findMany) {
    return { days, totalClicks: 0, topCategories: [] };
  }
  const since = new Date(Date.now() - Math.max(1, days) * 24 * 60 * 60 * 1e3);
  const rows = await ideaInteractionDelegate.findMany({
    where: {
      type: {
        in: ["RECOMMENDATION_CLICK", "TRENDING_CLICK"]
      },
      createdAt: { gte: since }
    },
    select: {
      idea: {
        select: {
          category: { select: { name: true } }
        }
      }
    },
    take: 5e3,
    orderBy: { createdAt: "desc" }
  }).catch(() => []);
  const map = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const categoryName = row.idea?.category?.name || "Unknown";
    map.set(categoryName, (map.get(categoryName) || 0) + 1);
  }
  const topCategories = Array.from(map.entries()).map(([category, clicks]) => ({ category, clicks })).sort((a, b) => b.clicks - a.clicks).slice(0, 6);
  return {
    days,
    totalClicks: rows.length,
    topCategories
  };
};
var getAllIdeas = async (query) => {
  const {
    search,
    category,
    isPaid,
    sort,
    page = "1",
    limit = "10",
    includeTotal = "true"
  } = query;
  const where = {
    status: Status.APPROVED
  };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } }
    ];
  }
  if (category) {
    where.category = { name: category };
  }
  if (isPaid) {
    where.isPaid = isPaid === "true";
  }
  const orderBy = sort === "recent" ? { createdAt: "desc" } : sort === "top" ? { votes: { _count: "desc" } } : sort === "commented" ? { comments: { _count: "desc" } } : { createdAt: "desc" };
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const shouldIncludeTotal = includeTotal !== "false";
  const ideas = await prisma.idea.findMany({
    where,
    orderBy,
    skip,
    take: parseInt(limit),
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      },
      category: true,
      _count: {
        select: {
          votes: true,
          comments: true
        }
      }
    }
  });
  const total = shouldIncludeTotal ? await prisma.idea.count({ where }) : ideas.length;
  return {
    ideas,
    total,
    page: shouldIncludeTotal ? Math.ceil(total / parseInt(limit)) : 1,
    limit: parseInt(limit)
  };
};
var getIdeaById = async (id) => {
  const idea = await prisma.idea.findUniqueOrThrow({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      },
      category: true,
      _count: {
        select: {
          votes: true,
          comments: true
        }
      },
      votes: {
        select: {
          userId: true,
          type: true
        }
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });
  if (!idea) throw new Error("Idea not found");
  return idea;
};
var createIdea = async (data, authorId) => {
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const problem = typeof data.problem === "string" ? data.problem.trim() : "";
  const solution = typeof data.solution === "string" ? data.solution.trim() : "";
  const description = typeof data.description === "string" ? data.description.trim() : "";
  const categoryId = typeof data.categoryId === "string" ? data.categoryId.trim() : "";
  if (!title || !problem || !solution || !description || !categoryId) {
    throw createHttpError2(
      "title, problem, solution, description and categoryId are required",
      400
    );
  }
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw createHttpError2("Invalid categoryId", 400);
  }
  const normalizedImages = Array.isArray(data.images) ? data.images.filter((img) => typeof img === "string" && img.trim() !== "") : typeof data.image === "string" && data.image.trim() ? [data.image.trim()] : [];
  const isPaid = Boolean(data.isPaid);
  const price = Number(data.price ?? 0);
  if (isPaid && (!Number.isFinite(price) || price <= 0)) {
    throw createHttpError2("Paid ideas must have a valid price greater than 0", 400);
  }
  return await prisma.idea.create({
    data: {
      title,
      problem,
      solution,
      description,
      categoryId,
      isPaid,
      price: isPaid ? price : 0,
      authorId,
      status: Status.DRAFT,
      images: normalizedImages
    }
  });
};
var submitIdea = async (id, userId) => {
  const idea = await prisma.idea.findUniqueOrThrow({ where: { id } });
  if (!idea) throw new Error("Idea not found");
  if (idea.authorId !== userId) throw new Error("Unauthorized");
  if (idea.status !== Status.DRAFT && idea.status !== Status.REJECTED && idea.status !== Status.APPROVED) {
    throw new Error("Only draft, rejected, or approved ideas can be submitted");
  }
  return await prisma.idea.update({
    where: { id },
    data: { status: Status.UNDER_REVIEW }
  });
};
var uPdateIdea = async (id, data, userId) => {
  const idea = await prisma.idea.findUniqueOrThrow({ where: { id } });
  if (!idea) throw new Error("Idea not found");
  if (idea.authorId !== userId) throw createHttpError2("Unauthorized", 403);
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const problem = typeof data.problem === "string" ? data.problem.trim() : "";
  const solution = typeof data.solution === "string" ? data.solution.trim() : "";
  const description = typeof data.description === "string" ? data.description.trim() : "";
  const categoryId = typeof data.categoryId === "string" ? data.categoryId.trim() : "";
  if (!title || !problem || !solution || !description || !categoryId) {
    throw createHttpError2(
      "title, problem, solution, description and categoryId are required",
      400
    );
  }
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw createHttpError2("Invalid categoryId", 400);
  }
  if (idea.isPaid) {
    const successfulPaymentCount = await prisma.payment.count({
      where: {
        ideaId: id,
        status: PaymentStatus.SUCCESS
      }
    });
    if (successfulPaymentCount > 0) {
      throw createHttpError2(
        "This paid idea already has successful payments and cannot be edited",
        400
      );
    }
  }
  const normalizedImages = Array.isArray(data.images) ? data.images.filter((img) => typeof img === "string" && img.trim() !== "") : [];
  const isPaid = Boolean(data.isPaid);
  const price = Number(data.price ?? 0);
  if (isPaid && (!Number.isFinite(price) || price <= 0)) {
    throw createHttpError2("Paid ideas must have a valid price greater than 0", 400);
  }
  const nextStatus = idea.status === Status.APPROVED ? Status.UNDER_REVIEW : idea.status;
  return await prisma.idea.update({
    where: { id },
    data: {
      title,
      problem,
      solution,
      description,
      categoryId,
      isPaid,
      price: isPaid ? price : 0,
      images: normalizedImages,
      status: nextStatus
    }
  });
};
var deleteIdea = async (id, userId, role) => {
  const idea = await prisma.idea.findUniqueOrThrow({ where: { id } });
  if (!idea) throw new Error("Idea not found");
  if (idea.authorId !== userId && role !== "ADMIN" && role !== "MANAGER") {
    throw createHttpError2("Unauthorized", 403);
  }
  if (idea.isPaid) {
    const successfulPaymentCount = await prisma.payment.count({
      where: {
        ideaId: id,
        status: PaymentStatus.SUCCESS
      }
    });
    if (successfulPaymentCount > 0) {
      throw createHttpError2(
        "This paid idea already has successful payments and cannot be deleted",
        400
      );
    }
  }
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.vote.deleteMany({ where: { ideaId: id } });
      await tx.review.deleteMany({ where: { ideaId: id } });
      await tx.watchlist.deleteMany({ where: { ideaId: id } });
      await tx.payment.deleteMany({ where: { ideaId: id } });
      await tx.comment.deleteMany({
        where: {
          ideaId: id,
          parentId: { not: null }
        }
      });
      await tx.comment.deleteMany({
        where: {
          ideaId: id,
          parentId: null
        }
      });
      return tx.idea.delete({ where: { id } });
    });
  } catch (error) {
    const err = error;
    if (err.code === "P2003") {
      return await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe('DELETE FROM "Vote" WHERE "ideaId" = $1', id);
        await tx.$executeRawUnsafe('DELETE FROM "Review" WHERE "ideaId" = $1', id);
        await tx.$executeRawUnsafe('DELETE FROM "Watchlist" WHERE "ideaId" = $1', id);
        await tx.$executeRawUnsafe('DELETE FROM "Payment" WHERE "ideaId" = $1', id);
        await tx.comment.deleteMany({
          where: {
            ideaId: id,
            parentId: { not: null }
          }
        });
        await tx.comment.deleteMany({
          where: {
            ideaId: id,
            parentId: null
          }
        });
        return tx.idea.delete({ where: { id } });
      });
    }
    throw error;
  }
};
var getmyIdeas = async (authorId) => {
  return await prisma.idea.findMany({
    where: { authorId },
    include: {
      category: true,
      payments: {
        where: {
          status: PaymentStatus.SUCCESS
        },
        select: {
          id: true
        },
        take: 1
      },
      _count: {
        select: {
          votes: true,
          comments: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
};

// src/modules/idea/ideas.controller.ts
var getAllIdeas2 = async (req, res) => {
  try {
    const result = await getAllIdeas(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
var getSearchSuggestions2 = async (req, res) => {
  try {
    const q = String(req.query.q || "");
    const suggestions = await getSearchSuggestions(q, req.user?.id);
    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
var getPersonalRecommendations2 = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const recommendations = await getPersonalRecommendations(userId);
    res.json({ recommendations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
var getTrendingRecommendations2 = async (_req, res) => {
  try {
    const recommendations = await getTrendingRecommendations();
    res.json({ recommendations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
var trackIdeaInteraction2 = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const ideaId = String(req.params.id || "");
    if (!ideaId) {
      return res.status(400).json({ error: "Idea id is required" });
    }
    const type = typeof req.body?.type === "string" ? req.body.type.trim() : "";
    if (!type) {
      return res.status(400).json({ error: "Interaction type is required" });
    }
    await trackIdeaInteraction(ideaId, userId, type);
    return res.json({ message: "Interaction tracked" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
var getRecommendationClickAnalytics2 = async (req, res) => {
  try {
    const daysValue = Number(req.query.days);
    const days = Number.isFinite(daysValue) && daysValue > 0 ? Math.min(daysValue, 30) : 7;
    const analytics = await getRecommendationClickAnalytics(days);
    return res.json(analytics);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
var getIdeaById2 = async (req, res) => {
  try {
    const id = req.params.id;
    const idea = await getIdeaById(id);
    if (!idea) {
      return res.status(404).json({ error: "Idea not found" });
    }
    res.json(idea);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
var createIdea2 = async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user.id;
    const idea = await createIdea(data, userId);
    res.status(201).json(idea);
  } catch (error) {
    const err = error;
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
};
var submitIdea2 = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;
    await submitIdea(id, userId);
    res.json({ message: "Idea submitted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
var uPdateIdea2 = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    const userId = req.user.id;
    const idea = await uPdateIdea(id, data, userId);
    res.json(idea);
  } catch (error) {
    const err = error;
    res.status(err.statusCode ?? 500).json({
      error: err.message || "An error occurred while updating the idea"
    });
  }
};
var deleteIdea2 = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;
    const role = req.user.role;
    await deleteIdea(id, userId, role);
    res.json({ message: "Idea deleted successfully" });
  } catch (error) {
    const err = error;
    res.status(err.statusCode ?? 500).json({
      error: err.message || "An error occurred while deleting the idea"
    });
  }
};
var getMyIdeas = async (req, res) => {
  try {
    const userId = req.user.id;
    const ideas = await getmyIdeas(userId);
    res.json(ideas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// src/modules/idea/idea.route.ts
var router3 = (0, import_express3.Router)();
router3.get("/", getAllIdeas2);
router3.get("/search/suggestions", getSearchSuggestions2);
router3.get("/recommendations/trending", getTrendingRecommendations2);
router3.get("/recommendations/personal", authMiddleware, getPersonalRecommendations2);
router3.get("/recommendations/analytics-clicks", authMiddleware, adminOrManager, getRecommendationClickAnalytics2);
router3.post("/:id/interactions", authMiddleware, trackIdeaInteraction2);
router3.get("/my", authMiddleware, getMyIdeas);
router3.get("/:id", getIdeaById2);
router3.post("/", authMiddleware, createIdea2);
router3.patch("/:id/submit", authMiddleware, submitIdea2);
router3.patch("/:id", authMiddleware, uPdateIdea2);
router3.delete("/:id", authMiddleware, deleteIdea2);
var idea_route_default = router3;

// src/modules/vote/vote.routes.ts
var import_express4 = require("express");

// src/modules/vote/vote.service.ts
var castVote = async (ideaId, userId, type) => {
  const existing = await prisma.vote.findUnique({
    where: {
      userId_ideaId: {
        userId,
        ideaId
      }
    }
  });
  if (existing) {
    if (existing.type === type) {
      await prisma.vote.delete({
        where: { id: existing.id }
      });
      return { message: "Vote removed successfully" };
    }
    return await prisma.vote.update({
      where: { id: existing.id },
      data: { type }
    });
  }
  return await prisma.vote.create({
    data: {
      ideaId,
      userId,
      type
    }
  });
};

// src/modules/vote/vote.controller.ts
var vote = async (req, res) => {
  try {
    const ideaId = req.params.ideaId;
    const userId = req.user.id;
    const { type } = req.body;
    if (!Object.values(VoteType).includes(type)) {
      return res.status(400).json({ error: "Invalid vote type" });
    }
    const result = await castVote(ideaId, userId, type);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// src/modules/vote/vote.routes.ts
var router4 = (0, import_express4.Router)();
router4.post("/:ideaId", authMiddleware, vote);
var vote_routes_default = router4;

// src/modules/review/review.route.ts
var import_express5 = require("express");

// src/modules/review/review.service.ts
var addreview = async (ideaId, userId, rating, comment) => {
  const existing = await prisma.review.findFirst({
    where: {
      ideaId,
      userId
    }
  });
  if (existing) {
    throw new Error("You have already reviewed this idea");
  }
  return await prisma.review.create({
    data: {
      ideaId,
      userId,
      rating,
      comment
    }
  });
};
var uPdateReview = async (id, userId, data) => {
  const review = await prisma.review.findUniqueOrThrow({
    where: { id }
  });
  if (!review) {
    throw new Error("Review not found");
  }
  if (review.userId !== userId) {
    throw new Error("You can only update your own review");
  }
  return await prisma.review.update({
    where: { id },
    data
  });
};
var deleteReview = async (id, userId) => {
  const review = await prisma.review.findUniqueOrThrow({
    where: { id }
  });
  if (!review) {
    throw new Error("Review not found");
  }
  if (review.userId !== userId) {
    throw new Error("You can only delete your own review");
  }
  return await prisma.review.delete({
    where: { id }
  });
};

// src/modules/review/review.controller.ts
var addreview2 = async (req, res) => {
  try {
    const { ideaId, rating, comment } = req.body;
    const userId = req.user.id;
    const result = await addreview(ideaId, userId, rating, comment);
    res.json(result);
  } catch (error) {
    const message = error.message;
    const status = message === "You have already reviewed this idea" ? 409 : 500;
    res.status(status).json({ message });
  }
};
var uPdateReview2 = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;
    const data = req.body;
    const result = await uPdateReview(id, userId, data);
    res.json(result);
  } catch (error) {
    const message = error.message;
    let status = 500;
    if (message === "Review not found") status = 404;
    if (message === "You can only update your own review") status = 403;
    res.status(status).json({ message });
  }
};
var deleteReview2 = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;
    const result = await deleteReview(id, userId);
    res.json(result);
  } catch (error) {
    const message = error.message;
    let status = 500;
    if (message === "Review not found") status = 404;
    if (message === "You can only delete your own review") status = 403;
    res.status(status).json({ message });
  }
};

// src/modules/review/review.route.ts
var router5 = (0, import_express5.Router)();
router5.post("/", authMiddleware, addreview2);
router5.patch("/:id", authMiddleware, uPdateReview2);
router5.delete("/:id", authMiddleware, deleteReview2);
var review_route_default = router5;

// src/modules/category/category.route.ts
var import_express6 = require("express");

// src/modules/category/category.service.ts
var createCategory = async (name) => {
  return await prisma.category.create({
    data: { name }
  });
};
var getCategories = async () => {
  return await prisma.category.findMany({
    include: {
      _count: {
        select: {
          ideas: true
        }
      }
    },
    orderBy: {
      name: "asc"
    }
  });
};
var deleteCategory = async (id) => {
  return await prisma.category.delete({
    where: { id }
  });
};
var updateCategory = async (id, name) => {
  return await prisma.category.update({
    where: { id },
    data: { name }
  });
};

// src/modules/category/category.controller.ts
var createCategoryController = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    const result = await createCategory(name);
    return res.status(201).json({
      success: true,
      data: result,
      message: "Category created successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create category"
    });
  }
};
var getAllCategoriesController = async (req, res) => {
  try {
    const result = await getCategories();
    return res.status(200).json({
      success: true,
      data: result,
      message: "Categories fetched successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch categories"
    });
  }
};
var deleteCategoryController = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await deleteCategory(id);
    return res.status(200).json({
      success: true,
      data: result,
      message: "Category deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete category"
    });
  }
};
var updateCategoryController = async (req, res) => {
  try {
    const id = req.params.id;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    const result = await updateCategory(id, name);
    return res.status(200).json({
      success: true,
      data: result,
      message: "Category updated successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update category"
    });
  }
};

// src/modules/category/category.route.ts
var router6 = (0, import_express6.Router)();
router6.post("/", authMiddleware, adminOrManager, createCategoryController);
router6.get("/", getAllCategoriesController);
router6.delete("/:id", authMiddleware, adminOrManager, deleteCategoryController);
router6.patch("/:id", authMiddleware, adminOrManager, updateCategoryController);
var category_route_default = router6;

// src/modules/admin/admin.route.ts
var import_express7 = __toESM(require("express"));

// src/modules/admin/admin.service.ts
var getAllIdeas3 = async (page = 1, limit = 10, filters = {}) => {
  const skip = (page - 1) * limit;
  const search = filters.search?.trim();
  const where = {
    ...filters.status ? { status: filters.status } : {},
    ...search ? {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { author: { name: { contains: search, mode: "insensitive" } } },
        { category: { name: { contains: search, mode: "insensitive" } } }
      ]
    } : {}
  };
  const [ideas, total] = await Promise.all([
    prisma.idea.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        category: true,
        _count: {
          select: {
            votes: true,
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: limit
    }),
    prisma.idea.count({ where })
  ]);
  return {
    ideas,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
};
var approveIdea = async (id) => {
  const idea = await prisma.idea.update({
    where: { id },
    data: {
      status: Status.APPROVED,
      adminFeedback: "Approved by admin"
    }
  });
  return idea;
};
var rejectIdea = async (id, feedback) => {
  const idea = await prisma.idea.update({
    where: { id },
    data: {
      status: Status.REJECTED,
      adminFeedback: feedback
    }
  });
  return idea;
};
var getAllUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          ideas: true
        }
      }
    }
  });
  return users;
};
var updateUser = async (id, data) => {
  const user = await prisma.user.update({
    where: { id },
    data
  });
  return user;
};
var deleteUser = async (id) => {
  const user = await prisma.user.delete({
    where: { id }
  });
  return user;
};
var getDashboardStats = async () => {
  const [totalIdeas, totalUsers, pendingIdeas, approvedIdeas, rejectedIdeas] = await Promise.all([
    prisma.idea.count(),
    prisma.user.count(),
    prisma.idea.count({ where: { status: Status.UNDER_REVIEW } }),
    prisma.idea.count({ where: { status: Status.APPROVED } }),
    prisma.idea.count({ where: { status: Status.REJECTED } })
  ]);
  return {
    totalIdeas,
    totalUsers,
    pendingIdeas,
    approvedIdeas,
    rejectedIdeas
  };
};

// src/modules/admin/admin.controller.ts
var getAllIdeasController = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const rawSearch = String(req.query.search || "").trim();
    const rawStatus = String(req.query.status || "").trim().toUpperCase();
    const status = rawStatus && rawStatus in Status ? rawStatus : void 0;
    const result = await getAllIdeas3(page, limit, {
      search: rawSearch || void 0,
      status
    });
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch ideas"
    });
  }
};
var approveIdeaController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await approveIdea(id);
    return res.status(200).json({
      success: true,
      data: result,
      message: "Idea approved successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to approve idea"
    });
  }
};
var rejectIdeaController = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    if (!feedback) {
      return res.status(400).json({
        success: false,
        message: "Feedback is required to reject an idea"
      });
    }
    const result = await rejectIdea(id, feedback);
    return res.status(200).json({
      success: true,
      data: result,
      message: "Idea rejected successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to reject idea"
    });
  }
};
var getAllUsersController = async (req, res) => {
  try {
    const result = await getAllUsers();
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
};
var updateUserController = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const result = await updateUser(id, data);
    res.status(200).json({
      success: true,
      data: result,
      message: "User updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update user"
    });
  }
};
var deleteUserController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteUser(id);
    res.status(200).json({
      success: true,
      data: result,
      message: "User deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete user"
    });
  }
};
var dashboardStatsController = async (req, res) => {
  try {
    const result = await getDashboardStats();
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats"
    });
  }
};

// src/modules/admin/admin.route.ts
var router7 = import_express7.default.Router();
router7.get("/dashboard", authMiddleware, adminOrManager, dashboardStatsController);
router7.get("/ideas", authMiddleware, adminOrManager, getAllIdeasController);
router7.patch("/ideas/:id/approve", authMiddleware, adminOrManager, approveIdeaController);
router7.patch("/ideas/:id/reject", authMiddleware, adminOrManager, rejectIdeaController);
router7.get("/users", authMiddleware, adminOnly, getAllUsersController);
router7.patch("/users/:id", authMiddleware, adminOnly, updateUserController);
router7.delete("/users/:id", authMiddleware, adminOnly, deleteUserController);
var admin_route_default = router7;

// src/modules/watchlist/watchlist.route.ts
var import_express8 = require("express");

// src/modules/watchlist/watchlist.service.ts
var toggleWatchlist = async (ideaId, userId) => {
  const existing = await prisma.watchlist.findUnique({
    where: {
      userId_ideaId: {
        userId,
        ideaId
      }
    }
  });
  if (existing) {
    await prisma.watchlist.delete({
      where: { id: existing.id }
    });
    return { message: "Removed from watchlist" };
  }
  try {
    await prisma.watchlist.create({
      data: {
        userId,
        ideaId
      }
    });
    return { message: "Added to watchlist" };
  } catch (error) {
    const err = error;
    if (err.code === "P2002") {
      const again = await prisma.watchlist.findUnique({
        where: {
          userId_ideaId: {
            userId,
            ideaId
          }
        }
      });
      if (again) {
        await prisma.watchlist.delete({ where: { id: again.id } });
        return { message: "Removed from watchlist" };
      }
    }
    throw error;
  }
};
var getwatchlist = async (userId) => {
  const watchlist = await prisma.watchlist.findMany({
    where: { userId },
    include: {
      idea: {
        include: {
          category: true
        }
      }
    }
  });
  return watchlist;
};

// src/modules/watchlist/watchlist.controller.ts
var toggleWatchlist2 = async (req, res) => {
  try {
    const ideaId = req.params.ideaId;
    const userId = req.user.id;
    if (!ideaId) {
      return res.status(400).json({
        success: false,
        message: "Idea ID is required"
      });
    }
    const result = await toggleWatchlist(ideaId, userId);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
};
var getwatchlist2 = async (req, res) => {
  try {
    const userId = req.user.id;
    const watchlist = await getwatchlist(userId);
    return res.status(200).json({
      success: true,
      data: watchlist,
      message: "Watchlist retrieved successfully"
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
};

// src/modules/watchlist/watchlist.route.ts
var router8 = (0, import_express8.Router)();
router8.get("/", authMiddleware, getwatchlist2);
router8.post("/:ideaId", authMiddleware, toggleWatchlist2);
var watchlist_route_default = router8;

// src/modules/Payment/Payment.route.ts
var import_express9 = require("express");

// src/modules/Payment/Payment.service.ts
var import_stripe = __toESM(require("stripe"));
var stripeClient = null;
var getStripeClient = () => {
  if (stripeClient) {
    return stripeClient;
  }
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  stripeClient = new import_stripe.default(secretKey);
  return stripeClient;
};
var initPayment = async (userId, ideaId) => {
  const stripe = getStripeClient();
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId }
  });
  if (!idea) {
    throw new Error("Idea not found");
  }
  if (!idea.isPaid) {
    throw new Error("Idea is free to view");
  }
  if (idea.authorId === userId) {
    throw new Error("You are the creator of this idea. Payment is not required.");
  }
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  if (!user) {
    throw new Error("User not found");
  }
  const existingPayment = await prisma.payment.findFirst({
    where: {
      userId,
      ideaId,
      status: PaymentStatus.SUCCESS
    }
  });
  if (existingPayment) {
    throw new Error("Payment already exists");
  }
  const payment = await prisma.payment.create({
    data: {
      userId,
      ideaId,
      amount: idea.price,
      status: PaymentStatus.PENDING
    }
  });
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: user.email,
    metadata: {
      paymentId: payment.id,
      userId,
      ideaId
    },
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: Math.round(idea.price * 100),
          // cents
          product_data: {
            name: idea.title,
            description: idea.description
          }
        },
        quantity: 1
      }
    ],
    success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/payment-cancelled`
  });
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      tranId: session.id
    }
  });
  return { url: session.url, paymentId: payment.id };
};
var handleWebhook = async (payload, sig) => {
  const stripe = getStripeClient();
  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw new Error(`Webhook Error: ${err.message}`);
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const paymentId = session.metadata;
    await prisma.payment.update({
      where: { id: paymentId.paymentId },
      data: {
        status: PaymentStatus.SUCCESS
      }
    });
  }
  if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    const paymentId = session.metadata;
    await prisma.payment.update({
      where: { id: paymentId.paymentId },
      data: {
        status: PaymentStatus.FAILED
      }
    });
  }
  return { received: true };
};
var verifySession = async (sessionId, userId) => {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    throw new Error("Payment not processed");
  }
  const payment = await prisma.payment.findFirst({
    where: { tranId: sessionId, userId }
  });
  if (!payment) {
    throw new Error("Payment record not found");
  }
  if (payment.status !== PaymentStatus.SUCCESS) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.SUCCESS }
    });
  }
  return { message: "Payment verified successfully", ideaId: payment.ideaId };
};
var checkAccess = async (ideaId, userId) => {
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId }
  });
  if (!idea) {
    throw new Error("Idea not found");
  }
  if (!idea.isPaid) {
    return { hasAccess: true, message: "This idea is free to view" };
  }
  if (idea.authorId === userId) {
    return { hasAccess: true, message: "Access granted as the idea creator" };
  }
  const payment = await prisma.payment.findFirst({
    where: {
      userId,
      ideaId,
      status: PaymentStatus.SUCCESS
    }
  });
  return { hasAccess: !!payment, message: payment ? "Access granted" : "Access denied. Please purchase to view this idea." };
};
var getAllPaymentsForAdmin = async () => {
  const payments = await prisma.payment.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      },
      idea: {
        select: {
          title: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
  return payments;
};
var getMyPurchasedIdeas = async (userId) => {
  const payments = await prisma.payment.findMany({
    where: {
      userId,
      status: PaymentStatus.SUCCESS
    },
    include: {
      idea: {
        include: {
          category: true,
          _count: {
            select: {
              votes: true,
              comments: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
  const seenIdeaIds = /* @__PURE__ */ new Set();
  const uniquePurchasedIdeas = [];
  for (const payment of payments) {
    if (seenIdeaIds.has(payment.ideaId)) {
      continue;
    }
    seenIdeaIds.add(payment.ideaId);
    uniquePurchasedIdeas.push({
      id: payment.idea.id,
      title: payment.idea.title,
      status: payment.idea.status,
      category: payment.idea.category ? { id: payment.idea.category.id, name: payment.idea.category.name } : null,
      isPaid: Boolean(payment.idea.isPaid),
      price: Number(payment.idea.price ?? payment.amount ?? 0),
      createdAt: payment.idea.createdAt,
      purchasedAt: payment.createdAt,
      _count: {
        votes: payment.idea._count?.votes ?? 0,
        comments: payment.idea._count?.comments ?? 0
      }
    });
  }
  return uniquePurchasedIdeas;
};

// src/modules/Payment/Payment.controller.ts
var initPayment2 = async (req, res) => {
  try {
    const { ideaId } = req.body;
    const result = await initPayment(req.user.id, ideaId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
var handleWebhook2 = async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];
    const payload = req.body;
    const result = await handleWebhook(payload, sig);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
var verifySession2 = async (req, res) => {
  try {
    const sessionId = req.query.sessionId || "";
    const result = await verifySession(sessionId, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
var checkAccess2 = async (req, res) => {
  try {
    const { ideaId } = req.params;
    const result = await checkAccess(ideaId, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
var getAllPaymentsForAdmin2 = async (req, res) => {
  try {
    const result = await getAllPaymentsForAdmin();
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch payments";
    res.status(500).json({
      success: false,
      message
    });
  }
};
var getMyPurchasedIdeas2 = async (req, res) => {
  try {
    const result = await getMyPurchasedIdeas(req.user.id);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch purchased ideas";
    res.status(500).json({
      success: false,
      message
    });
  }
};

// src/modules/Payment/Payment.route.ts
var router9 = (0, import_express9.Router)();
router9.post("/init", authMiddleware, initPayment2);
router9.get("/verify", authMiddleware, verifySession2);
router9.get("/access/:ideaId", authMiddleware, checkAccess2);
router9.get("/my-ideas", authMiddleware, getMyPurchasedIdeas2);
router9.get("/admin", authMiddleware, adminOnly, getAllPaymentsForAdmin2);
var Payment_route_default = router9;

// src/modules/stats/stats.route.ts
var import_express10 = __toESM(require("express"));

// src/modules/stats/stats.controller.ts
var getStats = async (req, res) => {
  try {
    const [ideasShared, members, approved] = await Promise.all([
      prisma.idea.count(),
      prisma.user.count(),
      prisma.idea.count({ where: { status: "APPROVED" } })
    ]);
    res.json({
      ideasShared,
      members,
      approved
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};

// src/modules/stats/stats.route.ts
var router10 = import_express10.default.Router();
router10.get("/", getStats);
var stats_route_default = router10;

// src/modules/CHTBOT/chat.router.ts
var import_express11 = __toESM(require("express"));

// src/modules/CHTBOT/db.ts
async function getProjectSnapshot(message, userId) {
  const keyword = message.trim();
  const [
    userCount,
    categoryCount,
    ideaCount,
    freeIdeaCount,
    paidIdeaCount,
    approvedIdeaCount,
    commentCount,
    reviewCount,
    voteCount,
    paymentCount,
    watchlistCount,
    categories,
    matchedCategories,
    matchedIdeas,
    latestIdeas,
    freeIdeaSamples,
    paidIdeaSamples,
    userCreatedIdeas,
    userPaymentHistory,
    userPayments,
    userCommentsCount,
    userReviewsCount,
    userVotesCount,
    userWatchlistCount,
    userWatchlist
  ] = await Promise.all([
    prisma.user.count(),
    prisma.category.count(),
    prisma.idea.count(),
    prisma.idea.count({ where: { isPaid: false } }),
    prisma.idea.count({ where: { isPaid: true } }),
    prisma.idea.count({ where: { status: "APPROVED" } }),
    prisma.comment.count(),
    prisma.review.count(),
    prisma.vote.count(),
    prisma.payment.count(),
    prisma.watchlist.count(),
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            ideas: true
          }
        }
      },
      take: 12,
      orderBy: {
        name: "asc"
      }
    }),
    prisma.category.findMany({
      where: {
        name: {
          contains: keyword,
          mode: "insensitive"
        }
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            ideas: true
          }
        }
      },
      take: 5
    }),
    prisma.idea.findMany({
      where: {
        OR: [
          { title: { contains: keyword, mode: "insensitive" } },
          { problem: { contains: keyword, mode: "insensitive" } },
          { solution: { contains: keyword, mode: "insensitive" } },
          { description: { contains: keyword, mode: "insensitive" } },
          { category: { name: { contains: keyword, mode: "insensitive" } } }
        ]
      },
      select: {
        id: true,
        title: true,
        status: true,
        isPaid: true,
        price: true,
        category: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            comments: true,
            votes: true,
            reviews: true,
            payments: true
          }
        }
      },
      take: 8,
      orderBy: {
        createdAt: "desc"
      }
    }),
    prisma.idea.findMany({
      select: {
        title: true,
        status: true,
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 6
    }),
    prisma.idea.findMany({
      where: {
        isPaid: false,
        status: "APPROVED"
      },
      select: {
        title: true,
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 6
    }),
    prisma.idea.findMany({
      where: {
        isPaid: true,
        status: "APPROVED"
      },
      select: {
        title: true,
        price: true,
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 6
    }),
    userId ? prisma.idea.findMany({
      where: { authorId: userId },
      select: {
        title: true,
        status: true,
        isPaid: true
      },
      orderBy: { createdAt: "desc" },
      take: 8
    }) : Promise.resolve([]),
    userId ? prisma.payment.findMany({
      where: { userId },
      select: {
        amount: true,
        status: true,
        createdAt: true,
        idea: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10
    }) : Promise.resolve([]),
    userId ? prisma.payment.findMany({
      where: {
        userId,
        status: "SUCCESS"
      },
      select: {
        amount: true,
        idea: {
          select: {
            id: true,
            title: true,
            isPaid: true,
            category: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    }) : Promise.resolve([]),
    userId ? prisma.comment.count({ where: { userId } }) : Promise.resolve(0),
    userId ? prisma.review.count({ where: { userId } }) : Promise.resolve(0),
    userId ? prisma.vote.count({ where: { userId } }) : Promise.resolve(0),
    userId ? prisma.watchlist.count({ where: { userId } }) : Promise.resolve(0),
    userId ? prisma.watchlist.findMany({
      where: { userId },
      select: {
        idea: {
          select: {
            category: {
              select: {
                name: true
              }
            }
          }
        }
      },
      take: 20
    }) : Promise.resolve([])
  ]);
  const purchasedPaidIdeas = userPayments.filter((payment) => payment.idea.isPaid).length;
  const totalPayments = userPaymentHistory.length;
  const successfulPayments = userPaymentHistory.filter((payment) => payment.status === "SUCCESS").length;
  const pendingPayments = userPaymentHistory.filter((payment) => payment.status === "PENDING").length;
  const failedPayments = userPaymentHistory.filter((payment) => payment.status === "FAILED").length;
  const createdIdeasCount = userCreatedIdeas.length;
  const createdPaidIdeasCount = userCreatedIdeas.filter((idea) => idea.isPaid).length;
  const totalSpent = userPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const preferredCategorySet = /* @__PURE__ */ new Set([
    ...userPayments.map((payment) => payment.idea.category.name),
    ...userWatchlist.map((watchItem) => watchItem.idea.category.name)
  ]);
  const preferredCategories = Array.from(preferredCategorySet).slice(0, 6);
  return {
    counts: {
      users: userCount,
      categories: categoryCount,
      ideas: ideaCount,
      freeIdeas: freeIdeaCount,
      paidIdeas: paidIdeaCount,
      approvedIdeas: approvedIdeaCount,
      comments: commentCount,
      reviews: reviewCount,
      votes: voteCount,
      payments: paymentCount,
      watchlist: watchlistCount
    },
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      ideasCount: category._count.ideas
    })),
    matchedCategories: matchedCategories.map((category) => ({
      id: category.id,
      name: category.name,
      ideasCount: category._count.ideas
    })),
    matchedIdeas: matchedIdeas.map((idea) => ({
      id: idea.id,
      title: idea.title,
      status: idea.status,
      isPaid: idea.isPaid,
      price: idea.price,
      category: idea.category.name,
      comments: idea._count.comments,
      votes: idea._count.votes,
      reviews: idea._count.reviews,
      payments: idea._count.payments
    })),
    latestIdeas: latestIdeas.map((idea) => ({
      title: idea.title,
      status: idea.status,
      category: idea.category.name
    })),
    freeIdeaSamples: freeIdeaSamples.map((idea) => ({
      title: idea.title,
      category: idea.category.name
    })),
    paidIdeaSamples: paidIdeaSamples.map((idea) => ({
      title: idea.title,
      category: idea.category.name,
      price: idea.price
    })),
    user: {
      id: userId || null,
      totalPayments,
      successfulPayments,
      pendingPayments,
      failedPayments,
      paidPurchases: userPayments.length,
      totalSpent,
      purchasedPaidIdeas,
      createdIdeasCount,
      createdPaidIdeasCount,
      commentsCount: userCommentsCount,
      reviewsCount: userReviewsCount,
      votesCount: userVotesCount,
      watchlistCount: userWatchlistCount,
      latestCreatedIdeas: userCreatedIdeas,
      latestPayments: userPaymentHistory.map((payment) => ({
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt,
        ideaTitle: payment.idea.title
      })),
      latestPurchasedIdeas: userPayments.map((payment) => payment.idea.title),
      preferredCategories
    }
  };
}
async function getContextFromDB(message, userId) {
  const snapshot = await getProjectSnapshot(message, userId);
  const lines = [];
  lines.push("EcoSpark database snapshot (user profile data excluded):");
  lines.push(
    `Counts -> users: ${snapshot.counts.users}, categories: ${snapshot.counts.categories}, ideas/projects: ${snapshot.counts.ideas}, free ideas: ${snapshot.counts.freeIdeas}, paid ideas: ${snapshot.counts.paidIdeas}, approved ideas: ${snapshot.counts.approvedIdeas}, comments: ${snapshot.counts.comments}, reviews: ${snapshot.counts.reviews}, votes: ${snapshot.counts.votes}, payments: ${snapshot.counts.payments}, watchlist: ${snapshot.counts.watchlist}.`
  );
  if (snapshot.categories.length > 0) {
    lines.push(`Available categories: ${snapshot.categories.map((category) => category.name).join(", ")}`);
  }
  if (snapshot.matchedCategories.length > 0) {
    lines.push("Matched categories:");
    for (const category of snapshot.matchedCategories) {
      lines.push(`- ${category.name} (ideas: ${category.ideasCount})`);
    }
  }
  if (snapshot.matchedIdeas.length > 0) {
    lines.push("Matched ideas/projects:");
    for (const idea of snapshot.matchedIdeas) {
      lines.push(
        `- ${idea.title} | category: ${idea.category} | status: ${idea.status} | paid: ${idea.isPaid ? `yes (${idea.price})` : "no"} | comments: ${idea.comments}, votes: ${idea.votes}, reviews: ${idea.reviews}, payments: ${idea.payments}`
      );
    }
  } else {
    lines.push("No direct idea/project match found for this query.");
  }
  if (snapshot.latestIdeas.length > 0) {
    lines.push("Latest ideas/projects in platform:");
    for (const idea of snapshot.latestIdeas) {
      lines.push(`- ${idea.title} | ${idea.category} | status: ${idea.status}`);
    }
  }
  if (snapshot.freeIdeaSamples.length > 0) {
    lines.push(`Free idea samples: ${snapshot.freeIdeaSamples.map((idea) => `${idea.title} (${idea.category})`).join(", ")}`);
  }
  if (snapshot.paidIdeaSamples.length > 0) {
    lines.push(
      `Paid idea samples: ${snapshot.paidIdeaSamples.map((idea) => `${idea.title} (${idea.category}, ${idea.price})`).join(", ")}`
    );
  }
  if (snapshot.user.id) {
    lines.push(
      `Current user activity -> successful payments: ${snapshot.user.paidPurchases}, purchased paid ideas: ${snapshot.user.purchasedPaidIdeas}, comments: ${snapshot.user.commentsCount}, reviews: ${snapshot.user.reviewsCount}, votes: ${snapshot.user.votesCount}, watchlist: ${snapshot.user.watchlistCount}, total spent: ${snapshot.user.totalSpent}.`
    );
    if (snapshot.user.latestPurchasedIdeas.length > 0) {
      lines.push(`Current user latest purchased ideas: ${snapshot.user.latestPurchasedIdeas.join(", ")}`);
    }
    if (snapshot.user.preferredCategories.length > 0) {
      lines.push(`Current user preferred categories: ${snapshot.user.preferredCategories.join(", ")}`);
    }
  }
  return lines.join("\n");
}

// src/modules/CHTBOT/chat.planner.ts
var OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
var PLANNER_MODEL = process.env.OPENROUTER_MODEL || "google/gemini-flash-1.5";
var openrouterHeaders = () => ({
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "Content-Type": "application/json",
  "HTTP-Referer": process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:3000",
  "X-Title": "EcoSpark Assistant"
});
var getModelName = (tableName) => {
  const table = tableName.toLowerCase();
  const map = {
    ideas: "idea",
    idea: "idea",
    users: "user",
    user: "user",
    categories: "category",
    category: "category",
    payments: "payment",
    payment: "payment",
    comments: "comment",
    comment: "comment",
    reviews: "review",
    review: "review",
    votes: "vote",
    vote: "vote",
    watchlist: "watchlist"
  };
  return map[table] ?? null;
};
var plannerPrompt = `You are a Prisma ORM query planner for the EcoSpark idea-sharing platform.

DATABASE SCHEMA:
Table: ideas       -> fields: id, title, problem, solution, description, isPaid(Boolean), price(Float), status(DRAFT|UNDER_REVIEW|APPROVED|REJECTED), categoryId, authorId, createdAt
Table: users       -> fields: id, name, email, role(MEMBER|MANAGER|ADMIN), isActive(Boolean), createdAt
Table: categories  -> fields: id, name
Table: payments    -> fields: id, userId, ideaId, amount(Float), status(PENDING|SUCCESS|FAILED), tranId, createdAt
Table: comments    -> fields: id, text, userId, ideaId, parentId, createdAt
Table: reviews     -> fields: id, rating(Int 1-5), comment, userId, ideaId, createdAt
Table: votes       -> fields: id, type(UP|DOWN), userId, ideaId
Table: watchlist   -> fields: id, userId, ideaId

YOUR TASK:
Look at the user's question and return a JSON array of database queries needed to answer it.

QUERY OBJECT FORMAT:
{
  "action": "count" | "findMany" | "aggregate" | "groupCount",
  "table": "<table name>",
  "where": { <prisma where clause> },
  "orderBy": { <field>: "asc"|"desc" },
  "take": <number>,
  "label": "<short description>"
}

RULES:
- Return ONLY a valid JSON array
- Return [] if question needs no DB data
- Max 5 queries per request`;
var parsePlannerOutput = (raw2) => {
  const clean = raw2.replace(/```json|```/gi, "").trim();
  const parsed = JSON.parse(clean);
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.filter((item) => {
    return Boolean(item) && typeof item === "object" && typeof item.action === "string" && typeof item.table === "string";
  }).slice(0, 5);
};
var replaceUserPlaceholders = (value, userId) => {
  if (!userId) {
    return value;
  }
  if (typeof value === "string") {
    if (value === "USER_ID" || value === "${userId}" || value === "USER_ID_PLACEHOLDER") {
      return userId;
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => replaceUserPlaceholders(item, userId));
  }
  if (value && typeof value === "object") {
    const result = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = replaceUserPlaceholders(v, userId);
    }
    return result;
  }
  return value;
};
var planDBQueries = async (message, history, userId) => {
  const userContext = userId ? `The currently logged-in user's ID is: "${userId}". Use this for personal queries.` : "No user is logged in.";
  const plannerPromptWithUser = `${plannerPrompt}

${userContext}`;
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: openrouterHeaders(),
      body: JSON.stringify({
        model: PLANNER_MODEL,
        messages: [
          { role: "system", content: plannerPromptWithUser },
          ...history.slice(-4).map((h) => ({ role: h.role, content: h.content })),
          { role: "user", content: message }
        ]
      })
    });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "[]";
    return parsePlannerOutput(text);
  } catch {
    return [];
  }
};
var runQueries = async (plan) => {
  const results = [];
  for (const query of plan) {
    const modelName = getModelName(query.table);
    if (!modelName) {
      continue;
    }
    const delegate = prisma[modelName];
    if (!delegate) {
      continue;
    }
    const label = query.label || `${query.action}:${query.table}`;
    const where = { ...query.where || {} };
    if (where?.createdAt?.gte === "LAST_7_DAYS") {
      const d = /* @__PURE__ */ new Date();
      d.setDate(d.getDate() - 7);
      where.createdAt.gte = d;
    }
    if (where?.createdAt?.gte === "LAST_30_DAYS") {
      const d = /* @__PURE__ */ new Date();
      d.setDate(d.getDate() - 30);
      where.createdAt.gte = d;
    }
    try {
      let data;
      if (query.action === "count") {
        data = await delegate.count({ where });
      } else if (query.action === "findMany") {
        if (modelName === "category") {
          data = await delegate.findMany({
            orderBy: { name: "asc" },
            include: { _count: { select: { ideas: true } } }
          });
        } else if (modelName === "idea") {
          data = await delegate.findMany({
            where,
            take: query.take || 10,
            orderBy: query.orderBy || { createdAt: "desc" },
            include: {
              category: { select: { name: true } },
              author: { select: { name: true } },
              _count: { select: { votes: true, comments: true, reviews: true } }
            }
          });
        } else if (modelName === "user") {
          data = await delegate.findMany({
            where,
            take: query.take || 10,
            orderBy: query.orderBy || { createdAt: "desc" },
            select: { name: true, email: true, role: true, isActive: true, createdAt: true }
          });
        } else if (modelName === "payment") {
          data = await delegate.findMany({
            where,
            take: query.take || 10,
            orderBy: query.orderBy || { createdAt: "desc" },
            include: {
              user: { select: { name: true } },
              idea: { select: { title: true } }
            }
          });
        } else if (modelName === "review") {
          data = await delegate.findMany({
            where,
            take: query.take || 10,
            orderBy: query.orderBy || { rating: "desc" },
            include: {
              user: { select: { name: true } },
              idea: { select: { title: true } }
            }
          });
        } else {
          data = await delegate.findMany({
            where,
            take: query.take || 10,
            orderBy: query.orderBy || { createdAt: "desc" }
          });
        }
      } else if (query.action === "aggregate") {
        if (modelName === "payment") {
          data = await delegate.aggregate({
            where,
            _sum: { amount: true },
            _avg: { amount: true },
            _count: true
          });
        } else if (modelName === "review") {
          data = await delegate.aggregate({
            where,
            _avg: { rating: true },
            _min: { rating: true },
            _max: { rating: true },
            _count: true
          });
        } else {
          data = await delegate.aggregate({ where, _count: true });
        }
      } else {
        if (modelName !== "idea") {
          continue;
        }
        let grouped = await delegate.groupBy({
          by: ["categoryId"],
          _count: { id: true },
          orderBy: { _count: { id: "desc" } }
        });
        const categories = await prisma.category.findMany({
          select: { id: true, name: true }
        });
        grouped = grouped.map((item) => ({
          category: categories.find((c) => c.id === item.categoryId)?.name || item.categoryId,
          count: item._count.id
        }));
        data = grouped;
      }
      results.push({
        label,
        action: query.action,
        table: query.table,
        data
      });
    } catch {
      continue;
    }
  }
  return results;
};
var buildContext = (results) => {
  if (!results.length) {
    return "";
  }
  const lines = ["=== LIVE DATABASE DATA ==="];
  for (const result of results) {
    const data = result.data;
    if (result.action === "count") {
      lines.push(`- ${result.label}: ${data}`);
      continue;
    }
    if (result.action === "aggregate") {
      if (result.table === "payments" || result.table === "payment") {
        lines.push(
          `- ${result.label}: total=${data?._sum?.amount || 0}, avg=${data?._avg?.amount || 0}, tx=${data?._count || 0}`
        );
      } else if (result.table === "reviews" || result.table === "review") {
        lines.push(
          `- ${result.label}: avgRating=${data?._avg?.rating || "N/A"}, min=${data?._min?.rating || "N/A"}, max=${data?._max?.rating || "N/A"}, total=${data?._count || 0}`
        );
      } else {
        lines.push(`- ${result.label}: ${JSON.stringify(data)}`);
      }
      continue;
    }
    if (result.action === "groupCount") {
      lines.push(`- ${result.label}:`);
      for (const item of data || []) {
        lines.push(`  - ${item.category}: ${item.count}`);
      }
      continue;
    }
    if (!Array.isArray(data) || data.length === 0) {
      lines.push(`- ${result.label}: no records found`);
      continue;
    }
    if (result.table === "ideas" || result.table === "idea") {
      lines.push(`- ${result.label}:`);
      for (const idea of data.slice(0, 8)) {
        lines.push(
          `  - ${idea.title} | ${idea.isPaid ? `${idea.price} BDT` : "Free"} | ${idea.status} | ${idea.category?.name || "N/A"}`
        );
      }
      continue;
    }
    if (result.table === "categories" || result.table === "category") {
      lines.push(`- ${result.label}:`);
      for (const category of data.slice(0, 12)) {
        lines.push(`  - ${category.name}: ${category._count?.ideas || 0} ideas`);
      }
      continue;
    }
    lines.push(`- ${result.label}: ${JSON.stringify(data).slice(0, 400)}`);
  }
  return lines.join("\n");
};
var getPlannedDbContext = async (message, history, userId) => {
  if (!process.env.OPENROUTER_API_KEY) {
    return "";
  }
  const rawPlan = await planDBQueries(message, history, userId);
  const plan = rawPlan.map((query) => ({
    ...query,
    where: replaceUserPlaceholders(query.where, userId)
  }));
  if (!plan.length) {
    return "";
  }
  const results = await runQueries(plan);
  return buildContext(results);
};

// src/modules/CHTBOT/chat.service.ts
var OPENROUTER_URL2 = "https://openrouter.ai/api/v1/chat/completions";
var DEFAULT_MODELS = [
  "meta-llama/llama-3.1-8b-instruct:free",
  "openai/gpt-4o-mini",
  "google/gemini-2.0-flash-exp:free"
];
var writeSseData = (res, text) => {
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    res.write(`data: ${line}
`);
  }
  res.write("\n");
};
var writeSseDone = (res) => {
  res.write("data: [DONE]\n\n");
};
var sanitizeHistory = (history) => {
  return history.filter((item) => typeof item?.content === "string" && typeof item?.role === "string").map((item) => ({
    role: ["system", "user", "assistant"].includes(item.role) ? item.role : "user",
    content: item.content
  })).slice(-8);
};
var uniqueNonEmpty = (items) => {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
};
var getTopCategoryNames = (snapshot, count = 3) => {
  return [...snapshot.categories].sort((a, b) => b.ideasCount - a.ideasCount).slice(0, count).map((category) => category.name);
};
var buildFaqGuidance = (snapshot) => {
  const paidIdeas = snapshot.counts.paidIdeas;
  const freeIdeas = snapshot.counts.freeIdeas;
  return [
    "EcoSpark common tasks guide:",
    "1) Registration/Login: /auth/register \u098F\u09AC\u0982 /auth/login \u09A5\u09C7\u0995\u09C7 account \u09A4\u09C8\u09B0\u09BF/\u09B2\u0997\u0987\u09A8 \u0995\u09B0\u09C1\u09A8\u0964",
    `2) Idea explore: \u09AE\u09CB\u099F ${snapshot.counts.ideas} ideas \u0986\u099B\u09C7 (free ${freeIdeas}, paid ${paidIdeas})\u0964`,
    "3) Paid idea access: payment complete \u09B9\u09B2\u09C7 paid idea access \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u0964",
    "4) Engagement: vote, comment, review, watchlist \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0 \u0995\u09B0\u09A4\u09C7 login \u09A5\u09BE\u0995\u09BE \u09A6\u09B0\u0995\u09BE\u09B0\u0964",
    "5) Dashboard: role \u0985\u09A8\u09C1\u09AF\u09BE\u09DF\u09C0 Member/Manager/Admin panel use \u0995\u09B0\u09C1\u09A8\u0964"
  ].join("\n");
};
var buildContentSuggestions = (snapshot) => {
  const interestCategories = uniqueNonEmpty([
    ...snapshot.user.preferredCategories,
    ...snapshot.matchedCategories.map((category) => category.name),
    ...getTopCategoryNames(snapshot, 3)
  ]).slice(0, 3);
  const seedIdeas = (snapshot.matchedIdeas.length > 0 ? snapshot.matchedIdeas.map((idea) => idea.title) : snapshot.latestIdeas.map((idea) => idea.title)).slice(0, 3);
  const categoryText = interestCategories.length > 0 ? interestCategories.join(", ") : "Sustainability";
  const ideaText = seedIdeas.length > 0 ? seedIdeas.join(", ") : "platform ideas";
  return [
    "AI content suggestions (dynamic):",
    `- Blog topic: "${categoryText} \u098F top eco \u0989\u09A6\u09CD\u09AF\u09CB\u0997"`,
    `- Community post idea: "${ideaText} \u09A8\u09BF\u09DF\u09C7 quick discussion"`,
    `- Newsletter theme: "\u098F\u0987 \u09B8\u09AA\u09CD\u09A4\u09BE\u09B9\u09C7\u09B0 ${categoryText} updates"`
  ].join("\n");
};
var buildNewsletterRecommendations = (snapshot) => {
  const topCategories = getTopCategoryNames(snapshot, 3);
  const userCategories = snapshot.user.preferredCategories.slice(0, 3);
  const picked = uniqueNonEmpty([...userCategories, ...topCategories]).slice(0, 3);
  const categoryText = picked.length > 0 ? picked.join(", ") : "General sustainability";
  const trending = snapshot.latestIdeas.slice(0, 2).map((idea) => idea.title).join(", ") || "No recent ideas";
  return [
    "Smart email/newsletter recommendation:",
    `- Audience focus: ${categoryText}`,
    `- Include: ${trending}`,
    `- CTA: \u09A8\u09A4\u09C1\u09A8 idea explore \u0995\u09B0\u09C1\u09A8 \u098F\u09AC\u0982 vote/comment \u09A6\u09BF\u09A8\u0964`,
    `- Frequency suggestion: weekly digest`
  ].join("\n");
};
var buildFullDatabaseSummaryAnswer = (message, snapshot) => {
  const q = message.toLowerCase();
  const asksDatabase = q.includes("database") || q.includes("db");
  const asksAllInfo = q.includes("all") || q.includes("sob") || q.includes("\u09B8\u09AC") || q.includes("ja ja") || q.includes("information") || q.includes("info") || q.includes("infromation") || q.includes("details");
  if (!asksDatabase || !asksAllInfo) {
    return null;
  }
  const lines = [];
  lines.push("EcoSpark full database summary:");
  lines.push(`- users: ${snapshot.counts.users}`);
  lines.push(`- categories: ${snapshot.counts.categories}`);
  lines.push(
    `- ideas: ${snapshot.counts.ideas} (free: ${snapshot.counts.freeIdeas}, paid: ${snapshot.counts.paidIdeas}, approved: ${snapshot.counts.approvedIdeas})`
  );
  lines.push(`- comments: ${snapshot.counts.comments}`);
  lines.push(`- reviews: ${snapshot.counts.reviews}`);
  lines.push(`- votes: ${snapshot.counts.votes}`);
  lines.push(`- payments: ${snapshot.counts.payments}`);
  lines.push(`- watchlist: ${snapshot.counts.watchlist}`);
  if (snapshot.categories.length > 0) {
    lines.push(`- category list: ${snapshot.categories.slice(0, 10).map((c) => c.name).join(", ")}`);
  }
  if (snapshot.latestIdeas.length > 0) {
    lines.push(
      `- latest ideas: ${snapshot.latestIdeas.slice(0, 6).map((idea) => `${idea.title} (${idea.category}, ${idea.status})`).join(", ")}`
    );
  }
  if (snapshot.freeIdeaSamples.length > 0) {
    lines.push(
      `- free idea samples: ${snapshot.freeIdeaSamples.slice(0, 5).map((idea) => `${idea.title} (${idea.category})`).join(", ")}`
    );
  }
  if (snapshot.paidIdeaSamples.length > 0) {
    lines.push(
      `- paid idea samples: ${snapshot.paidIdeaSamples.slice(0, 5).map((idea) => `${idea.title} (${idea.category}, price: ${idea.price})`).join(", ")}`
    );
  }
  if (snapshot.user.id) {
    lines.push(
      `- your activity: payments ${snapshot.user.paidPurchases}, comments ${snapshot.user.commentsCount}, reviews ${snapshot.user.reviewsCount}, votes ${snapshot.user.votesCount}, watchlist ${snapshot.user.watchlistCount}, total spent ${snapshot.user.totalSpent}`
    );
  }
  lines.push("\u0986\u09B0\u0993 \u09A8\u09BF\u09B0\u09CD\u09A6\u09BF\u09B7\u09CD\u099F \u0995\u09BF\u099B\u09C1 \u099A\u09BE\u0987\u09B2\u09C7 (\u09AF\u09C7\u09AE\u09A8 \u09B6\u09C1\u09A7\u09C1 reviews \u09AC\u09BE \u09B6\u09C1\u09A7\u09C1 users) \u0986\u09B2\u09BE\u09A6\u09BE \u0995\u09B0\u09C7 \u099C\u09BF\u099C\u09CD\u099E\u09C7\u09B8 \u0995\u09B0\u09C1\u09A8\u0964");
  return lines.join("\n");
};
var buildPaidFreeIdeasAnswer = (message, snapshot) => {
  const q = message.toLowerCase();
  const asksFreeIdeas = q.includes("free ideas") || q.includes("free idea") || q.includes("free") || q.includes("\u09AB\u09CD\u09B0\u09BF");
  const asksPaidIdeas = q.includes("paid ideas") || q.includes("paid idea") || q.includes("paid") || q.includes("\u09AA\u09C7\u0987\u09A1") || q.includes("payment") || q.includes("paymnet") || q.includes("purchase");
  if (!asksFreeIdeas && !asksPaidIdeas) {
    return null;
  }
  if (asksFreeIdeas && !asksPaidIdeas) {
    const sampleText = snapshot.freeIdeaSamples.length > 0 ? snapshot.freeIdeaSamples.slice(0, 5).map((idea) => `${idea.title} (${idea.category})`).join(", ") : "\u098F\u0987 \u09AE\u09C1\u09B9\u09C2\u09B0\u09CD\u09A4\u09C7 free idea sample \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF";
    return [
      `Database \u0985\u09A8\u09C1\u09AF\u09BE\u09DF\u09C0 free ideas \u0986\u099B\u09C7 ${snapshot.counts.freeIdeas} \u099F\u09BF\u0964`,
      `Free idea samples: ${sampleText}`
    ].join("\n");
  }
  if (asksPaidIdeas && !asksFreeIdeas) {
    const sampleText = snapshot.paidIdeaSamples.length > 0 ? snapshot.paidIdeaSamples.slice(0, 5).map((idea) => `${idea.title} (${idea.category}, price: ${idea.price})`).join(", ") : "\u098F\u0987 \u09AE\u09C1\u09B9\u09C2\u09B0\u09CD\u09A4\u09C7 paid idea sample \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF";
    return [
      `Database \u0985\u09A8\u09C1\u09AF\u09BE\u09DF\u09C0 paid ideas \u0986\u099B\u09C7 ${snapshot.counts.paidIdeas} \u099F\u09BF\u0964`,
      `Total successful payments: ${snapshot.counts.payments} \u099F\u09BF\u0964`,
      `Paid idea samples: ${sampleText}`
    ].join("\n");
  }
  return [
    `Free ideas: ${snapshot.counts.freeIdeas} \u099F\u09BF`,
    `Paid ideas: ${snapshot.counts.paidIdeas} \u099F\u09BF`,
    `Total successful payments: ${snapshot.counts.payments} \u099F\u09BF`
  ].join("\n");
};
var buildOwnActivityAnswer = (message, snapshot) => {
  const q = message.toLowerCase();
  const hasSelfKeyword = q.includes("ami") || q.includes("amr") || q.includes("amar") || q.includes("my ") || q.includes("i ") || q.includes("id diye") || q.includes("my id");
  if (!hasSelfKeyword) {
    return null;
  }
  const asksOwnComment = q.includes("comment");
  const asksOwnReview = q.includes("review") || q.includes("rating") || q.includes("riview");
  const asksOwnVote = q.includes("vote") || q.includes("voting");
  const asksOwnWatchlist = q.includes("watchlist") || q.includes("saved") || q.includes("bookmark");
  const hasIdeaKeyword = q.includes("idea") || q.includes("ideas") || q.includes("project");
  const hasCreateKeyword = q.includes("create") || q.includes("created") || q.includes("crate") || q.includes("creat") || q.includes("made") || q.includes("post") || q.includes("added") || q.includes("banai") || q.includes("banano") || q.includes("kora") || q.includes("korsi") || q.includes("korci") || q.includes("korchi") || q.includes("korechi") || q.includes("disi") || q.includes("dichi");
  const asksOwnIdeas = hasIdeaKeyword && (hasCreateKeyword || q.includes("amar idea") || q.includes("my idea"));
  const asksPaidInfo = q.includes("paid information") || q.includes("paid info") || q.includes("paid ideas");
  const asksOwnPayment = q.includes("payment") || q.includes("paymnet") || q.includes("paid") || q.includes("purchase");
  if (!asksOwnComment && !asksOwnReview && !asksOwnVote && !asksOwnWatchlist && !asksOwnIdeas && !asksOwnPayment && !asksPaidInfo) {
    return null;
  }
  if (!snapshot.user.id) {
    return [
      "\u0986\u09AA\u09A8\u09BE\u09B0 personal activity check \u0995\u09B0\u09BE\u09B0 \u099C\u09A8\u09CD\u09AF login \u0995\u09B0\u09A4\u09C7 \u09B9\u09AC\u09C7\u0964",
      'Login \u0995\u09B0\u09BE\u09B0 \u09AA\u09B0 \u0986\u09AC\u09BE\u09B0 \u099C\u09BF\u099C\u09CD\u099E\u09C7\u09B8 \u0995\u09B0\u09C1\u09A8: "\u0986\u09AE\u09BF \u0995\u09BF comment/review/vote/payment \u0995\u09B0\u09C7\u099B\u09BF?"'
    ].join("\n");
  }
  const lines = ["\u0986\u09AA\u09A8\u09BE\u09B0 personal summary:"];
  if (asksOwnIdeas) {
    lines.push(
      `- Created ideas: ${snapshot.user.createdIdeasCount} (paid created: ${snapshot.user.createdPaidIdeasCount})`
    );
    if (snapshot.user.latestCreatedIdeas.length > 0) {
      lines.push(
        `- Latest created ideas: ${snapshot.user.latestCreatedIdeas.slice(0, 5).map((idea) => `${idea.title} (${idea.isPaid ? "Paid" : "Free"}, ${idea.status})`).join(", ")}`
      );
    }
    if (!asksOwnComment && !asksOwnReview && !asksOwnVote && !asksOwnWatchlist && !asksOwnPayment) {
      lines.push(
        `- Activity totals: comments ${snapshot.user.commentsCount}, reviews ${snapshot.user.reviewsCount}, votes ${snapshot.user.votesCount}, watchlist ${snapshot.user.watchlistCount}`
      );
      lines.push(
        `- Payment totals: total ${snapshot.user.totalPayments}, success ${snapshot.user.successfulPayments}, pending ${snapshot.user.pendingPayments}, failed ${snapshot.user.failedPayments}, spent ${snapshot.user.totalSpent}`
      );
    }
  }
  if (asksOwnComment) {
    lines.push(`- Comments: ${snapshot.user.commentsCount}`);
  }
  if (asksOwnReview) {
    lines.push(`- Reviews: ${snapshot.user.reviewsCount}`);
  }
  if (asksOwnVote) {
    lines.push(`- Votes: ${snapshot.user.votesCount}`);
  }
  if (asksOwnWatchlist) {
    lines.push(`- Watchlist items: ${snapshot.user.watchlistCount}`);
  }
  if (asksOwnPayment || asksPaidInfo) {
    lines.push(
      `- Payment history: total ${snapshot.user.totalPayments}, success ${snapshot.user.successfulPayments}, pending ${snapshot.user.pendingPayments}, failed ${snapshot.user.failedPayments}`
    );
    lines.push(
      `- Paid purchases: ${snapshot.user.purchasedPaidIdeas}, total spent: ${snapshot.user.totalSpent}`
    );
    if (snapshot.user.latestPayments.length > 0) {
      lines.push(
        `- Recent payments: ${snapshot.user.latestPayments.slice(0, 5).map((payment) => `${payment.ideaTitle} (${payment.amount}, ${payment.status})`).join(", ")}`
      );
    }
  }
  if (asksPaidInfo) {
    lines.push(
      `- Platform paid info: paid ideas ${snapshot.counts.paidIdeas}, free ideas ${snapshot.counts.freeIdeas}, total successful payments ${snapshot.counts.payments}`
    );
  }
  if (lines.length === 1) {
    return null;
  }
  return lines.join("\n");
};
var buildCoreModuleInstantAnswer = (message, snapshot) => {
  const q = message.toLowerCase();
  const hasSelfKeyword = q.includes("ami") || q.includes("amr") || q.includes("amar") || q.includes("my ") || q.includes("i ") || q.includes("id diye") || q.includes("my id");
  const asksAllModules = q.includes("sob") || q.includes("\u09B8\u09AC") || q.includes("all") || q.includes("ja ja ase") || q.includes("module") || q.includes("database");
  const wantsUsers = q.includes("user") || q.includes("koi jon") || q.includes("koy jon") || q.includes("koto jon");
  const wantsCategories = q.includes("category") || q.includes("categories") || q.includes("catagory") || q.includes("catagori");
  const wantsIdeas = q.includes("idea") || q.includes("ideas") || q.includes("koita") || q.includes("koyta");
  const wantsComments = q.includes("comment");
  const wantsReviews = q.includes("review") || q.includes("rating") || q.includes("riview");
  const wantsVotes = q.includes("vote") || q.includes("voting");
  const wantsPayments = q.includes("payment") || q.includes("paymnet") || q.includes("paid") || q.includes("purchase");
  const wantsWatchlist = q.includes("watchlist");
  const hasSpecificModule = wantsUsers || wantsCategories || wantsIdeas || wantsComments || wantsReviews || wantsVotes || wantsPayments || wantsWatchlist;
  if (hasSelfKeyword) {
    return null;
  }
  if (!asksAllModules && !hasSpecificModule) {
    return null;
  }
  const lines = ["EcoSpark live database summary:"];
  if (asksAllModules || wantsUsers) lines.push(`- users: ${snapshot.counts.users}`);
  if (asksAllModules || wantsCategories) lines.push(`- categories: ${snapshot.counts.categories}`);
  if (asksAllModules || wantsIdeas) {
    lines.push(
      `- ideas: ${snapshot.counts.ideas} (free: ${snapshot.counts.freeIdeas}, paid: ${snapshot.counts.paidIdeas}, approved: ${snapshot.counts.approvedIdeas})`
    );
  }
  if (asksAllModules || wantsComments) lines.push(`- comments: ${snapshot.counts.comments}`);
  if (asksAllModules || wantsReviews) lines.push(`- reviews: ${snapshot.counts.reviews}`);
  if (asksAllModules || wantsVotes) lines.push(`- votes: ${snapshot.counts.votes}`);
  if (asksAllModules || wantsPayments) lines.push(`- payments: ${snapshot.counts.payments}`);
  if (asksAllModules || wantsWatchlist) lines.push(`- watchlist: ${snapshot.counts.watchlist}`);
  if ((asksAllModules || wantsCategories) && snapshot.categories.length > 0) {
    lines.push(`- top categories: ${snapshot.categories.slice(0, 8).map((c) => c.name).join(", ")}`);
  }
  if ((asksAllModules || wantsIdeas) && snapshot.latestIdeas.length > 0) {
    lines.push(
      `- latest ideas: ${snapshot.latestIdeas.slice(0, 5).map((idea) => `${idea.title} (${idea.category})`).join(", ")}`
    );
  }
  return lines.join("\n");
};
var buildDynamicFallbackAnswer = (message, snapshot) => {
  const q = message.toLowerCase();
  const categoriesText = snapshot.categories.map((category) => category.name).join(", ") || "No categories yet";
  const latestIdeasText = snapshot.latestIdeas.length > 0 ? snapshot.latestIdeas.map((idea) => `${idea.title} (${idea.category})`).join(", ") : "No ideas yet";
  const fullDatabaseSummary = buildFullDatabaseSummaryAnswer(message, snapshot);
  if (fullDatabaseSummary) {
    return fullDatabaseSummary;
  }
  const ownActivityAnswer = buildOwnActivityAnswer(message, snapshot);
  if (ownActivityAnswer) {
    return ownActivityAnswer;
  }
  const paidFreeAnswer = buildPaidFreeIdeasAnswer(message, snapshot);
  if (paidFreeAnswer) {
    return paidFreeAnswer;
  }
  const coreModuleAnswer = buildCoreModuleInstantAnswer(message, snapshot);
  if (coreModuleAnswer) {
    return coreModuleAnswer;
  }
  const asksLoginHelp = q.includes("login") || q.includes("log in") || q.includes("signin") || q.includes("sign in") || q.includes("\u09B2\u0997\u0987\u09A8") || q.includes("login hoy na") || q.includes("\u09B9\u09DF \u09A8\u09BE");
  if (asksLoginHelp) {
    return [
      "Login \u09B8\u09AE\u09B8\u09CD\u09AF\u09BE \u09B9\u09B2\u09C7 \u098F\u0987\u0997\u09C1\u09B2\u09CB check \u0995\u09B0\u09C1\u09A8:",
      "1) Email/password \u09A0\u09BF\u0995 \u0986\u099B\u09C7 \u0995\u09BF \u09A8\u09BE (extra space \u099B\u09BE\u09DC\u09BE)",
      "2) \u0986\u0997\u09C7 registration complete \u09B9\u09DF\u09C7\u099B\u09C7 \u0995\u09BF \u09A8\u09BE",
      "3) Browser cookies/local storage clear \u0995\u09B0\u09C7 \u0986\u09AC\u09BE\u09B0 login",
      "4) Backend server running \u0986\u099B\u09C7 \u0995\u09BF \u09A8\u09BE",
      "5) \u09B8\u09AE\u09B8\u09CD\u09AF\u09BE \u09A5\u09BE\u0995\u09B2\u09C7 password reset \u09AC\u09BE \u09A8\u09A4\u09C1\u09A8 account \u09A6\u09BF\u09DF\u09C7 verify \u0995\u09B0\u09C1\u09A8"
    ].join("\n");
  }
  const asksFaqSupport = q.includes("faq") || q.includes("help") || q.includes("support") || q.includes("guide") || q.includes("kibhabe") || q.includes("how to") || q.includes("booking") || q.includes("product info");
  if (asksFaqSupport) {
    return buildFaqGuidance(snapshot);
  }
  const asksContentSuggestion = q.includes("content") || q.includes("blog") || q.includes("post") || q.includes("suggest") || q.includes("recommend") || q.includes("idea for writing") || q.includes("newsletter topic");
  if (asksContentSuggestion) {
    return buildContentSuggestions(snapshot);
  }
  const asksNewsletterEmail = q.includes("newsletter") || q.includes("email") || q.includes("mail") || q.includes("digest") || q.includes("campaign");
  if (asksNewsletterEmail) {
    return buildNewsletterRecommendations(snapshot);
  }
  const blocks = [];
  blocks.push(
    `EcoSpark live stats -> ideas: ${snapshot.counts.ideas}, free: ${snapshot.counts.freeIdeas}, paid: ${snapshot.counts.paidIdeas}, categories: ${snapshot.counts.categories}, comments: ${snapshot.counts.comments}, reviews: ${snapshot.counts.reviews}, votes: ${snapshot.counts.votes}, payments: ${snapshot.counts.payments}.`
  );
  if (snapshot.matchedCategories.length > 0) {
    blocks.push(
      `Matched categories: ${snapshot.matchedCategories.map((category) => `${category.name} (${category.ideasCount})`).join(", ")}`
    );
  }
  if (snapshot.matchedIdeas.length > 0) {
    blocks.push(
      `Matched ideas: ${snapshot.matchedIdeas.slice(0, 5).map((idea) => `${idea.title} [${idea.category}, ${idea.isPaid ? "paid" : "free"}]`).join(", ")}`
    );
  }
  if (snapshot.user.id) {
    const latestBought = snapshot.user.latestPurchasedIdeas.length > 0 ? snapshot.user.latestPurchasedIdeas.slice(0, 3).join(", ") : "no purchased ideas yet";
    blocks.push(
      `Your account summary -> successful payments: ${snapshot.user.paidPurchases}, purchased paid ideas: ${snapshot.user.purchasedPaidIdeas}, total spent: ${snapshot.user.totalSpent}, latest purchases: ${latestBought}.`
    );
  }
  blocks.push(`Available categories: ${categoriesText}`);
  blocks.push(`Latest ideas: ${latestIdeasText}`);
  blocks.push("\u09AA\u09CD\u09B0\u09B6\u09CD\u09A8\u099F\u09BE \u098F\u0995\u099F\u09C1 specific \u0995\u09B0\u09B2\u09C7 \u0986\u09AE\u09BF \u0986\u09B0\u0993 \u09A8\u09BF\u09B0\u09CD\u09AD\u09C1\u09B2 \u0989\u09A4\u09CD\u09A4\u09B0 \u09A6\u09BF\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u0964");
  return blocks.join("\n");
};
var buildProjectContextFallback = (projectContext) => {
  if (!projectContext.trim()) {
    return "\u0986\u09AE\u09BF \u098F\u0996\u09A8 live database access \u09AA\u09BE\u099A\u09CD\u099B\u09BF \u09A8\u09BE, \u0995\u09BF\u09A8\u09CD\u09A4\u09C1 EcoSpark \u098F auth, ideas, categories, comments, reviews, votes, payments, watchlist \u098F\u09AC\u0982 role-based dashboard modules \u0986\u099B\u09C7\u0964";
  }
  return `\u0986\u09AE\u09BF \u098F\u0996\u09A8 live database access \u09AA\u09BE\u099A\u09CD\u099B\u09BF \u09A8\u09BE\u0964 \u09A4\u09AC\u09C7 project context \u0985\u09A8\u09C1\u09AF\u09BE\u09DF\u09C0:
${projectContext}`;
};
var getChatResponse = async (message, history, projectContext, currentUserId, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  const preferredModel = process.env.OPENROUTER_MODEL;
  let snapshot = null;
  try {
    snapshot = await getProjectSnapshot(message, currentUserId);
  } catch (error) {
    console.error("Failed to load project snapshot:", error);
  }
  if (snapshot) {
    const fullDatabaseSummary = buildFullDatabaseSummaryAnswer(message, snapshot);
    if (fullDatabaseSummary) {
      writeSseData(res, fullDatabaseSummary);
      writeSseDone(res);
      res.end();
      return;
    }
    const ownActivityAnswer = buildOwnActivityAnswer(message, snapshot);
    if (ownActivityAnswer) {
      writeSseData(res, ownActivityAnswer);
      writeSseDone(res);
      res.end();
      return;
    }
    const paidFreeAnswer = buildPaidFreeIdeasAnswer(message, snapshot);
    if (paidFreeAnswer) {
      writeSseData(res, paidFreeAnswer);
      writeSseDone(res);
      res.end();
      return;
    }
    const coreModuleAnswer = buildCoreModuleInstantAnswer(message, snapshot);
    if (coreModuleAnswer) {
      writeSseData(res, coreModuleAnswer);
      writeSseDone(res);
      res.end();
      return;
    }
  }
  if (!apiKey) {
    const fallback = snapshot ? buildDynamicFallbackAnswer(message, snapshot) : buildProjectContextFallback(projectContext);
    writeSseData(res, fallback);
    writeSseDone(res);
    res.end();
    return;
  }
  let dbContext = "";
  try {
    dbContext = await getPlannedDbContext(message, sanitizeHistory(history), currentUserId);
    if (!dbContext) {
      dbContext = await getContextFromDB(message, currentUserId);
    }
  } catch (error) {
    console.error("Failed to build DB context:", error);
  }
  const systemPrompt = `You are EcoSpark assistant.
Answer in the same language the user uses (Bangla or English).
Keep responses short, clear, and practical.
Prefer bullet points for list-style answers.
Highlight key numbers in a noticeable style (for example: **12 \u099F\u09BF paid idea**).
For personal queries, answer only using the current logged-in user's data when available.
You can answer questions about platform data (ideas/projects, categories, comments, reviews, votes, payments, watchlist).
You can also provide support guidance (FAQ/common tasks), AI content suggestions (blog/post/newsletter ideas), and smart newsletter recommendations aligned with live platform data and user interests.
If the user asks about project features/pages/roles/flows, use the project context below.
Never expose private user data like email, password, tokens, or personal identifiers.
${projectContext ? `
Project context:
${projectContext}` : ""}
${dbContext ? `
Database context:
${dbContext}` : ""}`;
  const modelCandidates = preferredModel ? [preferredModel, ...DEFAULT_MODELS.filter((model) => model !== preferredModel)] : DEFAULT_MODELS;
  let response = null;
  let lastErrorBody = "";
  for (const model of modelCandidates) {
    const candidateResponse = await fetch(OPENROUTER_URL2, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          ...sanitizeHistory(history),
          { role: "user", content: message }
        ]
      })
    });
    if (candidateResponse.ok && candidateResponse.body) {
      response = candidateResponse;
      break;
    }
    lastErrorBody = await candidateResponse.text();
    console.error(`OpenRouter model failed (${model}): ${candidateResponse.status} ${lastErrorBody}`);
    if (candidateResponse.status !== 404) {
      break;
    }
  }
  if (!response || !response.body) {
    if (lastErrorBody) {
      console.error(`OpenRouter request failed after retries: ${lastErrorBody}`);
    }
    const fallback = snapshot ? buildDynamicFallbackAnswer(message, snapshot) : buildProjectContextFallback(projectContext);
    writeSseData(res, fallback);
    writeSseDone(res);
    res.end();
    return;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) {
        continue;
      }
      const data = line.replace("data: ", "").trim();
      if (!data) {
        continue;
      }
      if (data === "[DONE]") {
        writeSseDone(res);
        res.end();
        return;
      }
      try {
        const json = JSON.parse(data);
        const token = json.choices?.[0]?.delta?.content;
        if (token) {
          writeSseData(res, token);
        }
      } catch (err) {
        console.error("Failed to parse OpenRouter stream chunk:", err);
      }
    }
  }
  writeSseDone(res);
  res.end();
};

// src/modules/CHTBOT/chat.controller.ts
var import_jsonwebtoken3 = __toESM(require("jsonwebtoken"));
var chatHandler = async (req, res) => {
  const authHeader = req.headers.authorization;
  let currentUserId;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = import_jsonwebtoken3.default.verify(token, process.env.JWT_SECRET);
      if (decoded?.userId) {
        currentUserId = decoded.userId;
      }
    } catch {
      currentUserId = void 0;
    }
  }
  if (!currentUserId && typeof req.body?.userId === "string" && req.body.userId.trim()) {
    currentUserId = req.body.userId.trim();
  }
  const { message, history = [], projectContext } = req.body;
  if (!message || typeof message !== "string") {
    res.status(400).json({ message: "message is required" });
    return;
  }
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  try {
    await getChatResponse(
      message,
      Array.isArray(history) ? history : [],
      typeof projectContext === "string" ? projectContext : "",
      currentUserId,
      res
    );
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
    }
    res.write(
      "data: \u09A6\u09C1\u0983\u0996\u09BF\u09A4, \u098F\u0996\u09A8 \u09B8\u09BE\u09B0\u09CD\u09AD\u09BE\u09B0 \u09A5\u09C7\u0995\u09C7 \u09AC\u09BF\u09B8\u09CD\u09A4\u09BE\u09B0\u09BF\u09A4 \u09A4\u09A5\u09CD\u09AF \u0986\u09A8\u09BE \u09AF\u09BE\u099A\u09CD\u099B\u09C7 \u09A8\u09BE\u0964 \u098F\u0995\u099F\u09C1 \u09AA\u09B0\u09C7 \u0986\u09AC\u09BE\u09B0 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u09C1\u09A8\u0964\n\n"
    );
    res.write("data: [DONE]\n\n");
    res.end();
  }
};

// src/modules/CHTBOT/chat.router.ts
var router11 = import_express11.default.Router();
router11.post("/chat", chatHandler);
var chat_router_default = router11;

// src/modules/newsletter/newsletter.route.ts
var import_express12 = __toESM(require("express"));

// src/modules/newsletter/newsletter.service.ts
var import_nodemailer = __toESM(require("nodemailer"));
var parseNumber = (value, fallback) => {
  if (!value) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};
var formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(amount);
};
var getSignals = async (userId) => {
  const [watchlist, paidPurchases, createdIdeas] = await Promise.all([
    prisma.watchlist.findMany({
      where: { userId },
      select: {
        idea: {
          select: {
            categoryId: true,
            category: { select: { name: true } }
          }
        }
      }
    }),
    prisma.payment.findMany({
      where: { userId, status: "SUCCESS" },
      select: {
        idea: {
          select: {
            categoryId: true,
            category: { select: { name: true } },
            isPaid: true
          }
        }
      }
    }),
    prisma.idea.findMany({
      where: { authorId: userId },
      select: {
        categoryId: true,
        category: { select: { name: true } }
      },
      take: 40,
      orderBy: { createdAt: "desc" }
    })
  ]);
  const categoryWeights = /* @__PURE__ */ new Map();
  for (const item of watchlist) {
    const existing = categoryWeights.get(item.idea.categoryId);
    categoryWeights.set(item.idea.categoryId, {
      weight: (existing?.weight || 0) + 3,
      name: item.idea.category.name
    });
  }
  for (const purchase of paidPurchases) {
    const existing = categoryWeights.get(purchase.idea.categoryId);
    categoryWeights.set(purchase.idea.categoryId, {
      weight: (existing?.weight || 0) + 4,
      name: purchase.idea.category.name
    });
  }
  for (const created of createdIdeas) {
    const existing = categoryWeights.get(created.categoryId);
    categoryWeights.set(created.categoryId, {
      weight: (existing?.weight || 0) + 2,
      name: created.category.name
    });
  }
  const hasSuccessfulPurchase = paidPurchases.length > 0;
  return { categoryWeights, hasSuccessfulPurchase };
};
var scoreIdeas = (ideas, signals) => {
  const now = Date.now();
  return ideas.map((idea) => {
    let score = 0;
    const reasons = [];
    const weight = signals.categoryWeights.get(idea.categoryId)?.weight || 0;
    if (weight > 0) {
      score += weight * 2;
      reasons.push(`matches your interest in ${idea.category.name}`);
    }
    const popularity = idea._count.votes * 2 + idea._count.reviews * 3 + idea._count.comments;
    if (popularity > 0) {
      score += popularity;
      reasons.push("trending on platform");
    }
    const ageDays = Math.floor((now - idea.createdAt.getTime()) / (1e3 * 60 * 60 * 24));
    const recencyBonus = Math.max(0, 14 - ageDays);
    if (recencyBonus > 0) {
      score += recencyBonus;
      reasons.push("newly added");
    }
    if (signals.hasSuccessfulPurchase && idea.isPaid) {
      score += 5;
      reasons.push("premium match");
    } else if (!signals.hasSuccessfulPurchase && !idea.isPaid) {
      score += 3;
      reasons.push("free to start");
    }
    return {
      id: idea.id,
      title: idea.title,
      category: idea.category.name,
      isPaid: idea.isPaid,
      price: idea.price,
      score,
      reasons
    };
  }).sort((a, b) => b.score - a.score).slice(0, 5);
};
var buildEmailHtml = (bundle) => {
  const ideaRows = bundle.recommendations.map(
    (item) => `<li><strong>${item.title}</strong> (${item.category}) - ${item.isPaid ? `Paid ${formatCurrency(item.price)}` : "Free"}<br/><small>${item.reasons.join(", ")}</small></li>`
  ).join("");
  return `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 680px; margin: 0 auto;">
    <h2 style="margin-bottom: 4px;">Hi ${bundle.user.name},</h2>
    <p style="margin-top: 0;">${bundle.previewText}</p>

    <h3>Your smart picks</h3>
    <ol>${ideaRows || "<li>No new recommendations right now.</li>"}</ol>

    <h3>EcoSpark updates</h3>
    <ul>
      <li>Approved ideas this week: <strong>${bundle.updates.approvedLast7Days}</strong></li>
      <li>New paid ideas this week: <strong>${bundle.updates.paidApprovedLast7Days}</strong></li>
      <li>Trending category: <strong>${bundle.updates.trendingCategory}</strong></li>
    </ul>

    <p><a href="${process.env.CLIENT_URL || "http://localhost:3000"}/ideas" style="color: #0f766e;">Explore ideas on EcoSpark</a></p>
    <p style="font-size: 12px; color: #6b7280;">You are receiving this email because you have an EcoSpark account.</p>
  </div>`;
};
var buildEmailText = (bundle) => {
  const list = bundle.recommendations.length ? bundle.recommendations.map(
    (item, idx) => `${idx + 1}. ${item.title} (${item.category}) - ${item.isPaid ? `Paid ${formatCurrency(item.price)}` : "Free"} | ${item.reasons.join(", ")}`
  ).join("\n") : "No new recommendations right now.";
  return [
    `Hi ${bundle.user.name},`,
    "",
    bundle.previewText,
    "",
    "Your smart picks:",
    list,
    "",
    "EcoSpark updates:",
    `- Approved ideas this week: ${bundle.updates.approvedLast7Days}`,
    `- New paid ideas this week: ${bundle.updates.paidApprovedLast7Days}`,
    `- Trending category: ${bundle.updates.trendingCategory}`,
    "",
    `Explore: ${(process.env.CLIENT_URL || "http://localhost:3000") + "/ideas"}`
  ].join("\n");
};
var buildNewsletterBundleForUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, isActive: true }
  });
  if (!user || !user.isActive) {
    throw new Error("Active user not found");
  }
  const signals = await getSignals(userId);
  const [candidateIdeas, approvedLast7Days, paidApprovedLast7Days, topCategory] = await Promise.all([
    prisma.idea.findMany({
      where: {
        status: "APPROVED",
        authorId: { not: userId }
      },
      select: {
        id: true,
        title: true,
        isPaid: true,
        price: true,
        createdAt: true,
        categoryId: true,
        category: { select: { name: true } },
        _count: {
          select: {
            votes: true,
            reviews: true,
            comments: true
          }
        }
      },
      take: 80,
      orderBy: { createdAt: "desc" }
    }),
    prisma.idea.count({
      where: {
        status: "APPROVED",
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3) }
      }
    }),
    prisma.idea.count({
      where: {
        status: "APPROVED",
        isPaid: true,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3) }
      }
    }),
    prisma.category.findFirst({
      select: {
        name: true,
        _count: { select: { ideas: true } }
      },
      orderBy: {
        ideas: {
          _count: "desc"
        }
      }
    })
  ]);
  const recommendations = scoreIdeas(candidateIdeas, signals);
  const subject = `Your EcoSpark smart recommendations (${(/* @__PURE__ */ new Date()).toLocaleDateString("en-US")})`;
  const previewText = "Products, services, and updates selected from your EcoSpark activity.";
  const baseBundle = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    },
    subject,
    previewText,
    recommendations,
    updates: {
      approvedLast7Days,
      paidApprovedLast7Days,
      trendingCategory: topCategory?.name || "Sustainability"
    }
  };
  return {
    ...baseBundle,
    html: buildEmailHtml(baseBundle),
    text: buildEmailText(baseBundle)
  };
};
var getTransporter = () => {
  const host = process.env.SMTP_HOST?.trim();
  const port = parseNumber(process.env.SMTP_PORT, 587);
  const user = (process.env.SMTP_USER || process.env.APP_USER || "").trim();
  const pass = (process.env.SMTP_PASS || process.env.APP_PASSWORD || "").trim();
  if (!host || !user || !pass) {
    return null;
  }
  const normalizedPass = pass.toLowerCase().replace(/\s+/g, "");
  if (normalizedPass === "apppassword" || normalizedPass === "apppasswords") {
    throw new Error(
      "SMTP password is a placeholder. Use your real Gmail 16-character App Password in SMTP_PASS or APP_PASSWORD."
    );
  }
  return import_nodemailer.default.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
};
var sendNewsletterToUser = async (userId) => {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, and SMTP_USER/SMTP_PASS (or APP_USER/APP_PASSWORD)."
    );
  }
  const bundle = await buildNewsletterBundleForUser(userId);
  const from = process.env.NEWSLETTER_FROM || process.env.SMTP_USER;
  const info = await transporter.sendMail({
    from,
    to: bundle.user.email,
    subject: bundle.subject,
    html: bundle.html,
    text: bundle.text
  });
  return {
    messageId: info.messageId,
    to: bundle.user.email,
    recommendations: bundle.recommendations.length
  };
};
var sendNewsletterToAllUsers = async (limit = 200) => {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: "MEMBER"
    },
    select: { id: true, email: true },
    take: limit,
    orderBy: { createdAt: "desc" }
  });
  let sent = 0;
  let failed = 0;
  const errors = [];
  for (const user of users) {
    try {
      await sendNewsletterToUser(user.id);
      sent += 1;
    } catch (error) {
      failed += 1;
      const msg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`${user.email}: ${msg}`);
    }
  }
  return {
    total: users.length,
    sent,
    failed,
    errors: errors.slice(0, 10)
  };
};

// src/modules/newsletter/newsletter.scheduler.ts
var import_node_cron = __toESM(require("node-cron"));
var task = null;
var parseNumber2 = (value, fallback) => {
  if (!value) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};
var runDispatch = async () => {
  const enabled = (process.env.NEWSLETTER_AUTO_ENABLED || "true").toLowerCase() === "true";
  if (!enabled) {
    return;
  }
  try {
    const limit = parseNumber2(process.env.NEWSLETTER_MAX_USERS_PER_RUN, 200);
    const result = await sendNewsletterToAllUsers(limit);
    console.log("[newsletter] weekly digest completed", result);
  } catch (error) {
    console.error("[newsletter] weekly digest failed", error);
  }
};
var runNewsletterDispatchNow = async (limit) => {
  const envLimit = parseNumber2(process.env.NEWSLETTER_MAX_USERS_PER_RUN, 200);
  const safeLimit = typeof limit === "number" && Number.isFinite(limit) && limit > 0 ? Math.min(limit, 1e3) : envLimit;
  const result = await sendNewsletterToAllUsers(safeLimit);
  console.log("[newsletter] manual dispatch completed", result);
  return result;
};
var startNewsletterScheduler = () => {
  if (task) {
    return;
  }
  const schedule = process.env.NEWSLETTER_CRON || "0 9 * * 1";
  const timezone = process.env.NEWSLETTER_TIMEZONE;
  if (!import_node_cron.default.validate(schedule)) {
    console.error(`[newsletter] invalid NEWSLETTER_CRON: ${schedule}`);
    return;
  }
  task = import_node_cron.default.schedule(
    schedule,
    () => {
      void runDispatch();
    },
    timezone ? { timezone } : void 0
  );
  if ((process.env.NEWSLETTER_RUN_ON_BOOT || "false").toLowerCase() === "true") {
    void runDispatch();
  }
  console.log(
    `[newsletter] scheduler started with cron "${schedule}"${timezone ? ` (${timezone})` : ""}`
  );
};

// src/modules/newsletter/newsletter.controller.ts
var getMyRecommendations = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const bundle = await buildNewsletterBundleForUser(userId);
    return res.json({
      subject: bundle.subject,
      previewText: bundle.previewText,
      recommendations: bundle.recommendations,
      updates: bundle.updates
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to build recommendations";
    return res.status(500).json({ message });
  }
};
var sendMeNewsletter = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await sendNewsletterToUser(userId);
    return res.json({ message: "Newsletter sent", result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send newsletter";
    return res.status(500).json({ message });
  }
};
var sendAllNewsletters = async (req, res) => {
  try {
    const requested = Number(req.body?.limit);
    const limit = Number.isFinite(requested) && requested > 0 ? Math.min(requested, 1e3) : 200;
    const result = await sendNewsletterToAllUsers(limit);
    return res.json({ message: "Bulk newsletter processing completed", result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send newsletters";
    return res.status(500).json({ message });
  }
};
var runNewsletterNow = async (req, res) => {
  try {
    const requested = Number(req.body?.limit);
    const limit = Number.isFinite(requested) && requested > 0 ? Math.min(requested, 1e3) : void 0;
    const result = await runNewsletterDispatchNow(limit);
    return res.json({ message: "Newsletter cron simulation executed", result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to execute newsletter cron simulation";
    return res.status(500).json({ message });
  }
};

// src/modules/newsletter/newsletter.route.ts
var router12 = import_express12.default.Router();
router12.get("/recommendations", authMiddleware, getMyRecommendations);
router12.post("/send-me", authMiddleware, sendMeNewsletter);
router12.post("/send-all", authMiddleware, adminOrManager, sendAllNewsletters);
router12.post("/run-now", authMiddleware, adminOnly, runNewsletterNow);
var newsletter_route_default = router12;

// src/app.ts
import_dotenv.default.config();
var app = (0, import_express13.default)();
app.use((0, import_cors.default)());
var PORT = process.env.PORT || 5e3;
app.post(
  "/api/payments/webhook",
  import_express13.default.raw({ type: "application/json" }),
  handleWebhook2
);
app.use(import_express13.default.json({ limit: "25mb" }));
app.use(import_express13.default.urlencoded({ extended: true, limit: "25mb" }));
app.get("/", (req, res) => {
  res.json({ message: "Welcome to EcoSpark API" });
});
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello World" });
});
app.use("/api/comments", comment_routes_default);
app.use("/api/ideas", idea_route_default);
app.use("/api/auth", auth_route_default);
app.use("/api/votes", vote_routes_default);
app.use("/api/reviews", review_route_default);
app.use("/api/categories", category_route_default);
app.use("/api/admin", admin_route_default);
app.use("/api/watchlist", watchlist_route_default);
app.use("/api/payments", Payment_route_default);
app.use("/api/stats", stats_route_default);
app.use("/api/chatbot", chat_router_default);
app.use("/api/newsletter", newsletter_route_default);
app.post("/api/chat", chatHandler);
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: "This is protected", user: req.user });
});
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});
app.use(errorMiddleware);
var app_default = app;

// src/server.ts
var bootstrap = async () => {
  try {
    app_default.listen(process.env.PORT, () => {
      console.log(`Server is running on http://localhost:${process.env.PORT}`);
      startNewsletterScheduler();
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};
bootstrap();
