const express = require("express");
const router = express.Router();
const cookie = require("universal-cookie");
const bcrypt = require("bcryptjs");

const mysql = require("mysql");
const cors = require("cors");
var {db}=require("../config/newdb")
var {new_db_config}=require("../config/newdb")




const bodyParser = require("body-parser");

router.use(bodyParser.json());
var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
};

router.use(cors(corsOptions))



function handleDisconnect() {
  if (db == null || db.state == "disconnected") {
    db = mysql.createConnection(new_db_config); // Recreate the connection, since
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


router.get("/",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.json("Welcome to home stay ghana server : SIGNUP")
})

router.get("/test",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  db.query("select * from ghanahomestay.applications",(err,results)=>{
    if(err){
      console.log(err)
    }
    console.log(results)
  })
})

//args: firstname,lastname,email,phone,password

const date=new Date
router.post("/create-user",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");


  const info=req.params
  const password=req.body.password
  const email=req.body.email
  const phone=req.body.phone
  const firstname=req.body.firstname
  const lastname=req.body.lastname

  const prom=new Promise((resolve,reject)=>{
    

    const saltRounds=10
    bcrypt.genSalt(saltRounds, function(err, salt) {
      bcrypt.hash(password, salt, function(err, hash) {
                console.log(hash)

                db.query("insert into ghanahomestay.users (hash,email,firstname,lastname,phone) values (?,?,?,?,?)",[hash,email,firstname,lastname,phone],(errDB,resultsDB)=>{
                    if(errDB){
                      console.log(errDB)
                    }
                    console.log(resultsDB)
                    //TODO:DISABLE MULTIPLESAME EMAIL FOR MULTIPLE PASSWORD
                    if(resultsDB.affectedRows>0){
                      res.json({success:true})
                    }

                })     
       });
    });
  })

})


module.exports=router