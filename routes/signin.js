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
const {Maintenanace}=require("../models/Maintenance")

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

handleDisconnect();



router.get("/",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.json("Welcome to home stay ghana server : SIGNIN")
})

//args:email,password,adminId
router.post("/sign-in-admin",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");


  const email=req.body.email
  
  const prom=new Promise(async(resolve,reject)=>{

    const user=await User.find({"admin":1},{"email":email})

    if(user!=null){
      const hash=user.hash
    }

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
router.get("/sqltomongo",(req,res)=>{
  db.query("select * from ghanahomestay.users ",(err,results)=>{
    if(err){
      console.log(err)
    }else{
      console.log(results)
      results.map(async(a)=>{
        const user=new User({
          firstname:a.firstname,
          lastname:a.lastname,
          phone:a.phone,
          email:a.email,
          hash:a.hash,
          dateCreated:a.dateCreated,
          admin:a.admin
        })
        const saved=await user.save()
        console.log(saved)
      })
    }
  })
})

router.get("/applications",(req,res)=>{
  db.query("select * from ghanahomestay.applications",(err,results)=>{
    results.map(async(u)=>{
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
      const saved=await application.save()

      db.query("select * from ghanahomestay.application_review_images where application_id=?",u.id,(err1,results1)=>{
        if(err1){
          console.log(err1)
        }else{
          results1.map(async(r)=>{
            const review=new ApplicationReviewImage({
              application_id:saved.id,
              img_url:r.img_url
            })
            const rev=await review.save()
          })
        }
      })

      db.query("select * from ghanahomestay.booked_dates where application_id=?",u.id,(err1,results1)=>{
        if(err1){
          console.log(err1)
        }else{
          results1.map(async(r)=>{
            const booked=new BookedDate({
              application_id:saved.id,
              date:r.date
            })
            const boo=await booked.save()
          })
        }
      })

      db.query("select * from ghanahomestay.maintenance where application_id=?",u.id,(err1,results1)=>{
        if(err1){
          console.log(err1)
        }else{
          results1.map(async(r)=>{
            const maintenance=new Maintenance({
              application_id:saved.id,
              mechanism:r.mechanism,
              dateRecieved:r.dateRecieved,
              message:r.message,
              dateResolved:r.dataResolved,
              status:r.status,
            })
            const main=await maintenance.save()
          })
        }
      })


   
      db.query("select * from ghanahomestay.application_occupants where application_id=?",u.id,(err1,results1)=>{
        if(err1){
          if(err1){
            console.log(err1)

          }else{
            results1.map(async(o)=>{
              const occupant=new ApplicationOccupant({
                firstname:o.firstname,
                lastname:o.lastname,
                age:o.age,
                association:o.association,
                application_id:saved.id,
                email:o.email,
                child:o.child
              })

              const occ=await occupant.save()
              db.query("select * from ghanahomestay.application_restricted_individuals where occupant_id=?",o.id,(err2,results2)=>{
                if(err2){
                  console.log(err2)
                }else{
                  results2.map(async(g)=>{
                        const restricted=new ApplicationRestrictedIndividual({
                          firstname:g.firstname,
                          lastname:g.lastname,
                          occupant_id:occ.id,
                          phone:g.phone,
                          email:g.email,
                          application_id:saved.id,
                          img_url:g.img_url
                        })
                        const restr=await restricted.saved()
                  })
                }
              })

              db.query("select * from ghanahomestay.application_guests where occupant_id=?",o.id,(err2,results2)=>{
                if(err2){
                  console.log(err2)
                }else{
                  results2.map(async(g)=>{
                        const guest=new ApplicationGuest({
                          firstname:g.firstname,
                          lastname:g.lastname,
                          occupant_id:occ.id,
                          phone:g.phone,
                          email:g.email,
                          application_id:saved.id
                        })
                        const gue=await guest.saved()
                  })
                }
              })

            })
          }
        }
      })
      console.log(saved)
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