const express = require("express");
const router = express.Router();
const cookie = require("universal-cookie");
const bcrypt = require("bcryptjs");

const mysql = require("mysql");
const cors = require("cors");
const bodyParser = require("body-parser");
const {User}=require("../models/User")
const{Application}=require("../models/Application")
const mongoose=require("mongoose")
const {ApplicationOccupant}=require("../models/ApplicationOccupant");
const { ApplicationReviewImage } = require("../models/ApplicationReviewImages");
const { ApplicationGuest } = require("../models/ApplicationGuests");
const { ApplicationRestrictedIndividual } = require("../models/ApplicationRestrictedIndividuals");
const { BookedDate } = require("../models/BookedDates");
const {Maintenance}=require("../models/Maintenance")



const connectdb = async () => {
  try {
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
  origin: '*',
  optionsSuccessStatus: 200
};

router.use(cors(corsOptions))



var db

function handleDisconnect() {
  if (db == null || db.state == "disconnected") {
    console.log("restarting getting db connection")
    db = mysql.createConnection(  
      {user:"root",
    password:"",
    host:'localhost',
    port:'3306'}); // Recreate the connection, since
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

//handleDisconnect();



router.get("/",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.json("Welcome to home stay ghana server : SIGNIN")
})



router.post("/sign-in-admin",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");


  const email=req.body.email
  const adminId=req.body.adminId
  const prom=new Promise(async(resolve,reject)=>{
    var user=await User.find({
      $and:[
         {"email":email},
        {"admin_id":adminId},
        {"admin":1}
      ]
    })
    console.log(user)
    user=user[0]
    console.log("user")
    console.log(user)
    if(user==null){
      var checkEmail=await User.find({$and:[{"email":email}]})
      checkEmail=checkEmail[0]
      if(checkEmail==null){
        res.json({success:false,message:"No account is linked to email:"+email})

      }else{
        var checkAdmin=await User.find({$and:[{"email":email},{"admin":1}]})
        checkAdmin=checkAdmin[0]
        if(checkAdmin==null){
          res.json({success:false,message:"No administrative access is granted to email:"+email + " with ID: "+ adminId})
        }else{
          res.json({success:false,message:"cannot find user"})
        }
      }
    }
    if(user!=null){
      const hash=user.hash
      bcrypt.compare(req.body.password, hash, function(err, result) {
        console.log("hashed:"+result)
        if(result==true){
          res.json({success:true,admin:{firstname:user.firstname,lastname:user.lastname,email:user.email,phone:user.phone,admin_id:user.id}})
        }else{
          res.json({success:false,message:"wrong password"})
        }
      });
    }
  })

  
})




//args:email, password
router.post("/sign-in-user",async(req,res)=>{



  const email=req.body.email
  const adminId=req.body.adminId
  const prom=new Promise(async(resolve,reject)=>{
    const userInfo=await User.find({
      $and:[
        {"email":email},
        {"admin":0}
      ]
    })
    var user=userInfo[0]
    console.log("user")
    console.log(user)
    if(user!=null){
      const hash=user.hash
      bcrypt.compare(req.body.password, hash, async(err, result)=> {
        console.log("hashed:"+result)
        if(result==true){
          res.json({success:true,client:{firstname:user.firstname,lastname:user.lastname,email:user.email,phone:user.phone}})
        }else{
          res.json({success:false,message:"wrong password"})
        }
      });
    }
  })
})

router.get("/apps",async(req,res)=>{
  db.query("select * from ghanahomestay.applications",(err,results)=>{
    if(err){
      console.log(err)
    }
    results.map((u)=>{
      
        const application=new Application({
          firstname:u.firstname,
          middlename:u.middlename,
          lastname:u.lastname,
          phone:u.phone,
          email:u.email,
          stay_start_date:u.stay_start_date,
          stay_end_date:u.stay_end_date,
          no_adults:u.no_adults,
          no_children:u.no_children,
          dateReceived:u.dateReceived,
          notify_admin_message:u.notify_admin_message,
          no_occupants:u.no_occupants,
          notify_applicant:u.notify_applicant,
          notify_admin:u.notify_admin,
          application_status:u.application_status,
          approved:u.approved,
          dateApproved:u.dateApproved,
          confirmedApproved:u.confirmedApproved,
          dateReserved:u.dateReserved,
          dateDenied:u.dateDenied,
          datePaymentDue:u.datePaymentDue,
          notify_admin_message:u.notify_admin_message,
          notify_applicant_message:u.notify_applicant_message,
          datePaid:u.datePaid,
          currentlyOccupied:u.currentlyOccupied,
          checkoutTimeout:u.checkoutTimeout,
          review:u.review,
          paymentSessionUrl:u.paymentSessionUrl,
          checkedIn:u.checkedIn,
          timeCheckedIn:u.timeCheckedIn
        })
        console.log(application)

  
   })
  })
})

router.post("/reset-password/:email",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");
  const password=req.body.password
  const passwordConfirm=req.body.confirmPassword
  const email=req.params.email
  console.log(req.body)
  var user=await User.find(({$and:[{"email":email},{"admin":0}]}))
  console.log(user)

  if(password==passwordConfirm){
 
    user=user[0]
    if(user!=null){
      const saltRounds=10
      bcrypt.genSalt(saltRounds, function(err, salt) {
        bcrypt.hash(password, salt,async function(err, hash) {
          console.log(hash)
          const update=await User.updateOne({"_id":user.id},{
            $set:{
              "hash":hash
            }
          })
          if(update.acknowledged){
            const updatedUser=await User.find({$and:[{"_id":user.id}]})
            res.json({success:true,user:updatedUser})
          }

        }
        )
      })

    }else{
      res.json({success:false,message:"user with email "+email+" does not exist."})
    }

  }else{
    res.json({success:false,message:"passwords do not match."})
  }
})

router.post("/reset-password/admin/:email",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");
  const password=req.body.password
  const passwordConfirm=req.body.confirmPassword
  const email=req.params.email
  console.log(req.body)

  if(password==passwordConfirm){
    var user=await User.find(({$and:[{"email":email},{"admin":1}]}))
    user=user[0]
    if(user!=null){
      const saltRounds=10
      bcrypt.genSalt(saltRounds, function(err, salt) {
        bcrypt.hash(password, salt,async function(err, hash) {
          console.log(hash)
          const update=await User.updateOne({"_id":user.id},{
            $set:{
              "hash":hash
            }
          })
          if(update.acknowledged){
            const updatedUser=await User.find({$and:[{"_id":user.id}]})
            res.json({success:true,user:updatedUser})
          }

        }
        )
      })

    }else{
      res.json({success:false,message:"user with email "+email+" does not exist."})
    }

  }else{
    res.json({success:false,message:"passwords do not match."})
  }
})


module.exports=router