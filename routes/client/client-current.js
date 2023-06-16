const express = require("express");
const router = express.Router();
const cookie = require("universal-cookie");
const bcrypt = require("bcryptjs");
const {db_config} = require("../../config/db");
const mysql = require("mysql");
const cors = require("cors");
const axios=require('axios')
var {db}=require("../../config/db")
const bodyParser = require("body-parser");
const mongoose=require("mongoose")
const uniqueValidator = require('mongoose-unique-validator')
const {Application}=require("../../models/Application");
const { ApplicationGuest } = require("../../models/ApplicationGuests");
const { ApplicationRestrictedIndividual } = require("../../models/ApplicationRestrictedIndividuals");
const { ApplicationReviewImage } = require("../../models/ApplicationReviewImages");
const {Maintenance} =require("../../models/Maintenance")
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
        console.log(":mongo failed");
      }
    });
  }
}

//handleDisconnect();




router.get("/", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.json("Welcome to home stay ghana server : CURRENT RESIDENT");
});


function handleDisconnect() {
  if (db == null || db.state == "disconnected") {
  db = mysql.createConnection(
    {
      user:"root",
      host:'localhost',
      password:"",
      port:3306,
    }
  ); // R
    console.log("------connection lost-----------")
    //ecreate the connection, since
    // the old one cannot be reused.
    db.connect(function (err) {
      // The server is either down
      //console.log(db)
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
        console.log(":mongo failed");
      }
    });
  }
}

//handleDisconnect();

router.get("/getActiveStatus/:id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  var app= await Application.find({
    $and:[
      {"id":req.params.id}
    ]
  })
  app=app[0]
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
            console.log(app.currentlyOccupied)
            if(app.currentlyOccupied==1 && app.application_status=="CONFIRMED"){
            
              console.log("ALREADY SET")
              res.json({success:true,currentlyOccupied:true})
            }if((app.currentlyOccupied!=1 && (activeDate>=startDate && activeDate<endDate) ) && app.application_status=="CONFIRMED"){
              console.log(app.stay_start_date+" "+activeDate.toString().substring(0,15))
              console.log("ACTIVED")
              const updated=await Application.update(
                {"_id":req.params.id}
                ,{
                  $set:{
                    "currentlyOccupied":1
                  }
                })
                console.log(updated)
          
              
            }if(!((app.currentlyOccupied!=1 && (activeDate>=startDate && activeDate<endDate) ) && app.application_status=="CONFIRMED") && !(app.currentlyOccupied==1 && app.application_status=="CONFIRMED")){
              console.log("ELSE")
              res.json({success:true,currentlyOccupied:false})
             
            }

  /*db.query("select count(*) as appCount from ghanahomestay.applications where id=?",req.params.id,(err,results)=>{
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
            console.log(app.currentlyOccupied)
            if(app.currentlyOccupied==1 && app.application_status=="CONFIRMED"){
            
              console.log("ALREADY SET")
              res.json({success:true,currentlyOccupied:true})
            }if((app.currentlyOccupied!=1 && (activeDate>=startDate && activeDate<endDate) ) && app.application_status=="CONFIRMED"){
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
  */
})
/*********************************************GUESTS & RESTRICTED INDIVIDUALS */

router.get("/guests/:id/:occupant_id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  const id=req.params.id
  const occupant_id=req.params.occupant_id
  const guests=req.body.guests
  const guest=await ApplicationGuest.find({$and:[{"application_id":id},{"occupant_id":occupant_id}]})
  if(guest!=null){
    res.json({success:true,guests:guest})

  }else{
    res.json({success:false,message:"no occupants with id "+occupant_id})
  }
})


router.post("/edit-guests/:id/:occupant_id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  const id=req.params.id
  const occupant_id=req.params.occupant_id
  const guests=req.body.guests
  console.log(req.body)
  var index=0
  var app=await Application.find({$and:[{"_id":req.params.id},{"currentlyOccupied":1}]})
  app=app[0]
  if(app!=null){
    var index=0
    const prevGuests=await ApplicationGuest.find({$and:[{"occupant_id":req.params.occupants_id},{"application_id":req.params.id}]})
    console.log(prevGuests)
    if(prevGuests.length>0){
      const removeOldGuests=await ApplicationGuest.remove({"occupant_id":req.params.occupant_id})
      console.log(removeOldGuests)
    }
    

    const guest=req.body.guests
    guests.map(async(g)=>{
      if(g.firstname!=''){
      const guest=new ApplicationGuest({
        occupant_id:req.params.occupant_id,
        firstname:g.firstname,
        lastname:g.lastname,
        phone:g.phone,
        email:g.email,
        application_id:req.params.id
      })
      const saved=await guest.save()
      const newGuests=await ApplicationGuest.find({$and:[{"occupant_id":req.params.occupant_id}]})
      index++
      if(index==guests.length-1){
        res.json({success:true,guests:newGuests,no_guests:index})
      }
    }
     
    
    })
  }else{
      res.json({success:false,message:"app "+req.params.id+" does not exist"})
  }
})


  

 

router.post("/restricted-individuals/:id/:occupant_id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");
  const rest=req.body.restricted
  const restricted=rest.filter((u) => u.firstname.length>0 )
  console.log(restricted)
  var index=0
 

 
  var app=await Application.find({$and:[{"_id":req.params.id},{"currentlyOccupied":1}]})
  app=app[0]
  if(app!=null){
    const prevRestricted=await ApplicationRestrictedIndividual.find({$and:[{"occupant_id":req.params.occupant_id},{"application_id":req.params.id}]})
    if(prevRestricted.length>0){
      const restrictedInd=await ApplicationRestrictedIndividual.remove({$and:[{"occupant_id":req.params.occupant_id}]})
    }
    restricted.map(async(r)=>{
      console.log(r.firstname.length)
      if(r.firstname.length>0 && r.lastname.length>0){
      const rest=new ApplicationRestrictedIndividual({
        firstname:r.firstname,
        middlename:r.middlename,
        lastname:r.lastname,
        img_url:r.img_url,
        application_id:req.params.id,
        occupant_id:req.params.occupant_id
      })

      const saved=await rest.save()
      console.log(saved)
      var restrict=await ApplicationRestrictedIndividual.find({$and:[{"_id":saved._id}]})
      restrict=restrict[0]
      if(restrict!=null){
        index++
      }

      
      if(index==restricted.length-1){
        res.json({success:true,restricted:restrict,no_restricted:index})
      }
    }
    })

  }else{
    res.json({success:false,message:" app "+req.params.id+" does not exist or is not currently active"})

  }
 
 
})

router.get("/restricted-individuals/:id/:occupant_id",async(req,res)=>{
  const restricted=await ApplicationRestrictedIndividual.find({$and:[{"application_id":req.params.id},{"occupant_id":req.params.occupant_id}]})
  if(restricted!=null){
    res.json({success:true,restricted:restricted})
  }
})

/****************************************MAINTENANCE*************************** */

router.get("/maintenance-issues/:id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");


  var app=await Application.find({$and:[{"_id":req.params.id}]})
  app=app[0]
  console.log(app)
  if(app!=null){
    console.log(await Maintenance.find({}))
    const maintenance=await Maintenance.find({$and:[{"application_id":req.params.id},{"currentlyOccupied":1}]})
    console.log(maintenance)
    if(maintenance.length>0){
      res.json({success:true,issues:maintenance,no_issues:maintenance.length})
    }else{
      res.json({success:true,issues:maintenance,no_issues:0})
    }
  }

 
})

router.post("/new-maintenance/:id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");
  var index=0
  console.log(req.params.occupant_id)
  const issue=req.body.issue
  var app=await Application.find({$and:[{"_id":req.params.id},{"currentlyOccupied":1}]})
  app=app[0]

  if(app!=null){
    const issue=new Maintenance({
      mechanism:issue.mechanism,
      message:issue.message,
      dateRecieved:issue.dateRecieved,
      status:"ISSUED",
      application_id:req.params.id
    })
    const saved=await issue.save()
   
  
  if(saved.acknowledged){
      res.json({success:true,issue:saved})
    }else{
      res.json({success:false,message:"issued not saved"})
    }

  }else{
    res.json({success:false, message:"app "+ req.params.id+" does not exist."})
  }

 
})

router.post("/checkout/:id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  const checkoutTime=req.body.checkoutTime
  console.log(new Date())

  var app=await Application.find({$and:[{"id":req.params.id},{"currentlyOccupied":1}]})
  app=app[0]
  if(app){
    const update=await Application.updateOne({"id":req.params.id},{
      $set:{
        "currentlyOccupied":0,
        "checkoutTime":checkoutTime
      }
    })
    const app=await Application.find({$and:[{"id":req.params.id}]})
    if(update.acknowledged){
      res.json({success:true,application:app})
    }
  }else{
    res.json({success:false,message:" app "+req.params.id+" does not exist."})
  }
})

router.get("/review-images/:id",async(req,res)=>{
  const images=await ApplicationReviewImage.find({$and:[{"application_id":req.params.id}]})
  const app=await Application.find({$and:[{"_id":req.params.id}]})
  if(app[0]!=null){
    res.json({success:true,images:images,no_img:images.length})

  }else{
    res.json({success:false,messsage:"app "+req.params.id+" does not exist"})
  }
})



router.post("/review/:id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  console.log(req.body)

  var app=await Application.find({
    $or:[
      {$and:[{"_id":req.params.id},{"currentlyOccupied":1}]},
      {$and:[{"_id":req.params.id},{"checkoutTime":{$ne:""}}]}
  ]})
  app=app[0]
  const review=req.body.review
  const images=req.body.images
  if(app!=null){
    images.map(async(r)=>{
      console.log(r)
      const review=new ApplicationReviewImage({
        application_id:req.params.id,
        img_url:r.img_url
      })

      const saveImg=await review.save()
      const updated=await Application.find({$and:[{"_id":req.params.id}]})
      const update=await Application.updateOne({"_id":req.params.id},
      {$set:{"review":req.body.review}})
      if(update.acknowledged && review !=null){
        res.json({success:true,application:updated,changed:1})
      }
    })
  }else{
    res.json({success:false,message:"no active applications for application "+req.params.id})
  }
  


})

module.exports=router