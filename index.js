/*
import express from 'express'
import mysql from 'mysql'
import cors from 'cors'
import axios from 'axios'
import cheerio from 'cheerio'
import puppeteer from 'puppeteer'
import fs from 'fs'
import cl from 'cloudinary'
import client from 'https'
import bcrypt from 'bcrypt'

import passport from 'passport'
import download from 'image-downloader'
import denv from 'dotenv'
import session from 'express-session'
*/

const dotenv = require("dotenv");
dotenv.config({path:'.env'});
const express = require("express");
//const app = express();
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const router = express.Router();

//const { createProxyMiddleware } = require("http-proxy-middleware");
const passport = require("passport");

const cors = require("cors");
const { initialize } = require("passport");
const mysql = require("mysql");
const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const fs = require("fs");
const client = require("https");
const download = require("image-downloader");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const swaggerUI = require("swagger-ui-express");
const bodyParser = require("body-parser");
const env=process.env.NODE_ENV
const strip=require('stripe')(process.env.STRIP_KEY)
const new_db_config=require("./config/newdb")
//const process=require("pm2")

var cluster = require('cluster');
if (cluster.isMaster) {
  cluster.fork();

  cluster.on('exit', function(worker, code, signal) {
    cluster.fork();
  });
}

if (cluster.isWorker) {
  

const app=express()


app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
const morgan = require("morgan");

const corsOptions={
  origin: 'https://ghanahomestayserver.onrender.com/*'
}


app.use(morgan('tiny'));
app.use(cors(corsOptions))

/*

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
const morgan = require("morgan");


app.use(morgan('tiny'));
app.use(cors(corsOptions))
app.listen( process.env.PORT,()=> {console.log("Server running ")});
//*************************** */
//console.log(new_db_config)

/*
var newdb
function handleDisconnect(newdb,new_db_config) {
  if (newdb == null || newdb.state == "disconnected") {
    newdb = mysql.createConnection(new_db_config); // Recreate the connection, since
    // the old one cannot be reused.
    newdb.connect(function (err) {
      // The server is either down
      if (err) {
        // or restarting (takes a while sometimes).
        console.log("error when connecting to db:", err);
        setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
      }else{
        console.log()
      } // to avoid a hot loop, and to allow our node script to
    }); // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    newdb.on("error", function (err) {
      console.log("db error", err);
      if (err.code === "PROTOCOL_CONNECTION_LOST") {
        // Connection to the MySQL server is usually
        handleDisconnect(); // lost due to either server restart, or a
      } else {
        // connnection idle timeout (the wait_timeout
        // throw err; // server variable configures this)
        console.log(":mongo failed");
      }
    });
  }
}

handleDisconnect(newdb,new_db_config)
*/




/***************************CONNECT DB ************************************************************ */
const db = require("./config/db");
const { Application } = require("./models/Application");
db.connect(() => {
  console.log("db connected in index route");
});

/*********************************RUN SERVER************************************************************* */
console.log("port:"+process.env.PORT)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
const port=process.env.PORT

/**************************************CORS********************************************************* */
/*
const source="https://ghanahomerental.onrender.com/*"
var corsOptions = {
  origin: "*",
  "Access-Control-Allow-Origin":source,
  optionsSuccessStatus: 200,
};
*/

app.use(cors(corsOptions))
app.listen( process.env.PORT,()=> {console.log("Server running ")});




/************************************************************************************************************************************************************************************************************************************************************************************************************* */

/*const applicationsRouter= require("./router").applicationsRouter;
app.use("/applications", applicationsRouter);
*/

const residentsRouter = require("./router").residentsRouter;
app.use("/residents", residentsRouter);

const signUpRouter = require("./router").signUpRouter;
app.use("/sign-up", signUpRouter);

const signInRouter = require("./router").signInRouter;
app.use("/sign-in", signInRouter);


const stripPaymentRouter=require('./router').stripPaymentRouter
app.use("/payment",stripPaymentRouter)

const clientApplicationsRouter=require("./router").clientApplicationsRouter
app.use("/client-applications",clientApplicationsRouter)


const adminApplicationsRouter=require("./router").adminApplicationsRouter 
app.use("/admin-applications",adminApplicationsRouter) 



const currentClientRouter=require("./router").currentClientRouter
app.use("/current-resident",currentClientRouter)  

const adminCurrentClientRouter=require("./router").adminCurrentClientRouter
app.use("/admin-current-resident",adminCurrentClientRouter)  
/************************************************************************************************************************************************************************************************************************************************************************************************************* */
const routers=[{router:residentsRouter,path:"/residents"},{router:signUpRouter,path:"/sign-up"},{router:signInRouter,path:"/sign-in"},{router:stripPaymentRouter,path:"/payment"},{router:adminApplicationsRouter,path:"/admin-applications"},{router:clientApplicationsRouter,path:"/client-applications"},{router:adminCurrentClientRouter,path:"/admin-current-resident"},{router:currentClientRouter,path:"/current-resident"}]





app.get("/", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  
  const updates=[]
  const prom=new Promise(async(resolve,reject)=>{
    const apps=await Application.find({})
    const updates=[]
    apps.map((a)=>{
      
      axios.get("https://ghanahomestayserver.onrender.com/client-applications/getActiveStatus/"+a._id).then((response)=>{
        console.log(response.data)
        updates.push({data:response.data,stay:a.stay_start_date+" - "+a.stay_end_date})
        console.log(apps.length)
        console.log(updates.length)
        if(updates.length==apps.length-1){
         // res.json({message:"Welcome to home ghana stay server\n\n",apps:updates});

          resolve()
        }
      })
    })

  

  })

  prom.then(()=>{
   res.json({message:"Welcome to home ghana stay server\n\n",apps:updates});
    
  })
});
}


