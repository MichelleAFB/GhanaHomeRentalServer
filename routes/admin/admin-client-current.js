const express = require("express");
const router = express.Router();
const cookie = require("universal-cookie");
const bcrypt = require("bcryptjs");
//const db_config = require("../../config/db");
const mysql = require("mysql");
const cors = require("cors");
const  axios= require("axios");
var {db}=require("../../config/newdb")
const bodyParser = require("body-parser");
const mongoose=require("mongoose")
const uniqueValidator = require('mongoose-unique-validator')
const {db_config}=require("../../config/db")

const connectdb = async () => {
  try {
    console.log("hello");
    const conn = await mongoose.connect(
      "mongodb+srv://MAB190011:Mirchoella22@atlascluster.xdodz.mongodb.net/ghanahomestay?retryWrites=true&w=majority",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    return conn
    console.log(`MONGO DB connected: ${conn.connection.host}`);
  } catch (err) {
    //console.log(err.stack);
    // process.exit(1)
  }
};
var dbmongo
connectdb().then((conn)=>{
  //console.log(conn)
  dbmongo=conn.connection
})

router.use(bodyParser.json());
var corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};

router.use(cors(corsOptions));



function handleDisconnect() {
  connection = mysql.createConnection(
    {user:"root",
    password:"",
    host:'localhost',
    port:'3306'}
  );

  connection.connect(function(err) {
    if (err) {
      console.log("error when connecting to db:", err);
      setTimeout(handleDisconnect, 2000);
    }else{
        console.log("connection is successfull");
    }
  });
  connection.on("error", function(err) {
    console.log("db error", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}
handleDisconnect();






router.get("/", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.json("Welcome to home stay ghana server : ADMIN APPLICATIONS");
});

router.get("/getActiveStatus/:id",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  db.query("select count(*) as appCount from ghanahomestay.applications where id=?",req.params.id,(err,results)=>{
    if(err){
      console.log(err)
    }else{
      const appCount=Object.values(JSON.parse(JSON.stringify(results)))
      const count=appCount[0].appCount
      if(count>0){
        db.query("select * from ghanahomestay.applications where id=?",req.params.id,(err1,results1)=>{
          if(err1){
            console.log(err1)
          }else{
            const app=results1[0]
            const cDate=new Date()
            const currDate=cDate.toString().substring(0,15)
            var months= ["Jan","Feb","Mar","Apr","May","Jun","Jul",
            "Aug","Sep","Oct","Nov","Dec"];
            var monthnum=["01","02","03","04","05","06","07","08","09","10","11","12"]
            var st=app.stay_start_date.split(" ")
            var et=app.stay_end_date.split(" ")
           //active Date starts 1day before
            const startDate=new Date(st[3],monthnum[months.indexOf(st[1])-1],st[2])
            const endDate=new Date(et[3],monthnum[months.indexOf(et[1])-1],et[2])
            var activeDate=new Date(startDate)
            var nextnext=activeDate.setDate(cDate.getDate()+1)
            activeDate=new Date(nextnext)
            console.log("today:"+activeDate.toString().substring(0,15))
            console.log(app)
            console.log("currentlyOccupied:"+app.currentlyOccupied)
            console.log((cDate<endDate ))
            console.log((cDate>startDate))
            console.log(cDate+" "+startDate)
            if(app.currentlyOccupied==1 && app.application_status=="CONFIRMED"){
            
              console.log("ALREADY SET")
              res.json({success:true,currentlyOccupied:true})
            }if((app.currentlyOccupied!=1 && ((activeDate>=startDate && activeDate<endDate) || (cDate<endDate && cDate>=startDate)) ) && app.application_status=="CONFIRMED"){
              console.log(app.stay_start_date+" "+activeDate.toString().substring(0,15))
              console.log("ACTIVED")
               db.query("update ghanahomestay.applications set currentlyOccupied=1 where id=?",req.params.id,(err2,results2)=>{
                
                if(err2){
                  console.log(err2)
                }else{
                  console.log(results2)
                  console.log("UPDATE")
                  res.json({success:true,currentlyOccupied:true})
                }
               })
            }if(!((app.currentlyOccupied!=1 && (activeDate>=startDate && activeDate<endDate) ) && app.application_status=="CONFIRMED") && !(app.currentlyOccupied==1 && app.application_status=="CONFIRMED")){
              console.log("ELSE")
              res.json({success:true,currentlyOccupied:false})
             
            }
          }
        })

      }else{
        console.log("NO APPS")
        res.json({success:false,message:"Application "+req.params.id+" does not exist"})
      }

    }
  })
})

/***************************************************MAINTENANCE************* */
router.get("/maintenance-issues/:id",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  db.query("select count(*) as appCount from ghanahomestay.maintenance where application_id=?",req.params.id,(err,results)=>{
    if(err){
      console.log(err)
    }else{
      const appCount=Object.values(JSON.parse(JSON.stringify(results)))
      const count=appCount[0].appCount
      console.log(count)
      if(count>0){
        db.query("select * from ghanahomestay.maintenance where application_id=?",req.params.id,(err1,results1)=>{
          if(err1){
            console.log(err1)
          }else{
            console.log(results1)
            res.json({success:true,issues:results1,no_issues:count})
          }
      })

      }else{
        res.json({success:true,issues:[],no_issues:count})
      }
    }
  })
})


module.exports=router