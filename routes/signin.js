const express = require("express");
const router = express.Router();
const cookie = require("universal-cookie");
const bcrypt = require("bcryptjs");
//const db_config = require("../config/db");
const mysql = require("mysql");
const cors = require("cors");
var {db}=require("../config/newdb")
var {db_config}=require("../config/db")
const mongoose=require("mongoose")
const uniqueValidator = require('mongoose-unique-validator')

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

const bodyParser = require("body-parser");

router.use(bodyParser.json());
var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
};

router.use(cors(corsOptions))





function handleDisconnect() {
  if (db == null || db.state == "disconnected") {
    db = mysql.createConnection(
      {user:"root",
      password:"",
      host:'localhost',
      port:'3306'}
    ); // Recreate the connection, since
    // the old one cannot be reused.
    db.connect(function (err) {
      // The server is either down
      if (err) {
        // or restarting (takes a while sometimes).
        console.log("error when connecting to db:", err);
        setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
      } // to avoid a hot loop, and to allow our node script to
    }); // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    db.on("error", function (err) {
      console.log("db error", err);
      if (err.code === "PROTOCOL_CONNECTION_LOST") {
        // Connection to the MySQL server is usually
        handleDisconnect(); // lost due to either server restart, or a
      } else {
        // connnection idle timeout (the wait_timeout
       // throw err; // server variable configures this)
       console.log(":mongo failed")
      }
    });
  }
}

handleDisconnect(db);
/*
function handleDisconnect() {
  if (db == null || db.state == "disconnected") {
    db = mysql.createConnection(db_config); // Recreate the connection, since
    // the old one cannot be reused.
    db.connect(function (err) {
      // The server is either down
      if (err) {
        // or restarting (takes a while sometimes).
        console.log("error when connecting to db:", err);
        setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
      } // to avoid a hot loop, and to allow our node script to
    }); // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    db.on("error", function (err) {
      console.log("db error", err);
      if (err.code === "PROTOCOL_CONNECTION_LOST") {
        // Connection to the MySQL server is usually
        handleDisconnect(); // lost due to either server restart, or a
      } else {
        // connnection idle timeout (the wait_timeout
       // throw err; // server variable configures this)
       console.log(":mongo failed")
      }
    });
  }
}

handleDisconnect();

var db;
*/

var db= mysql.createConnection({
  user:"bd4e78905dad5a",
  host:'us-cdbr-east-06.cleardb.net',
  password:"5e037d99",
  database:"heroku_ad7f7c4ee7bc6b0"
}) 

db.connect(()=>{
  console.log("conecteddddd")
})

router.get("/",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.json("Welcome to home stay ghana server : SIGNIN")
})

//args:email,password,adminId
router.post("/sign-in-admin",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");


  const email=req.body.email
  
  const prom=new Promise((resolve,reject)=>{

    db.query("select count(*) as adminCount from ghanahomestay.users where admin=1 && email=?",email,(errCount,resultsCount)=>{
      if(errCount){
        console.log(errCounts)
      }else{
        const adminCount=Object.values(JSON.parse(JSON.stringify(resultsCount)))
   
        const count=resultsCount[0].adminCount
        if(count>0){

          db.query("select * from ghanahomestay.users where admin=1 && email=?",email,(err,results)=>{
            if(err){
              console.log(err)
            }
            const hash=results[0].hash
            bcrypt.compare(req.body.password, hash, function(err, result) {
              console.log("hashed:"+result)
              if(result==true){
                res.json({success:true,admin:{firstname:results[0].firstname,lastname:results[0].lastname,email:results[0].email,phone:results[0].phone}})
              }else{
                res.json({success:false,message:"wrong password"})
              }
            });
          })

        }

      }
    })
 
  })
})

//args:email, password
router.post("/sign-in-user",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");


  const info=req.body

  const prom=new Promise((resolve,reject)=>{
    db.query("select count(*) as userCount from ghanahomestay.users where email=?",info.email,(err,results)=>{
      
      if(err){
        console.log(err)
      }
      const userCount=Object.values(JSON.parse(JSON.stringify(results)))
     
      const count=userCount[0].userCount
      console.log(count)
      if(count==1){

        db.query("select * from ghanahomestay.users where email=? && admin=0 ",info.email,(err1,results1)=>{
          console.log(results1)
          if(err1){
            console.log(err1)
          }
          const hash=results1[0].hash
          bcrypt.compare(info.password, hash, function(err, result) {
            console.log("hashed:"+result)
            if(result==true){
              res.json({success:true,client:{firstname:results1[0].firstname,lastname:results1[0].lastname,email:results1[0].email,phone:results1[0].phone}})
            }
          });
        })
      }
      if(count>1){
        
        db.query("select * from ghanahomestay.users where email=? && admin=0",info.email,(err1,results1)=>{
          
          
          if(err1){
            console.log(err1)
          }
          console.log(results1)
          results1.map((e)=>{

            
            const hash=e.hash
            var end=false
            bcrypt.compare(req.body.password, hash, function(err, result) {
              console.log("hashed:"+result)
              if(result==true){
                try{
                  res.json({success:true,client:{firstname:e.firstname,lastname:e.lastname,email:e.email,phone:e.phone}})
                }catch(error){
                  console.log(error)
                }
                
              }
            });
          })
          })
      }
    })
  })
})




module.exports=router