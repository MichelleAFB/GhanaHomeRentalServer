const express = require("express");
const router = express.Router();
const cookie = require("universal-cookie");
const bcrypt = require("bcryptjs");

const mysql = require("mysql");
const cors = require("cors");
var {db}=require("../config/newdb")
var {db_config}=require("../config/db")
const bodyParser = require("body-parser");
const {User}=require("../models/User")
const mongoose=require("mongoose")


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
 
  dbmongo=conn.connection
})

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
      bcrypt.hash(password, salt,async function(err, hash) {
                console.log(hash)
                var dateCreated=new Date()
                dateCreated=dateCreated.toString().substring(0,15)
                const user=new User({
                  firstname:firstname,
                  lastname:lastname,
                  phone:phone,
                  email:email,
                  hash:hash,
                  dateCreated:dateCreated,
                  admin:0
                })

                const saved=await user.save()
                try{
                  res.json({success:true})
                }catch(err){
                  res.json({success:false})
                }   
       });
    });
  })

})


module.exports=router