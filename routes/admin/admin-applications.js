const express = require("express");
const router = express.Router();
const cookie = require("universal-cookie");
const bcrypt = require("bcryptjs");
//const db_config = require("../../config/db");
const mysql = require("mysql");
const cors = require("cors");
const  axios= require("axios");
const {db_config}=require("../../config/db")
//var {db}=require("../../config/newdb")
const bodyParser = require("body-parser");
const mongoose=require("mongoose")
const uniqueValidator = require('mongoose-unique-validator')
const {Application} =require("../../models/Application");
const { ApplicationOccupant } = require("../../models/ApplicationOccupant");
const {BookedDate}=require('../../models/BookedDates')
const{BlockedDate}=require("../../models/BlockedDates")

router.use(bodyParser.json());
router.use(express.json())

var corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};
console.log(db_config)
router.use(cors(corsOptions));

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


router.get("/body",(req,res)=>{
  console.log(req.body)
})


router.get("/", async(req, res) => {
  try{
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.json("Welcome to home stay ghana server : ADMIN APPLICATIONS");
  }catch(err){
    console.log(err)
  }
});

router.get("/application/:id",async(req,res)=>{  
  res.setHeader("Access-Control-Allow-Origin", "*");
  console.log(req.params.id)
  const application=await Application.find({$and:[{"_id":req.params.id}]})
  console.log(application)
  if(application.length>0){
    res.json({success:true,application:application[0]})
  }else{
    res.json({success:false,message:"application does not exist"})
  }
})


//get all client applications for client
router.get("/get-all-applications/:firstname/:lastname/:email",async(req,res)=>{  res.setHeader("Access-Control-Allow-Origin","*")
  res.setHeader("Access-Control-Allow-Origin", "*");
  const start=new Date()

  console.log("get all apps")
  console.log(req.params)
   const applications=[]

  const prom=new Promise(async(resolve,reject)=>{
    var apps=await Application.find({$and:[{"firstname":req.params.firstname},{"lastname":req.params.lastname},{"email":req.params.email}]})
    if(apps.length>0){
      apps.map(async(a)=>{
        const occupants=await ApplicationOccupant.find({$and:[{"application_id":a.id}]})
        applications.push({application:a,occupants:occupants})
      })

      setTimeout(()=>{
        resolve(applications)
      },1000)

    }else{
      reject()
    }
   
  })

  prom.then(()=>{
    console.log(applications)
    console.log("here")
    const end=new Date()
    res.json({success:true,no_applications:applications.length,applications:applications,time:end-start})

  }).catch(()=>{

  })

})
//retreieve all applications
router.get("/applications",async(req,res)=>{
  const start=new Date()
  res.setHeader("Access-Control-Allow-Origin", "*");
  const apps=[]
  const applications=await Application.find({})
  var i=0
  const confirmed=await Application.find({$and:[{"application_status":"CONFIRMED"}]})
  const denied=await Application.find({$and:[{"application_status":"DENIED"}]})
  const applied=await Application.find({$and:[{"application_status":"APPLIED"}]})


  applications.map(async(a)=>{
    const occupants=await ApplicationOccupant.find({
      $and:[
       { "application_id":a._id}
      ]
    })
    apps.push({application:a,occupants:occupants})
    i++
    if(i==applications.length-1){
      const end=new Date()
      res.json({success:true,no_applications:applications.length,time:end-start,confirmed:confirmed.length,denied:denied.length,applied:applied.length,applications:apps})
    }
  })

  /*db.query("select count(*) as appCount from ghanahomestay.applications ",(errCount,resultsCount)=>{
      if(errCount){
      
        console.log(errCount)
      }else{
        const appCount=Object.values(JSON.parse(JSON.stringify(resultsCount)))
       const count=appCount[0].appCount
      console.log(count)
      if(count>0){
        db.query("select * from ghanahomestay.applications ",(err,results)=>{
          if(err){
            console.log(err)
          }

          const applications=[]
          const prom=new Promise((resolve,reject)=>{

            results.map((r)=>{
              console.log(r)
              
              db.query("select * from ghanahomestay.application_occupants where application_id=?",r.id,(err1,results1)=>{
                if(err1){
                  console.log(err1)
                }
                console.log(results1)
                  applications.push({application:r,occupants:results1})
              })
            })

            setTimeout(()=>{
            resolve()
            },500)
          })
        

          prom.then(()=>{
              res.json({success:true,applications:applications})
          })
      })

      }

      }
  })
  */

})

//args:none
//returns all newly submitted applications
router.get("/new-applications",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");
  const apps=[]
  const applications=await Application.find({
    $and:[
      {"application_status":"APPLIED"},
      {"notify-admin":1}
    ]
  })

  console.log(applications)
  var i=0
  
  if(applications!=null){
  applications.map(async(r)=>{
    const occupants=await ApplicationOccupant.find({
      $and:[
        {"application_id":r._id}
      ]
    })
    apps.push({application:r,occupants:occupants})
    i++
    if(i==applications.length-1){
      res.json({success:true,applications:applications})
    }
  })
}else{
  res.json({success:true,applications:[],no_applications:0})

}

  /*db.query("select count(*) as appCount from ghanahomestay.applications where application_status='APPLIED' && notify_admin=1",(errCount,resultsCount)=>{
      if(errCount){
        console.log(errCount)
      }else{
        const appCount=Object.values(JSON.parse(JSON.stringify(resultsCount)))
       const count=appCount[0].appCount
      console.log(count)
      if(count>0){
        db.query("select * from ghanahomestay.applications where application_status='APPLIED' && notify_admin=1",(err,results)=>{
          if(err){
            console.log(err)
          }

          const applications=[]
          const prom=new Promise((resolve,reject)=>{

            results.map((r)=>{
              console.log(r)
              
              db.query("select * from ghanahomestay.application_occupants where application_id=?",r.id,(err1,results1)=>{
                if(err1){
                  console.log(err1)
                }
                console.log(results1)
                  applications.push({application:r,occupants:results1,no_applications:count})
              })
            })

            setTimeout(()=>{
            resolve()
            },500)
          })
        

          prom.then(()=>{
              res.json({success:true,applications:applications})
          })
      })

      }else{
        res.json({success:true,applications:[],no_applications:0})
      }

      }

  })
  */

})

/**************************************NOTIFICATION ENDPOINTS**************************************** */
//turn off notification update once admin has seen it
router.post("/turnOffAdminNotify/:id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");
  const id=req.params.id
  const app=await Application.find({$and:[{"id":id}]})
 // console.log(app)
  const application=await Application.updateOne(
    {"id":id},
    {
      $set:
        {"notify_admin":0,"notify_admin_message":""},
      
      
      }
    )
    console.log(application)
      if(application.acknowledged==true){
        res.json({success:true,changed:1,application:application})
      }else{
        res.json({success:false,changed:0})
      }

  /*db.query("select count(*) as appCount from ghanahomestay.applications where id=?",req.params.id,(err,results)=>{
    if(err){
      console.lof(err)
    }
    const appCount=Object.values(JSON.parse(JSON.stringify(results)))
    const count=appCount[0].appCount
    console.log(count)

    if(count==1){
      db.query("update ghanahomestay.applications set notify_admin=0,notify_admin_message=' ' where id=?",req.params.id,(err1,results1)=>{
        if(err1){
          console.log(err1)
        }
       
          res.json({success:true,changed:count})
        
      })
    }
  })
  */

})

router.get("/active",async(req,res)=>{
  const apps=await Application.find({})

  apps.map((a)=>{
    
    axios.get("http://localhost:3012/admin-applications/ActiveStatus/"+a._id).then((response)=>{
      console.log(response.data)
      
      console.log("\n\n")
    })
  })
})

router.post("/setStatus/:id/:status",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  if(req.params.status!="APPLIED"&& req.body.message==null){
    res.json({success:false,message:"setting status for statuses other than 'APPLIED' must include a notification message "})
}else{
    if(req.params.status=="RESERVED"){
      var currDate=new Date()
      currDate=currDate.toString().substring(0,15)
      axios.get("http://localhost:3012/admin-applications/newGetPaymentDueDate").then(async(response)=>{
        const application=await Application.updateOne(
          {"_id":req.params.id},
          {$set:{
            "application_status":req.params.status,
            "notify_applicant":1,
            "notify_applicant_message":req.body.message,
            "dateReserved":currDate,
            "datePaymentDue":response.data
          }}
        )
      })
      if(application.acknowledged==true){
        res.json({success:true,no_applications:application.matchedCount})
      }else{
        res.json({success:false,no_applications:0})
      }
    }else  if(req.params.status=="CONFIRMED"){
      var currDate=new Date()
      currDate=currDate.toString().substring(0,15)
      
        const application=await Application.updateOne(
          {"_id":req.params.id},
          {$set:{
            "application_status":req.params.status,
            "notify_applicant":1,
            "notify_applicant_message":req.body.message,
            "dateApproved":currDate,
            "approved":1
          }}
        )
        const updatedApp=await Application.find({$and:[{"_id":req.params.id}]})
        console.log(application)
        if(application.acknowledged==true){
          res.json({success:true,no_applications:application.matchedCount,application:updatedApp})
        }else{
          res.json({success:false,no_applications:0})
        }
      
    }
    else if(req.params.status=="DENIED"){
      var currDate=new Date()
      currDate=currDate.toString().substring(0,15)
      const application=await Application.updateOne({"_id":req.params.id},{
        $set:{
          "application_status":"DENIED",
          "notify_applicant":1,
          "notify_applicant_message":req.body.message,
          "dateDenied":currDate,
          "approved":-1
        }
      })
     
      const updatedApp=await Application.find({$and:[{"_id":req.params.id}]})
      console.log(application)
      if(application.acknowledged==true){
        res.json({success:true,no_applications:application.matchedCount,application:updatedApp})
      }else{
        res.json({success:false,no_applications:0})
      }
    

    }else if(req.params.status=="CHECKEDOUT"){
      try{
      var currDate=new Date()
      currDate=currDate.toString().substring(0,15)
      const application=await Application.updateOne({"_id":req.params.id},{
        $set:{
          "application_status":req.params.status,
          "notify_applicant":1,
          "notify_applicant_message":req.body.message,
          "checkoutTime":new Date(),
          "currentlyOccupied":0
        }
      })
     
      const updatedApp=await Application.find({$and:[{"_id":req.params.id}]})
      console.log(application)
      console.log(application)
      console.log("\n\n\n")
      try{
      if(application.acknowledged==true){
        res.json({success:true,no_applications:application.matchedCount,application:updatedApp})
      }else{
        res.json({success:false,no_applications:0})
      }
    }catch(err){
      console.log(err)
    }
    }catch(err){
      res.json({success:false,message:error})
    }
    

    } else  if(req.params.status=="PAYEDANDAPPROVED"){
      var currDate=new Date()
      currDate=currDate.toString().substring(0,15)
      
        const application=await Application.updateOne(
          {"_id":req.params.id},
          {$set:{
            "application_status":"CONFIRMED",
            "approved":1,
            "notify_admin":1,
            "notify_applicant":1,
            "notify_applicant_message":req.body.message,
            "datePaid":currDate,
            "notify_admin_message":req.body.message,
            "datePaid":currDate,
            "dateApproved":currDate
          }}
        )
        const updatedApp=await Application.find({$and:[{"_id":req.params.id}]})
        console.log(application)
       // res.json({success:true,no_applications:application.matchedCount,application:updatedApp})

        if(application.acknowledged==true){
          try{
          res.json({success:true,no_applications:application.matchedCount,application:updatedApp})
          }catch(err){
            console.log(err)
          }
        }else{
          res.json({success:false,no_applications:0})
        }
      
    }
    
    else{ 
    
    const application=await Application.updateOne(
      {"id":req.params.id},
      {$set:{
        "application_status":req.params.status,
        "notify_applicant":1,
        "notify_applicant_message":req.body.message
      }}
    )
    try{
    if(application.acknowledged==true){
      res.json({success:true,no_applications:application.matchedCount})
    }else{
      res.json({success:false,no_applications:0})
    }
  }catch(err){
    console.log(err)
  }
  }
  }

})


router.get("/setRooms",async(req,res)=>{

  const booked=await BookedDate.find({})
  booked.map((b)=>{
    console.log(b)
    if(b.roomOne==null){
      console.log("null")
    }
  })

})
/********************************************************************************************************************** */
router.get("/confirmed-applications",async(req,res)=>{
  const app=await Application.find({$and:[{"application_status":"CONFIRMED"}]})
  res.json({success:true,no_applications:app.length,applications:app})
})
router.post("/update-application/:id/:variable/",async(req,res)=>{
  const variable=req.params.variable
  const value=req.body.value

  const id=req.params.id

  var app=await Application.find({$and:[{"id":id}]})
  app=app[0]
  console.log(app)
  console.log("\n"+value)
  if(app!=null){
    
    var name=Object.keys({variable})[0]
    if(variable=="roomOne"){
      if(value==true){
      const update=await Application.updateOne({"_id":id},{
        $set:[{"roomOne":value},{"fullSuite":false}]
      },
      {
        $set:{"fullSuite":false}
      })
      res.json({success:true,updated:update})

    }else{
      console.log("ROOMONE")
      const update=await Application.updateOne({"_id":id},{
        $set:{"roomOne":false}
      })
      const app=await Application.find({$and:[{"_id":id}]})
      res.json({success:true,updated:update,app:app})


    }

    }
    if(variable=="roomTwo"){
      if(value==true){
    const update=await Application.updateOne({"_id":id},{
      $set:{"roomTwo":value}
    },{
      $set:{"fullSuite":false}
    })
    const app=await Application.find({$and:[{"_id":id}]})
    res.json({success:true,updated:update,app:app})

  }else{
    const update=await Application.updateOne({"_id":id},{
      $set:{"roomTwo":value}
    })
    const app=await Application.find({$and:[{"_id":id}]})
    res.json({success:true,updated:update,app:app})
  }
  }
    if(variable=="roomThree"){
      if(value==true){
      const update=await Application.updateOne({"_id":id},{
        $set:[{"roomThree":value},{"fullSuite":false}]
      },
      {
        $set:{"fullSuite":false}
      })
      const app=await Application.find({$and:[{"_id":id}]})
      res.json({success:true,updated:update,app:app})
      }else{
        const update=await Application.updateOne({"_id":id},{
          $set:{"roomThree":value}
        })
        const app=await Application.find({$and:[{"_id":id}]})
        res.json({success:true,updated:update,app:app})

      }
  }
  if(variable=="fullSuite"){
    if(value==true){
    const update=await Application.updateOne({"_id":id},{
      $set:[{"fullSuite":value},{"roomOne":false},{"roomTwo":false},{"roomThree":false}]
    })
    const app=await Application.find({$and:[{"_id":id}]})
        res.json({success:true,updated:update,app:app})
    }else{
      const roomOne=req.body.roomOne
      const roomTwo=req.body.roomTwo
      const roomThree=req.body.roomThree
      const update=await Application.updateOne({"_id":id},{
        $set:{"fullSuite":value,"roomOne":roomOne,"roomTwo":roomTwo,"roomThree":roomThree}
  
    })
    const app=await Application.find({$and:[{"_id":id}]})
    res.json({success:true,updated:update,app:app})

    }
  }
  if(variable=="email"){
    const update=await Application.updateOne({"_id":id},{
      $set:{"email":value}
    })
  res.json({success:true,updated:update})
}
if(variable=="stay_start_date"){
  const update=await Application.updateOne({"_id":id},{
    $set:{"stay_start_date":value}
  })
res.json({success:true,updated:update})
}
if(variable=="stay_end_date"){
  const update=await Application.updateOne({"_id":id},{
    $set:{"stay_end_date":value}
  })
res.json({success:true,updated:update})
}

  }else{
    res.json({success:false,message:" app "+ id+ "does not exist"})
  }

})

router.get("/application-booked-dates/:id",async(req,res)=>{
  const booked=await BookedDate.find({$and:[{"application_id":req.params.id}]})
  res.json({success:true,booked_dates:booked})
})
router.get("/checkAvailability/:id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  try{
  const applicationBooked=await BookedDate.find({$and:[{"application_id":req.params.id}]})
  var  application=await Application.find({$and:[{"_id":req.params.id}]})
  var app=application
  
   var conflict_id
    var available=true
    const conflicting_dates=[]
    var all
    const conflicts=[]
    var dates
    const prom= new Promise((resolve,reject)=>{
      axios.get("http://localhost:3012/admin-applications/allBookingDatesForApplication/"+req.params.id).then(async(response)=>{
        try{
           console.log(response.data)
            const booked_dates=response.data.booked_dates
            const alldates=await BookedDate.find({})
           // console.log(booked_dates)
            all=alldates
            dates=response.data.booked_dates
            const start=response.data.startBuffer.toString().substring(0,15)
            const end=response.data.endBuffer.toString().substring(0,15)
            var startConflict=false
            var endConflict=false
            if(alldates.length>0 && booked_dates.length>0){
              //console.log(app)
              booked_dates.map((bdate)=>{
              
                alldates.map((date)=>{
                  
               
                  
                  
                  const bd=bdate.date.split(" ")
                  const d=date.date.split(" ")
                 // console.log("-----------"+date.application_id+" "+req.params.id)
                 //console.log(date)
              
                  if(date.date==start && date.application_id!=req.params.id){
               
                  
                    if(date.fullSuite==true){
                      //console.log("WHOLESUITE BOOKED FOR START: "+date.date + bdate.date)
                      startConflict=true
                      if(!conflicting_dates.includes(start)){
                         conflicting_dates.push(start)
                      }

                    }else{
                      console.log("\nCHECK ROOMS:"+date.date+"\n")
                      if((date.roomOne && app.roomOne) || (date.roomTwo && app.roomTwo) || (app.roomThree && date.roomThree)){
                        startConflict=true
                        if(!conflicting_dates.includes(start)){
                           conflicting_dates.push(start)
                        }
                      }else  if(!(app.roomOne && date.roomOne) && !(app.roomTwo && date.roomTwo )&& !(app.roomThree && date.roomThree) && app._id!=date.application_id){
                        console.log("EXCEPTION START")
                        console.log("date")
                        console.log(date)
                        console.log("bdate")
                        console.log(bdate)
                        console.log("\n\n")

                        //console.log(bdate)
                        //console.log(date)

                      }
                    }
                  }
                  if(date.date==end && date.application_id!=req.params.id){
                    if(date.fullSuite==true){
                     // console.log("WHOLESUITE BOOKED FOR END:"+date.date +" "+end)
                     // console.log(app._id)
                     // console.log(date.application_id)

                      endConflict=true
                      if(!conflicting_dates.includes(end)){
                         conflicting_dates.push(end)
                      }

                    }else{
                      console.log("\nCHECK ROOMS:"+date.date+"\n")

                      if((date.roomOne && app.roomOne) || (date.roomTwo && app.roomTwo) || (app.roomThree && date.roomThree)){
                        console.log("NOT AVAILABLE")
                        startConflict=true
                        if(!conflicting_dates.includes(end)){
                          conflicting_dates.push(end)
                       }
                      }else if(!(app.roomOne && date.roomOne) && !(app.roomTwo && date.roomTwo )&& !(app.roomThree && date.roomThree)){
                        console.log("EXCEPTION END")
                        console.log("date")
                        console.log(date)
                        console.log("bdate")
                        console.log(bdate)
                        console.log("\n\n")
                       // console.log(date)
                        //console.log(bdate)
                        //console.log("\n\n")
                      }
                    }
                  
                  }
               
                  if(bdate.date==date.date && date.date!=end && date.date!=start && date.application_id!=req.params.id){
                    if(date.fullSuite==true){
                      console.log("WHOLESUITE BOOKED FOR DAY CuRR:"+date.date +" "+ bdate.date)
                      console.log("date")
                      console.log(date)
                      console.log("bdate")
                      console.log(bdate)
                      console.log("\n\n")

                      available=false
                      if(!conflicting_dates.includes(date.date)){
                        conflicting_dates.push(date.date)
                     }

                    }else{
                      console.log("\nCHECK ROOMS:"+date.date+"\n")

                      if((date.roomOne && app.roomOne) || (date.roomTwo && app.roomTwo) || (app.roomThree && date.roomThree)){
                        available=false
                        if(!conflicting_dates.includes(date.date)){
                          conflicting_dates.push(date.date)
                       }
                      }else  if(!(app.roomOne && date.roomOne) && !(app.roomTwo && date.roomTwo )&& !(app.roomThree && date.roomThree))
                      {
                        console.log("EXCEPTION")
                        console.log("date")
                        console.log(date)
                        console.log("bdate")
                        console.log(bdate)
                        console.log("\n\n")
                       
                      }
                    }
                    
                }else {
                 
                }
                })
               
              })
              if(startConflict==true){
                conflicting_dates.push(start)
               
              }
              if(endConflict==true){
                conflicting_dates.push(end)
              }
              setTimeout(()=>{
                resolve()
              },600)
            }
          }catch(err){
            console.log(err)
          }
       })

    })

    prom.then(async()=>{
      
         
      //TODO:NOW CHECK TO SE IF PAYED
        const payedApp=await Application.find({$or:[
          {$and:[{"application_status":"PAYED"},{"_id":req.params.id}]},
          {$and:[{"datePaid":!null},{"_id":req.params.id}]}
        ]})
        console.log(payedApp)
        if(payedApp!=null && conflicting_dates.length==0){
            res.json({success:true,paid:true,conflicting_dates:conflicts,no_days:conflicting_dates.length,application:application})   
        }else{
           res.json({success:true,paid:false,conflicting_dates:conflicting_dates,no_days:conflicting_dates.length-2})
        }
      }).catch((err)=>{
        console.log(err)
      })
    }catch(err){
        console.log(err)
    }
    
    })
  
   /*   db.query("select count(*) as appCount1 from ghanahomestay.applications where id=? && (application_status='PAYED' || (datePaid IS NOT NULL))",req.params.id,(err2,results2)=>{
       if(err2){
         console.log(err2)
       }
      
       const appCount2=Object.values(JSON.parse(JSON.stringify(results2)))

       const count2=appCount2[0].appCount1
       console.log("\n\ncount:"+count2)

       db.query("select * from ghanahomestay.applications where id=?",req.params.id,(err3,results3)=>{
         if(err3){
           console.log(err3)
         }else{
           if(results3[0]==null){
             res.json({success:false,message: "application "+ req.params.id+" does not exist"})
           }else{

             if(count2>0){
               res.json({success:true,paid:true,conflicting_dates:conflicting_dates})
            }else{
             //ALL good
             res.json({success:true,paid:false,conflicting_dates:conflicting_dates})
            }
           }
         }
       })
      })
 }).catch(()=>{
   console.log("here 3")
 })
  }else{
    res.json({success:true,message:"no booked date"})
  }

  /*var arrLength=0
  const conflicting_dates=[]
  db.query("select count(*) as appCount from ghanahomestay.booked_dates where id=?",req.params.id,(err,results)=>{
    const appCount=Object.values(JSON.parse(JSON.stringify(results)))
    const count=appCount[0].appCount
   console.log("aarrLength :"+count)
   arrLength=count
   db.query("select count(*) as appCount from ghanahomestay.applications where id=?",req.params.id,(err1,results1)=>{
    const appCount1=Object.values(JSON.parse(JSON.stringify(results1)))
    const count1=appCount1[0].appCount
    if(count1<1){
      res.json({success:false,message:"application "+req.params.id+" does not exist"})

    }else{
        
  var available=true
  db.query("select * from ghanahomestay.booked_dates",(err,results)=>{
    if(err){
      console.log("\n\n")
      console.log(err)
    }else{
      
     
      if(arrLength>0){
      

        const prom=new Promise((resolve,reject)=>{

          axios.get("http://localhost:3012/admin-applications/allBookingDatesForApplication/"+req.params.id).then((response)=>{
            console.log(response.data)
            console.log("gere")
            const booked_dates=response.data.booked_dates
            db.query("select * from ghanahomestay.booked_dates",(errDates,resultsDates)=>{
              if(errDates){
                console.log(errDates)
              }
             
                else if(resultsDates!=null){
           
                resultsDates.map((date)=>{
                  
                  booked_dates.map((bdate)=>{
                    
                    
                    const bd=bdate.date.split(" ")
                    const d=date.date.split(" ")
                    if(bd[0]==d[0] && bd[1]==d[1] && bd[2]==d[2]&& bd[3]==d[3]){
                     
                      available=false
                      conflicting_dates.push(date)
                  }
                  })
                 
                })
                setTimeout(()=>{
                  resolve()

                },500)
              }

              
            })  
          })
          

        })

        prom.then(()=>{
         
             //TODO:NOW CHECK TO SE IF PAYED

             db.query("select count(*) as appCount1 from ghanahomestay.applications where id=? && (application_status='PAYED' || (datePaid IS NOT NULL))",req.params.id,(err2,results2)=>{
              if(err2){
                console.log(err2)
              }
             
              const appCount2=Object.values(JSON.parse(JSON.stringify(results2)))

              const count2=appCount2[0].appCount1
              console.log("\n\ncount:"+count2)

              db.query("select * from ghanahomestay.applications where id=?",req.params.id,(err3,results3)=>{
                if(err3){
                  console.log(err3)
                }else{
                  if(results3[0]==null){
                    res.json({success:false,message: "application "+ req.params.id+" does not exist"})
                  }else{

                    if(count2>0){
                      res.json({success:true,paid:true,conflicting_dates:conflicting_dates})
                   }else{
                    //ALL good
                    res.json({success:true,paid:false,conflicting_dates:conflicting_dates})
                   }
                  }

                }

              })
            
           

             })


           
        }).catch(()=>{
          console.log("here 3")
        })
      }else{
        //TODO:NOW CHECK TO SE IF PAYED
        db.query("select count(*) as appCount1 from ghanahomestay.applications where id=? && (application_status='PAYED' || datePaid is not null)",req.params.id,(err2,results2)=>{
          if(err2){
            console.log(err2)
          }
          console.log("HERE")
          const appCount2=Object.values(JSON.parse(JSON.stringify(results2)))
          const count2=appCount2[0].appCount1
          console.log(count2)

          db.query("select * from ghanahomestay.applications where id=?",req.params.id,(err3,results3)=>{
            if(err3){
              console.log(err3)
            }else{
              console.log(results3)
              if(results3.length==0){
                res.json({success:false,message: "application "+ req.params.id+" does not exist"})
              }else{

                if(count2>0){
                  console.log("downhere")
                  res.json({success:true,paid:true,conflicting_dates:conflicting_dates})
               }else{
                //ALL good
                res.json({success:true,paid:false,conflicting_dates:conflicting_dates})
               }
              }

            }

          })
         

         })
      }
    }
  })


    }
   })
  })

*/

router.get("/fillRooms",async(req,res)=>{
  const empty=await BookedDate.find({$and:[{"roomThree":null}]})
  console.log(empty.length)
  var count=1
  empty.map(async(b)=>{
    console.log(b.id)
    const update=await BookedDate.updateOne({"_id":b.id},{
      $set:{"roomThree":false}/*,{"roomOne":false},{"roomTwo":false},{"roomThree":false}*/
    })
    console.log(update)
    count++
  })
setTimeout(()=>{
  res.json({success:true,update:count})

},600)
})

router.post("/checkBlockedDates",async(req,res)=>{
  console.log("here checkBlock")
  console.log(req.body)
  const conflict=[]
  var conflicted=false
  console.log("CHECK")
 
  const blocked_dates=[]
  const start=await BlockedDate.find({$and:[{"day":req.body.startBuffer}]})
  const end=await BlockedDate.find({$and:[{"day":req.body.endBuffer}]})
  const booked=req.body.dates

  booked.map(async(b)=>{
    var block=await BlockedDate.find({$and:[{"day":b.day}]})
    console.log(block)
    if(block[0]!=null){
      conflicted=true;
      conflict.push(block[0])
    }
  })
  
  


  setTimeout(()=>{
    res.json({success:true,blocked_dates:conflict,blocked:conflicted})
  },200)
})

router.get("/check",async(req,res)=>{
  const apps=await Application.find({})
  var i=0;
  console.log("here")
  const arr=[]

    apps.map((a)=>{
      console.log(apps[i].id)
      axios.get("http://localhost:3012/admin-applications/checkAvailability/"+a._id.toString()).then(async(response)=>{
        var data=await response.data
         console.log(response.data)
         console.log(apps[i])
  
        arr.push({day:a.stay_start_date,data:data})
       i++
        console.log(arr)
        console.log(i)
        if(i==apps.length-1){
          res.json(arr)
        }
      })

    })
  
 
})

router.get("/blocked-dates",async(req,res)=>{
  const blockedDates=await BlockedDate.find({})
  const blocked=[]
  var months= ["Jan","Feb","Mar","Apr","May","Jun","Jul",
  "Aug","Sep","Oct","Nov","Dec"];
  var monthnum=["01","02","03","04","05","06","07","08","09","10","11","12"]
  var cDate=new Date()
  console.log(blockedDates)

  if(blockedDates.length>0){
    blockedDates.map((b)=>{
      var date=b.day.split(" ")
      console.log(date)
      
      date=new Date(date[3],monthnum[months.indexOf(date[1])-1],date[2])
      console.log(date)
      blocked.push(date)
    })
    setTimeout(()=>{
      res.json({success:true,blocked_dates:blocked,length:blocked.length})
    },500)
  }else{
    res.json({success:true,blocked_dates:blocked, length:blocked.length})
  }

})

router.post("/blocked-dates",async(req,res)=>{
 const blocked=[]
 const blocked_dates=[]
 var months= ["Jan","Feb","Mar","Apr","May","Jun","Jul",
 "Aug","Sep","Oct","Nov","Dec"];
 var monthnum=["01","02","03","04","05","06","07","08","09","10","11","12"]

 var end=req.body.end
 var start=req.body.start
var startDate=start.substring(0,15)
var endDate=end.substring(0,15)
console.log(startDate)

startDate=startDate.split(" ") 
endDate=endDate.split(" ")
startDate=new Date(startDate[3],monthnum[months.indexOf(startDate[1])-1],startDate[2])
endDate=new Date(endDate[3],monthnum[months.indexOf(endDate[1])-1],endDate[2])
console.log("start:"+startDate)

 var nextDate=new Date(startDate);
 var start=new Date();
 var startBuffer=start.setDate(startDate.getDate()-1)
 var starterBuffer=new Date(startBuffer)

 blocked.push(startDate.toString().substring(0,15))
  console.log(nextDate.toString().substring())
 while(nextDate.toString().substring(0,15)!=endDate.toString().substring(0,15)){
   var nextnext=nextDate.setDate(nextDate.getDate()+1)
   nextDate=new Date(nextnext)
   console.log(nextDate.toString().substring(0,15))
   blocked.push(nextDate.toString().substring(0,15))  
  
 }
 var nextnext=nextDate.setDate(nextDate.getDate()+1)
 nextDate=new Date(nextnext)

 blocked.map(async(b)=>{
  var bdate=b.toString().substring(0,15)
  const date=new BlockedDate({
    day:bdate
  })

  try{
    const saved=await date.save()
    console.log(saved)
    var added=saved.day.split(" ")
    added=new Date(added[3],monthnum[months.indexOf(added[1])-1],added[2])
    blocked_dates.push(added)
  }catch(err){
    console.log("Already Blocked Off")
  }
 })
 
 setTimeout(()=>{
  res.json({success:true,blocked_dates:blocked_dates,length:blocked_dates.length})
 },500)
 

})

router.get("/removed_booked",async(req,res)=>{
  const deleted=await BlockedDate.deleteMany({})
})


router.post("/deny-booking/:id",async(req,res)=>{ 
   res.setHeader("Access-Control-Allow-Origin","*")
  /**Unsets confirmedApprove and approve to -1 */
 

  var app=await Application.find({$and:[{"_id":req.params.id}]})
  app=app[0]
  if(app!=null){
    console.log(app)
    if(app.approved!=-1 || app.confirmedApproved!=-1){
      const curr=new Date()
          const currDate=curr.toString().substring(0,15)
          const updateApp=await Application.updateOne({"_id":req.params.id},{
            $set:{"approved":-1,"approved":-1,"currentlyOccupied":-1}
          })
    
      
      var updated=await Application.find({$and:[{"_id":req.params.id}]})
      updated=updated[0]
      console.log("\n\n\nupdate approved")
      console.log(updateApp)
      console.log(updated)
      if(updateApp.acknowledged){
        const dates=await BookedDate.find({$and:[{"application_id":req.params.id}]})
        const remove=await BookedDate.remove({"application_id":req.params.id})
        console.log(remove)
        var removed=await BookedDate.find({"application_id":req.params.id})
        removed=removed[0]
        console.log("\n\n\nremove")
        console.log(remove)
        if(removed==null){
          axios.post("http://localhost:3012/admin-applications/setStatus/"+req.params.id+"/DENIED",{message:"Your reservation for stay ["+app.stay_start_date+" through "+app.stay_end_date+"] is denied."}).then((response)=>{
            console.log(response.data)
            if(response.data.success){
              res.json({success:true,changed:remove.deleteCount,canceled_dates:dates})
            }else{
              res.json({success:false,message:"application_status not set"})
            }
          })

        }

      }
    }
  }else{
    res.json({success:false,message:"app "+req.params.id +" does not exist."})
  }
  /*db.query("select count(*) as appCount from ghanahomestay.applications where id=? ",req.params.id,(err,results)=>{
    const appCount=Object.values(JSON.parse(JSON.stringify(results)))
    const count=appCount[0].appCount
    console.log()
   console.log(count)
   if(count>0){

    db.query("select * from ghanahomestay.applications where id=?",req.params.id,(err2,results2)=>{
      if(err2){
        console.log(err2)
      }else{
        const app=results[0]

        if(app.approved!=-1 || app.confirmedApproved!=-1){
          const curr=new Date()
          const currDate=curr.toString().substring(0,15)
          db.query("update ghanahomestay.applications set application_status='DENIED' , approved=-1, confirmedApproved=-1,dateDenied=?  where id=?",[currDate,req.params.id],(err1,results1)=>{
             if(err1){
               console.log(err1)
             }else{
                 console.log(results1)
                 const changed=results1.changedRows
                 if(changed>0){
                  //change in  approve and confirmedApproved is true
                  axios.post("http://localhost:3012/admin-applications/remove-booked-dates/"+req.params.id).then((response)=>{
                    console.log("changed:"+changed)
                    console.log(response.data)
                    res.json({success:true,changed:changed,canceled_dates:response.data.canceled_dates})

                })

                 }else{
                  //already denied, remove booking jic
                  axios.post("http://localhost:3012/admin-applications/remove-booked-dates/"+req.params.id).then((response)=>{
                    console.log("changed:"+changed)
                    console.log(response.data)
                    res.json({success:true,changed:changed,canceled_dates:response.data.canceled_dates})

                })
                 
                }
             }
            })
   /* axios.post("http://localhost:3012/admin-applications/remove-booked-dates/"+req.params.id).then(response)=>{

    }
    */
/*
        }else{
          //already-canceld
          console.log("already Canceld\n\n")
          axios.post("http://localhost:3012/admin-applications/remove-booked-dates/"+req.params.id).then((response)=>{
            console.log(response)
            db.query("update ghanahomestay.applications set application_status='DENIED' where id=?",req.params.id,(errNoChanged,resultsNoChanged)=>{
              if(errNoChanged){
                console.log(errNoChanged)
              }else{
                res.json({success:true,changed:0,canceled_dates:response.data.canceled_dates})

              }
            })
        })
        }
      }
    })

  

   }else{
    res.json({success:false,message:"application "+req.params.id +" does not exist"})
   }

  })
  */
})
//helper to cancel bookings
router.post("/remove-booked-dates/:id",async(req,res)=>{  res.setHeader("Access-Control-Allow-Origin","*")
  res.setHeader("Access-Control-Allow-Origin", "*");

  var  app=await Application.find({$and:[{"_id":req.params.id}]})
  app=app[0]
  if(app!=null){
    const booked_dates=await BookedDate.find({$and:[{_application_id:req.params.id}]})
    const remove=await BookedDate.remove({"application_id":req.params.id})
    if(booked_dates.length==remove.deleteCount){
      res.json({success:true,canceled_dates:booked_dates})
    }else{
      res.json({success:false})
    }


  }else{
    res.json({success:false,message:"App "+req.params.id+" does not exist."})
  }


 
})
/*
router.get("/getActiveStatus/:id",async(req,res)=>{
  var app= await Application.find({
    $and:[
      {"_id":req.params.id}
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
            
            var currentlyWrong=false
            const prom=new Promise(async(resolve,reject)=>{
              if(app.application_status=='CONFIRMED' && app.approved==1){

                console.log("check if date is valie")
                if((cDate>=startDate && cDate<=endDate) && (activeDate>=startDate && activeDate<=endDate) &&app.currentlyOccupied!=1){
                  console.log("confirmed and in range:CHANGE TO ACTUVE")
                   const update=await Applicant.updateOne({"_id":req.params.id},{
                    $set:[{"currentlyOccupied":1}]
                   })
                   console.log(update)
                   res.json({success:true,currentlyOccupied:true})
                }else if((cDate>=startDate && cDate<=endDate) && (activeDate>=startDate && activeDate<=endDate) &&app.currentlyOccupied==1){
                  res.json({success:true,currentlyOccupied:true})

                }
                else{
                  //TODO:EITHER CHANGED TO CHECKEDOUT OUT IF PERSON FORGOT TO CHECKOUT OR DONT
                   if(cDate>endDate &&  (activeDate>=start && activeDate<=endDate)  ){
                  console.log("confirmed but but person forgot to checkout")
                 axios.post("http://localhost:3012/admin-applications/setStatus/"+app._id+"/CHECKEDOUT/",{message:"Occupants might have forgotten to checkout. Updated application status to checkedout on "+currDate}).then((response)=>{
                    if(response.data.success){
                      console.log(app.stay_start_date+" changed to checkout by force")
                      res.json({success,currentlyOccupied:false})
                    }else{
                     res.json({success:false,message:"could not change status"})
                    }
                  })
                  
                }else  if(cDate>endDate &&  (activeDate>=startDate && activeDate<=endDate)  ){
                  console.log("confirmed but but person forgot to checkout")
                 axios.post("http://localhost:3012/admin-applications/setStatus/"+app._id+"/CHECKEDOUT/",{message:"Occupants might have forgotten to checkout. Updated application status to checkedout on "+currDate}).then((response)=>{
                    if(response.data.success){
                      console.log(app.stay_start_date+" changed to checkout by force")
                      res.json({success,currentlyOccupied:false})
                    }else{
                     res.json({success:false,message:"could not change status"})
                    }
                  })
                  
                }else if( cDate<startDate ){
                  res.json({success:true,currentlyOccupied:false})

                }else{
                  const update=await Application.updateOne(
                    {"_id":req.params.id},{
                      $set:[
                        {"currentlyOccupied":0}
                      ]
                    })

                }
                }
              }else if(app.application_status!="CONFIRMED" && app.currentlyOccupied==1){
                //if app is "confirmed but somehow not approved"
                const update=await Application.updateOne({"_id":req.params.id},{
                  $set:{"currentlyOccupied":0}
                })
                const app=await Application.find({$and:[{"_id":req.params.id}]})
                  res.json({success:true,currentlyOccupied:false,app:app,updated:update})
              }else{
                res.json({success:false,currentlyOccupied:false})
              }
              
              
              
              
             

            })
        
  
})
*/

router.get("/getActiveStatus/:id",async(req,res)=>{
  var app= await Application.find({
    $and:[
      {"_id":req.params.id}
    ]
  })
  app=app[0]
  console.log(app)
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
            
            var currentlyWrong=false
            const prom=new Promise(async(resolve,reject)=>{
              if((app.application_status=='CONFIRMED' || app.application_status=="CHECKEDIN") && app.approved==1){
                console.log("check if date is valie")
                if((cDate>=startDate && cDate<=endDate) && (activeDate>=startDate && activeDate<=endDate) &&app.currentlyOccupied!=1){
                  console.log("confirmed and in range:CHANGE TO ACTUVE")
                   const update=await Application.updateOne({"_id":req.params.id},{
                    $set:[{"currentlyOccupied":1}]
                   })
                   console.log(update)
                   res.json({success:true,currentlyOccupied:true})
                }else if((cDate>=startDate && cDate<=endDate) && (activeDate>=startDate && activeDate<=endDate) &&app.currentlyOccupied==1){
                  res.json({success:true,currentlyOccupied:true})

                }
                else{
                  //TODO:EITHER CHANGED TO CHECKEDOUT OUT IF PERSON FORGOT TO CHECKOUT OR DONT
                  console.log("current date is adter end date:"+(cDate>endDate))
                   if(cDate>endDate &&  (activeDate>=startDate && activeDate<=endDate)  ){
                  console.log("confirmed but but person forgot to checkout")
                 axios.post("http://localhost:3012/admin-applications/setStatus/"+app._id+"/CHECKEDOUT/",{message:"Occupants might have forgotten to checkout. Updated application status to checkedout on "+currDate}).then((response)=>{
                  console.log(response.data)
                    if(response.data.success){
                      console.log(app.stay_start_date+" changed to checkout by force")
                      res.json({success:true,currentlyOccupied:false})
                    }else{
                     res.json({success:false,message:"could not change status"})
                    }
                  })
                  
                }else if( cDate<startDate ){
                  res.json({success:true,currentlyOccupied:false})

                }else if(cDate>endDate && app.application_status=="CHECKEDIN"){
                  console.log("\n\nhere")
                 try{
                   const update=await Application.updateOne(
                    {"_id":req.params.id},{
                      $set:[
                        {"currentlyOccupied":0}
                      ]
                    })
                    console.log("herher")

                    axios.post("http://localhost:3012/admin-applications/setStatus/"+app._id+"/CHECKEDOUT/",{message:"Occupants might have forgotten to checkout. Updated application status to checkedout on "+currDate}).then((response)=>{
                      console.log(response.data)
                      if(response.data.success){
                        console.log(app.stay_start_date+" changed to checkout by force")
                        res.json({success:true,currentlyOccupied:false,application:response.data.application})
                      }else{
                       res.json({success:false,message:"could not change status"})
                      }
                    })
                  }catch(error){
                    console.log(err)
                  }
               
                 
                }else{
                  console.log(application)
                  console.log("check status")

                  console.log("fix currentlyOccupied")

                  const update=await Application.updateOne(
                    {"_id":req.params.id},{
                      $set:[
                        {"currentlyOccupied":0}
                      ]
                    })


                }
                }
              }else if(app.application_status!="CONFIRMED" && app.currentlyOccupied==1){
                //if app is "confirmed but somehow not approved"
                const update=await Application.updateOne({"_id":req.params.id},{
                  $set:{"currentlyOccupied":0}
                })
                const app=await Application.find({$and:[{"_id":req.params.id}]})
                  res.json({success:true,currentlyOccupied:false,app:app,updated:update})
              }else{
                res.json({success:true,currentlyOccupied:false})
              }
              
      

            })
})


router.post("/approve-booking/:id",async(req,res)=>{  
  res.setHeader("Access-Control-Allow-Origin","*")
  console.log(req.params)

  axios.get("http://localhost:3012/admin-applications/checkAvailability/"+req.params.id).then(async(response)=>{
    console.log(req.params)

   
    console.log(response.data)
    console.log("conflict"+response.data.conflicting_dates.length)
    if(!response.data.success){
      res.json({success:false,message:response.data.message})
    }
    else{
      const conflicting_dates=response.data.conflicting_dates
     
      if(conflicting_dates.length!=0 &&  response.data.paid){
      console.log("fdsd")
      res.json({success:true,approved:false,message:"conflighting dates",paid:response.data.paid,conflicting_dates:response.data.conflicting_dates})
    }
    if(conflicting_dates.length==0 && response.data.success && !response.data.paid){
      console.log("fdsd")
      res.json({success:true,approved:false,message:"not paid",paid:response.data.paid,conflicting_dates:response.data.conflicting_dates})
    }
    if(conflicting_dates.length==0  &&response.data.paid && response.data.success){
      var app=await Application.find({$and:[{"_id":req.params.id}]})
      app=app[0]
      
      if(app!=null){
        const booked_dates=await BookedDate.find({$and:[{"application_id":!req.params.id}]})
        console.log("booked_dates")
        console.log(booked_dates)
        console.log("booked dates")
        console.log(booked_dates)
        if(booked_dates.length>0){
          axios.get("http://localhost:3012/admin-applications/allBookingDatesForApplication/"+req.params.id).then(async(response)=>{
            if(response.data.success){
              const our_dates=response.data.booked_dates
              booked_dates.map((b)=>{
                our_dates.map((o)=>{
                  console.log(o.date+" "+b.date)
                  console.log(b)
                  console.log(o.application_id+" "+b.application_id)
                  if(o.date==b.date && o.application_id!=b.application_id ){
                    if(b.fullsuite==true)
                    console.log("match\n\n")
                    conflicts.push({application_id:b.application_id,date:b.date})
                    
                    index++;
                  }else{
                    if((b.roomOne==true && o.roomOne==true) ||  (o.roomTwo==true && b.roomTwo==true) || (o.roomThree==true && b.roomThree==true)){
                      console.log("match\n\n")
                      conflicts.push({application_id:b.application_id,date:b.date})
                      
                      index++;
                    }
                  }
                })
              })
              if(index>0){
                  console.log("here")
                res.json({success:true,approved:false,conflicting_dates:conflicts,paid:true,message:"conflicting dates"})
              }else{
                var indLength=0
                var alreadyBooked=0
                const prom2=new Promise(async(resolve2,reject2)=>{
                  //Insure no duplicate entries
                  const starter= new BookedDate({
                    application_id:req.params.id,
                    date:response.data.startBuffer,
                    roomOne:app.roomOne,
                    roomTwo:app.roomTwo,
                    roomThree:app.roomThree,
                    fullSuite:app.fullSuite
                  })
                  const start=await starter.save()
                  our_dates.map(async(o)=>{
                    console.log("916")
                    var alreadybooked=await BookedDate.find({$and:[{"date":o.date},{"application_id":req.params.id}]})
                    if(alreadybooked.length>0){
                      alreadyBooked++
                    }else{
                      console.log("\n\nNEW BOOKED")
                      const newBooked= new BookedDate({
                        application_id:req.params.id,
                        date:o.date,
                        fullSuite:app.fullSuite,
                        roomOne:app.roomOne,
                        roomTwo:app.roomTwo,
                        roomThree:app.roomThree
                      })

                      const bookedSaved=await newBooked.save()
                      
                      indLength++
                    }
                  })
                  const ender= new BookedDate({
                    application_id:req.params.id,
                    date:response.data.endBuffer,
                    fullSuite:app.fullSuite,
                    roomOne:app.roomOne,
                    roomTwo:app.roomTwo,
                    roomThree:app.roomThree

                  })
                  const end=await ender.save()
                  resolve2()
                })
               
                prom2.then(async()=>{
                  console.log(our_dates.length+" alreadyLength:"+alreadyBooked+" newbooked:"+index)
                    const cDate=new Date()
                    const currDate=cDate.toString().substring(0,15)
                    console.log("\n\nUPDATING APP")
                    const updateApp=await Application.updateOne({"_id":req.params.id},{
                      $set:[{"approved":1},{"dateApproved":currDate}]
                    })
                    
                    if(updateApp.acknowledged==true){
                      console.log(our_dates.length)
                      console.log(alreadybooked+indLength)
                      if(alreadyBooked+indLength==our_dates.length){
                        res.json({success:true,approved:true,conflicting_dates:conflicting_dates,paid:response.data.paid,no_booked:alreadyBooked+indLength})
                        }

                    }else{

                    }
                  
                })          
              }
            }else{
              //TODO:send error
            }
          })

        }else{
          var indLength=0
                var alreadyBooked=0
          axios.get("http://localhost:3012/admin-applications/allBookingDatesForApplication/"+req.params.id).then(async(response)=>{
            console.log(response.data)
            if(response.data.success){
              console.log(response.data)
              const our_dates=response.data.booked_dates
              console.log("\n\nour date")
              console.log(our_dates)
              var index=0
                axios.post("http://localhost:3012/admin-applications/checkBlockedDates",{dates:response.data.booked_dates,startBuffer:response.data.startBuffer,endBuffer:response.data.endBuffer}).then((response2)=>{
                  console.log(response2.data)
                  console.log("HEREE")
                  if(response2.data.blocked==true || response2.data.blocked_dates.length>0){
                    console.log(response2.data)
                    console.log("ggre")
                    res.json({success:true,approved:false,conflicting_dates:response.data.blocked})
                  }else{
                
                const prom2=new Promise(async(resolve2,reject2)=>{
                  var s=response.data.startBuffer
                  var e=response.data.endBuffer
                  console.log("\n\n"+s +"    "+e+"\n\n")
                  var a=await Application.find({$and:[{"_id":req.params.id}]})
                  a=a[0]
                  if(a!=null){
                  var alreadyBookedStart=await BookedDate.find({$and:[{"date":s.toString().substring(0,15)},{"application_id":req.params.id}]})
                  var alreadyBookedEnd=await BookedDate.find({$and:[{"date":e.toString().substring(0,15)},{"application_id":req.params.id}]})
             
                  if(alreadyBookedStart[0]==null && s!=null){
                    const newBookedStart= new BookedDate({
                      application_id:req.params.id,
                      date:s,
                      fullSuite:app.fullSuite,
                      roomOne:app.roomOne,
                      roomTwo:app.roomTwo,
                      roomThree:app.roomThree
                    })
                    indLength++
                    const bookedSavedStart=await newBookedStart.save()

                  }

                  //Insure no duplicate entries
                  setTimeout(()=>{
                    our_dates.map(async(o)=>{ 
                      try{
                        console.log("here1")
                      var alreadybooked=await BookedDate.find({$and:[{"date":o.date},{"application_id":a._id}]})
                      }catch(error){
                        console.log(error)
                      }
                      console.log(alreadybooked)
                      if(alreadybooked.length>0){
                        alreadyBooked++
                      }else{
                        console.log("\n\nNEW BOOKED")
                       const newBooked= new BookedDate({
                          application_id:req.params.id,
                          date:o.date,
                          fullSuite:app.fullSuite,
                          roomOne:app.roomOne,
                          roomTwo:app.roomTwo,
                          roomThree:app.roomThree
                        })
                        const bookedSaved=await newBooked.save()
                        indLength++
                      }
                    })

                  },200)
                 
                  setTimeout(async()=>{
                    if(alreadyBookedEnd[0]==null && e!=null){
                      const newBookedEnd= new BookedDate({
                        application_id:a._id,
                        date:e,
                        fullSuite:app.fullSuite,
                        roomOne:app.roomOne,
                        roomTwo:app.roomTwo,
                        roomThree:app.roomThree
                      })
                      indLength++
                      const bookedSavedEnd=await newBookedEnd.save()
  
                    }

                  },400)
            
                }
                setTimeout(()=>{
                  resolve2()
                },700)
                  
                })

                   prom2.then(async()=>{
                  console.log("already:"+alreadyBooked)
                  console.log(our_dates.length+" alreadyLength:"+alreadyBooked+" newbooked:"+index)
                    const cDate=new Date()
                    const currDate=cDate.toString().substring(0,15)
                    console.log("\n\nUPDATING APP")
                    console.log("997")
                    var checkApp=await Application.find({$and:[{"_id":req.params.id},{"approved":1}]})
                    
                   const updateApp=await Application.updateOne({"_id":req.params.id},
                      {$set:{"approved":1,"dateApproved":currDate}}
                    )
                    console.log("998")
                    console.log(updateApp)
                    if(updateApp.acknowledged==true ){
                      console.log(alreadyBooked+indLength)
                      console.log(our_dates.length)
                   
                        res.json({success:true,approved:true,conflicting_dates:conflicting_dates,paid:response.data.paid,no_booked:alreadyBooked+indLength})
                        
                        console.log(updateApp)

                    }else if(checkApp[0]!=null && updateApp.acknowledged==false){
                      console.log("Already updated")
                      console.log(checkApp)
                      res.json({success:true,approved:true,conflicting_dates:conflicting_dates,paid:response.data.paid,no_booked:alreadyBooked+indLength})
                    }
                  
                })   
              }

                })
               
               
                    
              
            }else{
              //TODO:send error
            }
          })
        }
      }else{
        res.json({success:false,message:"application "+ req.params.id+" does not exist."})
      }


    
    }else{
      res.json({success:true,approved:false,conflicting_dates:response.data.conflicting_dates,response:response.data})
    }
  }
  })
})



router.get("/allBookedDates",async(req,res)=>{
  const booked=await BookedDate.find({})
  res.json({success:true,no_dates:booked.length,dates:booked})
})
router.get("/remove-booked-dates/:id",async(req,res)=>{
  const deleted=await BookedDate.deleteMany({$and:[{"application_id":req.params.id}]})
  res.json({success:true,deleted:deleted})
})
/*
router.get("/activeStatus/:id",async(req,res)=>{

            const prom=new Promise(async(resolve,reject)=>{


              var app= await Application.find({
                $and:[
                  {"_id":req.params.id}
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
                        var currentlyWrong=false

                        
              if(app.application_status=='CONFIRMED' && app.approved==1 && app.currentlyOccupied!=1){
                console.log("check if date is valie")
                if((cDate>=startDate && cDate<=endDate) && (activeDate>=start && activeDate<=endDate)){
                  console.log("confirmed and in range:CHANGE TO ACTUVE")
                  //TODO:changed to currentltOccupied
                }else{
                  //TODO:EITHER CHANGED TO CHECKEDOUT OUT IF PERSON FORGOT TO CHECKOUT OR DONT
                   if(cDate>endDate &&  (activeDate>=start && activeDate<=endDate)  ){
                  console.log("confirmed but but person forgot to checkout")
                /*  axios.get("http://localhost:3012/admin-applications/setStatus/"+app._id+"/CHECKEDOUT/",{message:"Occupants might have forgotten to checkout. Updated application status to checkedout on "+currDate}).then((response)=>{
                    if(response.data.success){
                      console.log(app.stay_start_date+" changed to checkout by force")
                      //TODO res.json({success,currentlyOccupied:false})
                    }else{
                      //TODO:res.json({success:true,currentlyOccupied,message:"shouldve been changed to checkout but error"})
                    }
                  })
                  
                }else if(app.currentlyOccupied==1 && app.approved==1 && (cDate>=startDate && cDate<=endDate) && (activeDate>=start && activeDate<=endDate)){
                  res.json({success:true,currentlyOccupied:true})

                }else{
                  const update=await Application.updateOne(
                    {"_id":req.params.id},{
                      $set:[
                        {"currentlyOccupied":0}
                      ]
                    })

                }
                }
              }else{
                  res.json({success:true,currentlyOccupied:false})
              }
              
              
              
              
             

            })
        
  
})
*/
/*
router.get("/getActiveStatus/:id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  var app= await Application.find({
    $and:[
      {"_id":req.params.id}
    ]
  })
  app=app[0]

  console.log(app)
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

            console.log((activeDate>=startDate && activeDate<=endDate &&(cDate>=activeDate && cDate<=endDate)) )
            console.log("active:"+activeDate +" startDate:"+startDate+" endDate:"+endDate)
          
            if( (activeDate>=startDate && activeDate<=endDate) && (cDate>=activeDate && cDate<=endDate) ){
              console.log("\n\n\n")
             // console.log("start:"+app.stay_start_date+"  end:"+ app.stay_end_date+" activedate:"+activeDate)

              console.log("\n\n")
           
            if((app.currentlyOccupied!=1 && (activeDate>=startDate && activeDate<endDate) ) && app.application_status=="CONFIRMED" ){
             // console.log("Set ActiveACTIVED")
             
             const updated=await Application.updateOne(
                {"_id":req.params.id}
                ,{
                  $set:{
                    "currentlyOccupied":1
                  }
                })
                  res.json({success:true,currentlyOccupied:true})
                
              }else if(app.currentlyOccupied==1 && !(activeDate>=startDate && activeDate<=endDate) && app.application_status=="CONFIRMED"){
                const update=await Application.updateOne({"_id":req.params.id},{
                  $set:[
                    {"currentlyOccupied":0}
                  ]
                })
               // console.log(update)
                res.json({success:true,currentlyOccupied:false})

              }
              else if(!((app.currentlyOccupied==1 && (activeDate>=startDate && activeDate<=endDate) ) && app.application_status=="CONFIRMED") && !(app.currentlyOccupied==1 && app.application_status=="CONFIRMED")){
             // console.log("ELSE")
              res.json({success:true,currentlyOccupied:false})
             
            }
          }else if((activeDate>=startDate && activeDate<=endDate) && !(cDate>endDate || cDate<startDate)){
            console.log()
            console.log("\n\n\n")
            console.log(app.stay_start_date+" correcting")
            console.log("\n\n\n")
            if(app.currentlyOccupied==1 && app.application_status=="CONFIRMED"){
            const setNotCurr=await Application.updateOne({"_id":req.params.id},{
              $set:[{"currentlyOccupied":0}]
            })
            console.log(setNotCurr)
           if(app.checkoutTime=="" || app.checkoutTime=='' && cDate>endDate){
          axios.post("http://localhost:3012/admin-applications/setStatus/"+app._id+"/CHECKEDOUT/", {message:"Occupants checkedout."}).then((response)=>{
              res.json({Success:true,currentlyOccupied:false})
             })
           }else if(app.checkoutTime=="" || app.checkoutTime=='' && cDate<startDate){
            res.json({success:true,currentlyOccupied:false})
           }
          }
           
          }else if((activeDate>=startDate && activeDate<=endDate) && !(cDate>=activeDate && cDate<=endDate) && app.currentlyOccupied!=1){
          res.json({success:true,currentlyOccupied:false})
           
          }
      


})

*/
//calulate all booked dates for an application
router.get("/allBookingDatesForApplication/:id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  var app=await Application.find({$and:[{"_id":req.params.id}]})
  if(app!=null){
  app=app[0]
  var months= ["Jan","Feb","Mar","Apr","May","Jun","Jul",
  "Aug","Sep","Oct","Nov","Dec"];
  var monthnum=["01","02","03","04","05","06","07","08","09","10","11","12"]
  var cDate=new Date()
  var index=1
  var st=app.stay_start_date.split(" ")
  var et=app.stay_end_date.split(" ")
 
 const booked_dates=[]
 
  const startDate=new Date(st[3],monthnum[months.indexOf(st[1])-1],st[2])
  const endDate=new Date(et[3],monthnum[months.indexOf(et[1])-1],et[2])
  var nextDate=new Date(startDate);
  var start=new Date(startDate);
  var startBuffer=start.setDate(startDate.getDate()-1)
  var starterBuffer=new Date(startBuffer)

  booked_dates.push({application_id:req.params.id,date:startDate.toString().substring(0,15)})

  while(nextDate.toString().substring(0,15)!=endDate.toString().substring(0,15)){
    var nextnext=nextDate.setDate(nextDate.getDate()+1)
    nextDate=new Date(nextnext)
    booked_dates.push({application_id:req.params.id,date:nextDate.toString().substring(0,15)})  
    index++
  }
  var nextnext=nextDate.setDate(nextDate.getDate()+1)
  nextDate=new Date(nextnext)
  var endBuffer=new Date(nextDate)
  endBuffer=endBuffer.toString().substring(0,15)
  starterBuffer=starterBuffer.toString().substring(0,15)
  console.log("end:"+endBuffer)

  console.log(booked_dates)
  res.json({success:true,no_days:index,startBuffer:starterBuffer,endBuffer:endBuffer,booked_dates:booked_dates})
}else{
  res.json({success:false,message:"application "+req.params.id+" does not exist"})
}


})

router.get("/allBookingDatesForApplication/:startDate/:endDate",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");


  app=app[0]
  var months= ["Jan","Feb","Mar","Apr","May","Jun","Jul",
  "Aug","Sep","Oct","Nov","Dec"];
  var monthnum=["01","02","03","04","05","06","07","08","09","10","11","12"]
  var cDate=new Date()
  var index=1

  
 
 const booked_dates=[]
 
  const startDate=new Date(req.params.startDate)
  const endDate=new Date(req.params.endDate)
  var nextDate=new Date(startDate);
  var start=new Date(startDate);
  var startBuffer=start.setDate(startDate.getDate()-1)
  var starterBuffer=new Date(startBuffer)

  booked_dates.push({application_id:req.params.id,date:startDate.toString().substring(0,15)})

  while(nextDate.toString().substring(0,15)!=endDate.toString().substring(0,15)){
    var nextnext=nextDate.setDate(nextDate.getDate()+1)
    nextDate=new Date(nextnext)
    booked_dates.push({application_id:req.params.id,date:nextDate.toString().substring(0,15)})  
    index++
  }
  var nextnext=nextDate.setDate(nextDate.getDate()+1)
  nextDate=new Date(nextnext)
  var endBuffer=new Date(nextDate)
  endBuffer=endBuffer.toString().substring(0,15)
  starterBuffer=starterBuffer.toString().substring(0,15)
  console.log("end:"+endBuffer)

  console.log(booked_dates)
  res.json({success:true,no_days:index,startBuffer:starterBuffer,endBuffer:endBuffer,booked_dates:booked_dates})



})

//help:
//calulates an array of all dates a reservation takes up
router.get("/calculate-booked-dates-for-application/:id",async(req,res)=>{  res.setHeader("Access-Control-Allow-Origin","*")
  res.setHeader("Access-Control-Allow-Origin", "*");

  var appExist
  const booked_dates=[]
  const promise=new Promise(async(resolvePromise,rejectPromise)=>{

    var app=await Application.find({$and:[{"_id":req.params.id}]})
    var application=app[0]
    if(application!=null){
      const prom1=new Promise((resolve1,reject1)=>{
       
        var months= ["Jan","Feb","Mar","Apr","May","Jun","Jul",
        "Aug","Sep","Oct","Nov","Dec"];
        var monthnum=["01","02","03","04","05","06","07","08","09","10","11","12"]
        var cDate=new Date()
        
        var index=0
        console.log(cDate)
        var st=application.stay_start_date.split(" ")
        var et=application.stay_end_date.split(" ")
       
       
        const startDate=new Date(st[3],monthnum[months.indexOf(st[1])-1],st[2])
        const endDate=new Date(et[3],monthnum[months.indexOf(et[1])-1],et[2])
        var nextDate=new Date(startDate);
        console.log("endDate:"+endDate)
        console.log("nextDate:"+nextDate)
        console.log("endDate greater:"+(endDate>nextDate))
        while(nextDate.toString().substring(0,15)!=endDate.toString().substring(0,15)){
          var nextnext=nextDate.setDate(nextDate.getDate()+1)
          nextDate=new Date(nextnext)
          console.log((nextDate.toString().substring(0,15)))
          booked_dates.push({application_id:req.params.id,date:nextDate.toString().substring(0,15)})
          index++
        }
        
        resolve1()
       })
        
       prom1.then(()=>{
        res.json({success:true,booked_dates:booked_dates})

       })
    }else{
      res.json({success:false,message:" app "+req.params.id+" does not exist."})
    }
  })
})


router.post("/reserveAndPromptPay/:id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  const id=req.params.id
  var app=await Application.find({"_id":req.params.id})
  app=app[0]
  if(app!=null){
    
    var cDate=new Date()
    var nextDate=new Date(cDate);
    var index=0
    while(index<6){
      var nextnext=nextDate.setDate(nextDate.getDate()+1)
      nextDate=new Date(nextnext)
      console.log((nextDate.toString().substring(0,15)))
      index++
    }

    const paymentDueDate=nextDate.toString().substring(0,15)

    axios.get("http://localhost:3012/admin-applications/checkAvailability/"+req.params.id).then(async(response)=>{
     
      console.log(response.data)
      const conflicting_dates=response.data.conflicting_dates

      if(response.data.conflicting_dates.length>0){
        res.json({success:true,reserved:false,conflicting_dates:conflicting_dates})
      }else{
       index=0
        if(response.data.paid!=true){
          console.log("\n\n\n\nupdating")
          const updatedApp=await Application.update({"_id":id},{$set:{"dateReserved":cDate.toString().substring(0,15),"datePaymentDue":paymentDueDate}})
          console.log(updatesApp)
          if(updatedApp.acknowledged==true){
            //TODO: createbooked
            axios.get("http://localhost:3012/admin-applications/allBookingDatesForApplication/"+req.params.id).then((response1)=>{
              if(response1.data.success){
                var booked=response1.data.booked_dates
                booked.map(async(b)=>{
                    const book=new BookedDate({
                      date:b.date,
                      application_id:id
                    })

                    const saved=await book.save()
                    console.log(saved)
                    index++
                })
              }
              res.json({success:true,reserved:true,conflicting_dates:conflicting_dates,no_dates_added:index})

            })
          }else{
            console.log("failed")
          }
        }
        /*const updatedApp=await Application.update({"_id":id},{$set:{"dateReserved":cDate.toString().substring(0,15),"datePaymentDue"}})
        */
       /*db.query("update ghanahomestay.applications set dateReserved=?,datePaymentDue=?,application_status='RESERVED' where id=?",[cDate.toString().substring(0,15),paymentDueDate,id],(err1,results)=>{
          if(err1){
            console.log(err1)
          }else{
            var index=0
           
               axios.get("http://localhost:3012/admin-applications/allBookingDatesForApplication/"+id).then((response1)=>{
                console.log("allbooked date\n\n\n")
                console.log(response1.data)
                const datesToReserve=[]
                response1.data.booked_dates.map((m)=>{
                  console.log("in data\n")

                  db.query("select count(*) as appCount from ghanahomestay.booked_dates where date=?",m.date,(err3,results3)=>{
                    if(err3){
                      console.log(err3)
                    }else{
                      const appCount=Object.values(JSON.parse(JSON.stringify(results3)))
                      const count=appCount[0].appCount
                      console.log(count)
                      if(count<1){
                        db.query("insert into ghanahomestay.booked_dates (date,application_id) values (?,?)",[m.date,m.application_id],(err2,results2)=>{
                          if(err2){
                            console.log(err2)
                          }
                        })
                        index++
                      }else{
                        console.log("already_added")
                      }
                    }

                  })

                  
                })
                res.json({success:true,reserved:true,conflicting_dates:conflicting_dates,no_dates_added:index})

               })
            
          }
        })
        */
        
      }
    })

  }

  /*db.query("select count(*) as appCount from ghanahomestay.applications where id=?",req.params.id,(err,results)=>{

    const appCount=Object.values(JSON.parse(JSON.stringify(results)))
    const count=appCount[0].appCount
    console.log(count)
    if(count>0){
    

      var cDate=new Date()
      var nextDate=new Date(cDate);
      var index=0
      while(index<6){
        var nextnext=nextDate.setDate(nextDate.getDate()+1)
        nextDate=new Date(nextnext)
        console.log((nextDate.toString().substring(0,15)))
        index++
      }

      const paymentDueDate=nextDate.toString().substring(0,15)

      axios.get("http://localhost:3012/admin-applications/checkAvailability/"+id).then((response)=>{
        console.log(response.data.booked_dates)
        console.log(response.data)
        const conflicting_dates=response.data.conflicting_dates

        if(response.data.conflicting_dates.length>0){
          res.json({success:true,reserved:false,conflicting_dates:conflicting_dates,here:"true2"})
        }else{

         db.query("update ghanahomestay.applications set dateReserved=?,datePaymentDue=?,application_status='RESERVED' where id=?",[cDate.toString().substring(0,15),paymentDueDate,id],(err1,results)=>{
            if(err1){
              console.log(err1)
            }else{
              var index=0
             
                 axios.get("http://localhost:3012/admin-applications/allBookingDatesForApplication/"+id).then((response1)=>{
                  console.log("allbooked date\n\n\n")
                  console.log(response1.data)
                  const datesToReserve=[]
                  response1.data.booked_dates.map((m)=>{
                    console.log("in data\n")

                    db.query("select count(*) as appCount from ghanahomestay.booked_dates where date=?",m.date,(err3,results3)=>{
                      if(err3){
                        console.log(err3)
                      }else{
                        const appCount=Object.values(JSON.parse(JSON.stringify(results3)))
                        const count=appCount[0].appCount
                        console.log(count)
                        if(count<1){
                          db.query("insert into ghanahomestay.booked_dates (date,application_id) values (?,?)",[m.date,m.application_id],(err2,results2)=>{
                            if(err2){
                              console.log(err2)
                            }
                          })
                          index++
                        }else{
                          console.log("already_added")
                        }
                      }

                    })

                    
                  })
                  res.json({success:true,reserved:true,conflicting_dates:conflicting_dates,no_dates_added:index})

                 })
              
            }
          })
          
        }
      })

    }else{
      res.json({success:false,message:"application "+ id+" does not exist"})
    }
  })
  */
})

router.get("/test/:id",async(req,res)=>{  res.setHeader("Access-Control-Allow-Origin","*")
  res.setHeader("Access-Control-Allow-Origin", "*");

  var flagApproved=true


  const prom=new Promise((resolve,reject)=>{

    const currdate=new Date()
  const currentDate=currdate.toString().substring(0,15)

  db.query("select count(*) as appCount from ghanahomestay.applications where id=? && application_status='PAYED'",req.params.id,(err3,results3)=>{
   const appCount=Object.values(JSON.parse(JSON.stringify(results3)))
   const count=appCount[0].appCount
  console.log(count)
  if(count>0){

   db.query("update ghanahomestay.applications set confirmedApproved=1,date_approved=?  where id=? && application_status='PAYED'",[currentDate,req.params.id],(err2,results2)=>{
     if(err2){
       console.log(err2)
     }else{
       console.log(results2)
       if(results2.affectedRow>0){
         resolve()
       }else{
         reject()
       }
     }
    })
  }else{
   flagApproved=true
   resolve()

  }
  })

  })

  prom.then(()=>{
    if(flagApproved==true){
      console.log("no items found")
      res.json({success:false,message:"payment not recieved"})
    }else{
      //

      //contrine
    }

  }).catch((error)=>{
    res.json({success:false,message:"already reserved"})
    console.log(error)
  })
})
/*********************************************************** */
/*for canceling a reservations reservation status after 5 days grace period has been surpassed without payment.
changed status back to "APPLIED"
remove all reserved date in booking_dates tables associated with application
*/
router.post("/release-reservation-due-to-unpaid/:id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");
  console.log("_id"+req.params.id)
  var app=await Application.find({
    $and:[{"_id":req.params.id}]
  })
  console.log("app")
  console.log(app)
  app=app[0]
  if(app!=null){
  axios.get("http://localhost:3012/admin-applications/checkPayementDeadline/"+req.params.id).then(async(response)=>{
    if(response.data.success && response.data.hasDueDate && response.data.passedDue){
       const released=await Application.updateOne(
        {"_id":req.params.id},
        {
          $set:{"datePaymentDue":"","application_status":"APPLIED","notify_applicant":1,"notify_applicant_message":"Your have missed your payment deadline for this stay.If it was reserved, it has now been dropped."},
        }
       )
       if(released.acknowledge==true){
        const booked_dates=await BookedDate.find({"application_id":req.params.id})
        if(booked.length>0){
          const deleted=await BookedDate.remove({"application_id":"req.params.id"})
          if(deleted.acknowledge==true){
            res.json({success:true,remove_bookings:booked_dates.length})

          }else{
            res.json({success:false,remove_bookings:0})
          }
        }
       }if(response.data.success && response.data.hasDueDate && !response.data.passedDue){
        res.json({success:true,hasDueDate:response.data.hasDueDate,passDue:response.data.passDue,message:"Due date not meet"})
      }  if(response.data.success && !response.data.hasDueDate){
        res.json({success:true,hasDueDate:response.data.hasDueDate,passDue:response.data.passedDue,message:"No payment due date"})
      }
      if(!response.data.success){
        res.json({success:false,hasDueDate:response.data.hasDueDate,passDue:response.data.passedDue,message:"No payment due date"})

      }
    }
    
  })
}else{
  res.json({success:false,message:"app "+req.params.id+" does not exist"})
}


  /*db.query("select count(*) as appCount from ghanahomestay.applications where id=?",req.params.id,(err,results)=>{
    if(err){
      console.log(err)
    }else{
      const appCount=Object.values(JSON.parse(JSON.stringify(results)))
      const count=appCount[0].appCount
     console.log(count)
     
     if(count>0){
      axios.get("http://localhost:3012/admin-applications/checkPaymentDeadline/"+req.params.id).then((response)=>{
        console.log(response.data)
        console.log(response.data.success==true&& response.data.hasDueDate==true && response.data.passedDue==true)
        if(response.data.success && response.data.hasDueDate && response.data.passedDue ){

          //change application status
          db.query("update ghanahomestay.applications set datePaymentDue=' ',application_status='APPLIED',notify_applicant=1 where id=?",req.params.id,(err1,results1)=>{
            if(err1){
              console.log(err1)
            }else{
              console.log(results1)
              if(results1.changedRows>0){

                
               db.query("select * from ghanahomestay.booked_dates where application_id=?",req.params.id,(err2,results2)=>{
                  if(err2){
                    console.log(err2)
                  }else{
                    console.log(results2)
                    db.query("delete from ghanahomestay.booked_dates where application_id=?",req.params.id,(err3,results3)=>{
                      if(err3){
                        console.log(err3)
                      }else{
                        console.log(results3)
                        if(results2.length==results3.changedRows){
                          res.json({success:true,remove_bookings:results2})
                        }else{
                          res.json({success:false,remove_bookings:results2})
                        }

                      }
                    })
                    
                  }
                })
                
                
              }
            }
          })
          

        }if(response.data.success && response.data.hasDueDate && !response.data.passedDue){
          res.json({success:true,hasDueDate:response.data.hasDueDate,passDue:response.data.passDue,message:"Due date not meet"})
        }
        if(response.data.success && !response.data.hasDueDate){
          res.json({success:true,hasDueDate:response.data.hasDueDate,passDue:response.data.passedDue,message:"No payment due date"})
        }
        if(!response.data.success){
          res.json({success:false,hasDueDate:response.data.hasDueDate,passDue:response.data.passedDue,message:"No payment due date"})

        }
      })
     }else{
      res.json({success:false,message:"application "+req.params.id+" does not exist"})

     }
    }
  })
  */
})

router.get("/checkPaymentDeadline/:id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  const id=req.params.id
  try{
  var app=await Application.find({
    $and:[{"id":id}]
  })
  app=app[0]
  console.log(app)
  const dueDate=app.datePaymentDue
  console.log("duedate:"+dueDate)
  
 
  if(app!=null){
    if( app.application_status=='PAYED')
    {
      res.json({success:true,message:"no payment due date",hasDueDate:false,passedDue:false,paid:true})

    }else if(dueDate!=null){
    var months= ["Jan","Feb","Mar","Apr","May","Jun","Jul",
    "Aug","Sep","Oct","Nov","Dec"];
    var monthnum=["01","02","03","04","05","06","07","08","09","10","11","12"]
    const cDate=new Date()
    const currdate=cDate.toString().substring(0,15)
    console.log(dueDate)
    console.log(currdate)
    const et=app.stay_end_date.split(' ')
    const endDate=new Date(et[3],monthnum[months.indexOf(et[1])-1],et[2])
    const dt=dueDate.split(' ')
    const dueDateObj=new Date(dt[3],monthnum[months.indexOf(dt[1])-1],dt[2])
   const currString=currdate.split(' ')
 
 
    if((currString[0]==dt[0] && currString[1]==dt[1]&& dt[2]==currString[2] && currString[3]==dt[3])  || cDate>=dueDateObj){
      res.json({success:true,hasDueDate:true,passedDue:true,current_date:currdate,due_date:dueDate})
      
    }else{
      res.json({success:true,hasDueDate:true,passedDue:false,current_date:currdate,due_date:dueDate})
    }
  }else{
    res.json({success:true,message:"no payment due date",hasDueDate:false,passedDue:false,paid:false})

  }
  }else{
    res.json({success:false,message:"application "+req.params.id+" does not exist"})

  }
  }catch(err){
  console.log(err)
    }
  

})
const arr2=[]


function calcTime(time,city, offset) {
  var d = time;
  var utc = d.getTime() - (d.getTimezoneOffset() * 60000);
  var nd = new Date(utc + (3600000*offset));
  return nd
}

router.get("/rooms-Available/:startDate/:endDate",async(req,res)=>{
  const start=req.params.startDate
  const end=req.params.endDate
  const booked=await BookedDate.find({})
 // var s=new Date(start)
  var e=new Date(end)
  var months= ["Jan","Feb","Mar","Apr","May","Jun","Jul",
  "Aug","Sep","Oct","Nov","Dec"];
  var monthnum=["01","02","03","04","05","06","07","08","09","10","11","12"]
  var cDate=new Date()

 /* var n=new Date()
  var nextnext=n.setDate(n.getDate()-1)
*/



  if(booked.length>0){
    const process=[]
    booked.map(async(b)=>{
    
      if(!process.includes(b.date)){
        process.push(b.date)
        const days=await BookedDate.find({$and:[{"application_id":b.application_id}]})
        var st=days[0].date.split(" ")
        var en=days[days.length-1].date.split(" ")
        en=new Date(en[3],monthnum[months.indexOf(en[1])-1],en[2])
        var next =new Date(st[3],monthnum[months.indexOf(st[1])-1],st[2])

        var sta=new Date(st[3],monthnum[months.indexOf(st[1])-1],st[2])
        var s=new Date(start)
        console.log(b.fullSuite)
        if(s>=next ){
      while((next<=en &&s<=en)){
       
        if(b.fullSuite==false){
          console.log("s:"+s)
        console.log("next:"+next+"\n\n")
        console.log(b.roomOne+"b.roomTwo:"+b.roomThree+" roomThree:"+b.roomThree)
      
        console.log(s)
        }
        next=new Date(next.setDate(next.getDate()+1))
        s=new Date(s.setDate(s.getDate()+1))


      }
    }
    }
  })

  }else{
    res.json({success:true,available:true})
  }
})


router.get("/find-dates",(req,res)=>{
  var oldDates=[]
  var arr=[]
  var arr2=[]
  index=0

  
  try{
  axios.get("http://localhost:3012/admin-applications/blocked-booked-dates").then((response)=>{
   try{ 
    var goo=true;

const d=response.data.dates
arr=d
    const dates=response.data.dates
    const alldates=[]
    const isoDates=[]
    console.log(dates.length)
    var min = dates.reduce(function (a, b) { return a < b ? a : b; }); 

    oldDates.push(JSON.stringify(min))

    alldates.push(new Date(min))
 
    var kill=false

    while(dates.length>0 && !kill){
      
      console.log("kill:"+kill)
      if(goo==true && !kill){
      
        var next=new Date(min)
        next=new Date(next.setDate(next.getDate()+1))
        var nextVal=JSON.stringify(next)
       
        if(!oldDates.includes(JSON.parse(nextVal))&& dates.includes(JSON.parse(nextVal)) && !alldates.includes(JSON.parse(nextVal))){
          goo=true
          oldDates.push(nextVal)
          alldates.push(next)
         


          console.log("removing:"+dates[dates.indexOf(min)])

          dates.splice(dates.indexOf(min),1)
          if(dates.length==1){
            min=dates[0]
          }else if(dates.length==2){
            var min1=new Date(dates[0])
            var min2=new Date(dates[1])
            min=Math.min(min1,min2)
          
          }else{
            min = dates.reduce(function (a, b) { return a <= b ? a : b; }); 

          }
      
          
       
        }else{
          next=new Date(next.setDate(next.getDate()+1))
          console.log("starting new:"+dates.includes(JSON.parse(JSON.stringify(next))))
        
        goo=false 
        

        }
        if(dates.length==0){
          kill=true
          break
        }
        

      }else{ 
     
     console.log("dates length:"+dates.length)
       
       
      
        dates.splice(dates.indexOf(min),1);
      
        if(!oldDates.includes(JSON.stringify(min))){
          oldDates.push(JSON.stringify(min))
          alldates.push(min)
          
        


        }
        
        if(dates.length==0){
          arr2.push(JSON.stringify(oldDates))
     
          index++
         
          kill=true;
          console.log("kill here:"+kill)
          break;
        }
       
     
        min = dates.reduce(function (a, b) { return a <= b ? a : b; }); 
        console.log("new min:"+min)
        
        arr2.push(JSON.stringify(oldDates))
        index++
        oldDates.splice(0,oldDates.length)
        alldates.push(new Date(min))
        oldDates.push(JSON.stringify(min))
       
        goo=true
        if(dates.length==0){
          kill=true;
          console.log("kill here:"+kill)
          break;
        }
      
        //console.log(oldDates)
    
        
      }

    }
    const datess=[]
    const datesss=[]

    alld=[]
    var ii=0
   
    alldates.map((a)=>{
     
      if(ii>0){
      var ar=new Date(alld[ii-1].toString())

      var aa= new Date(Date.parse(alld[ii-1]))
     if(ii==alldates.length-1){
     //alld. push(a)
     }
       
      if(ar!=a){

        alld.push(ar)
       
      }
      ii++
    }if(ii==0){
      alld.push(new Date(a))
    }
    })
  
    setTimeout(()=>{
      
      var j=0
      while(j<arr2.length){
        const a=JSON.parse(arr2[j])
        console.log(arr2.length)
        
        var i=0
        //console.log(JSON.parse(a))
        var start
        var end
        while(i<JSON.parse(a.length)){
       //  console.log(a.length)
        if(!datess.includes(JSON.stringify(a))){
         
         
          datess.push(JSON.stringify(a))
          

        }else{
        
        }
       setTimeout(()=>{
       if(datess.length>0){
        datesss.push({dates:JSON.stringify(datess)})
        datess.splice(0,datess.length)
       }
        
       },10)
        i++
      }
      
      j++
     
    }
    setTimeout(()=>{
      console.log(datess.length)
      res.send({success:true,dates:datesss,allDates:alld,roomsAvailable:response.data.roomsAvailable})
      
     },20)
      
    },200)

  



   }catch(err){

   }
  })
}catch(err){
  console.log(err)
}
})
router.get("/booked-dates-all",async(req,res)=>{
  const apps=await Application.find({$and:[{"approved":1},{"fullSuite":false}]})
  const booked=[]
  console.log(apps)
  apps.map(async(app)=>{
   // console.log(typeof(app.id))
    console.log(app._id)
    const book=await BookedDate.find({$and:[{"application_id":app.id}]})
    console.log(book)
    console.log("type:"+typeof(book[0].application_id)+"\n")

      console.log(app.roomOne+" "+app.roomTwo+" "+app.roomThree)
      booked.push({startDate:book[0].date,endDate:book[book.length-1].date,roomOne:book[0].roomOne,roomTwo:book[0].roomTwo,roomThree:book[0].roomThree})
    
  })

  setTimeout(()=>{
    res.json({success:true,booked:booked})
  },1000)

})
router.get("/format-find-dates",(req,res)=>{
  var start=new Date()
  console.log("find-format")
  axios.get("http://localhost:3012/admin-applications/find-dates").then((response)=>{
    if(response.data.success){
      //console.log(response.data)
      console.log("COMPLETE")
      const dates=response.data.allDates
     
    
      const date=[]
      const dateString=[]
      if(dates.length>0){
        dates.map((d)=>{
          date.push(new Date(d))
         var v=new Date(d)
         //console.log(d.toString())
         var u=new Date(v.setDate(v.getUTCDate()))
         const rr=new Date()
         
         const r=new Date(rr.setDate(u.getDate()))


         if(!dateString.includes(v.toString().substring(0,15))){
         dateString.push(v.toString().substring(0,15))
         }
         

        })
        setTimeout(()=>{
          console.log("here")
          axios.get("http://localhost:3012/admin-applications/roomsAvailable").then((response2)=>{
            console.log(response2.data)
            res.send({time:(new Date())-start,success:true,allDates:date,dates:response.data.dates,dateString:dateString,room_dates:response2.data.room_dates, room_string_dates:response2.data.room_string_dates,room_string_string:response2.data.room_string_strings})
          })
           
        },150)
      }
    }
  })
})
router.get("/sort-unavailable",(req,res)=>{
  var oldDates=[]
  const arr=[]
  const dateString=[]
  try{
  axios.get("http://localhost:3012/admin-applications/unavailable-dates").then((response)=>{
   try{ 
    console.log(response.data.dates)
    const dates=response.data.dates
    old=response.data.dates
    var min = dates.reduce(function (a, b) { return a < b ? a : b; }); 
    
    const r=response.data.dates
    arr.push(r)
    while(dates.length>1){
    oldDates.push(new Date(min))
    dates.splice(dates.indexOf(min),1)
    var next=new Date(min)
    next=new Date(next.setDate(next.getDate()+1))
    var nextVal=JSON.stringify(next)
    console.log(min+ "   \n next:"+ next+"\n")
    if(dates.includes(JSON.parse(nextVal)) && !oldDates.includes(new Date(next))){
      var index=dates.indexOf(JSON.parse(nextVal))
      dates.splice(index,1)
      oldDates.push(new Date(next))
      while(dates.length>0 &&dates.includes(JSON.parse(nextVal))){
     
       var date=new Date(oldDates[oldDates.length-1])
       next=new Date(date) 
      next=new Date(next.setDate(next.getDate()+1))
       nextVal=JSON.stringify(next)
      if(dates.includes(JSON.parse(nextVal))){
        index=dates.indexOf(JSON.parse(nextVal))
        dates.splice(index,1)
        oldDates.push(new Date(next))
      }else{
         var min = next
         var next=new Date(min)
        next=new Date(next.setDate(next.getDate()+1))
        var nextVal=JSON.stringify(next)
         console.log("NEW MIN:"+min)
    
      
      }
    }

 
    }else{ 
      var min = dates.reduce(function (a, b) { return a < b ? a : b; }); 

      oldDates.push(new Date(min))
     // arr.push(oldDates)
     
      console.log("NOT FOUNF")
      oldDates.splice(0,oldDates.length-1)
      console.log(oldDates)
      
     min = dates.reduce(function (a, b) { return a < b ? a : b; }); 
      next=new Date(min) 
      next=new Date(next.setDate(next.getDate()+1))
       nextVal=JSON.stringify(next)
     
      
      while(!dates.includes(JSON.parse(nextVal)) &&dates.length>0){ 
        dates.splice(dates.indexOf(min),dates.indexOf(min))
       
        console.log(oldDates)
        var min = oldDates.reduce(function (a, b) { return a > b ? a : b; }); 
  
        next=new Date(min)
        next=new Date(next.setDate(next.getDate()+1))
         nextVal=JSON.stringify(next)
         console.log("\n\nHERE:")
         console.log(JSON.parse(nextVal) + " min: "+min) 
        console.log("SEARCHINGGGGGGGGGGGGGGGGG!!") 
        next=new Date(next)
        next=new Date(next.setDate(next.getDate()+1))
        var nextVal=JSON.stringify(next)
        
        if(dates.includes(JSON.parse(nextVal))){
          console.log("FOUNDD")
        }
       
      }
      console.log("here")
      dates.splice(dates.indexOf(JSON.parse(nextVal)),dates.indexOf(JSON.parse(nextVal)))
      if(!oldDates.includes(JSON.parse(nextVal))){
      oldDates.push(new Date(next))
      console.log("FOUNDD"+JSON.parse(nextVal)+" "+dates.includes(JSON.parse(nextVal)))
      min=dates.reduce(function (a, b) { return a < b ? a : b; })
      }
      

    }
}
   /* dates.map((d)=>{
      var next=new Date(d)
      next=new Date(next.setDate(next.getDate()+1))
      var nextVal=next.setDate(next.getDate()+1)
     
      nextVal=JSON.stringify(next)
      
      if(dates.includes(JSON.parse(nextVal))){
        console.log("TRUE")
        oldDates.push(new Date(JSON.parse(nextVal)))
      }

    })
    */
  }catch(err){
    console.log(err)
  }
  })
}catch(err){
  console.log(err)
}
setTimeout(()=>{
  res.send({sorted:oldDates,old:arr[0]})
},1000)
})
router.get("/unavailable-dates",async(req,res)=>{

axios.get("http://localhost:3012/admin-applications/blocked-booked-dates").then((response)=>{
  if(response.data.success){
    if(response.data.length>0){
      const dates=response.data.dates
      var start=new Date(dates[0])
      finalStart=new Date(start)
      dates.map((b)=>{
       
        b=new Date(b)
        if(b<start){
          start=new Date(b)
          console.log(start)
        }
        if(start<finalStart){
          finalStart=new Date(start)
        }

      })
      
      setTimeout(()=>{
        try{sort(dates).then(()=>{
          
          res.json({success:true,start:finalStart,dates:dates})
    
        })
      }catch(err){
        console.log("alreadysent")
      }
      },200)
      
    }
  }
})




})

router.get("/blocked-booked-dates",async(req,res)=>{
  const blocked=await BlockedDate.find({})
  const booked=await BookedDate.find({})
  const roomsAvailable=[]
  
  var months= ["Jan","Feb","Mar","Apr","May","Jun","Jul",
  "Aug","Sep","Oct","Nov","Dec"];
  var monthnum=["01","02","03","04","05","06","07","08","09","10","11","12"]
  var cDate=new Date()
  
  const dates=[]
  var i=0
  const curr=new Date()
  var n=new Date()
  var nextnext=n.setDate(n.getDate()-1)
  blocked.map((b)=>{
    
    var s=b.day
    console.log(s)
    s=s.split(" ")
    date=new Date(s[3],monthnum[months.indexOf(s[1])-1],s[2])
    if(date>=curr && !dates.includes(date)){
      //console.log(date)
      dates.push(date)
    }
  })
  console.log("\n\nbooked")
  console.log(booked)
  booked.map(async(b)=>{
    var s=b.date
    s=s.split(" ")
    var start= date=new Date(s[3],monthnum[months.indexOf(s[1])-1],s[2])
    date=new Date(s[3],monthnum[months.indexOf(s[1])-1],s[2])
      const app=await Application.find({$and:[{"_id":b.application_id}]})
     // console.log(app)
    
    //console.log("netnext:"+new Date(nextnext) + "\n date:"+date+"\n\n")
    
   
    console.log(app[0].roomTwo)
     
    if(date>=nextnext && !dates.includes(date)){
      if(app[0].roomOne!=true && app[0].roomTwo!=true && app[0].roomThree!=true && app[0].fullSuite==true){
       // console.log(date)
       dates.push(date)
      } 
    }
  })

  setTimeout(()=>{
    
    res.json({success:true,dates:dates,length:dates.length,roomsAvailable:roomsAvailable})

  },500)
})
 router.get("/roomsAvailableString",async(req,res)=>{
  var months= ["Jan","Feb","Mar","Apr","May","Jun","Jul",
  "Aug","Sep","Oct","Nov","Dec"];
  var monthnum=["01","02","03","04","05","06","07","08","09","10","11","12"]

  //date=new Date(date[3],monthnum[months.indexOf(date[1])-1],date[2])
 const arr=[]
 const all_dates=[]
  const strings=[]
  const apps=await Application.find({$and:[{"application_status":"CONFIRMED"},{"fullSuite":false}]})
  console.log(apps)
  if(apps.length>0){
    apps.map( async(a)=>{
        const booked=await BookedDate.find({$and:[{"application_id":a._id}]})
        const min= booked.reduce(function (a, b) { return new Date(a.date.split(" ")[3],monthnum[months.indexOf(a.date.split(" ")[1])-1],a.date.split(" ")[2]) <new Date(b.date.split(" ")[3],monthnum[months.indexOf(b.date.split(" ")[1])-1],b.date.split(" ")[2])  ? a : b; }); 
        const max= booked.reduce(function (a, b) { return new Date(a.date.split(" ")[3],monthnum[months.indexOf(a.date.split(" ")[1])-1],a.date.split(" ")[2]) > new Date(b.date.split(" ")[3],monthnum[months.indexOf(b.date.split(" ")[1])-1],b.date.split(" ")[2])  ? a : b; }); 
        console.log(min)
        console.log(max)
        var start=min.date.split(" ")
        start=new Date(start[3],monthnum[months.indexOf(start[1])-1],start[2])
        var end=max.date.split(" ")
        end=new Date(end[3],monthnum[months.indexOf(end[1])-1],end[2])
        var next=new Date(start)
        arr.push(start)
       // next.setDate(start.getUTCDate())
      var old=new Date(next)
      console.log(next instanceof Date)
      console.log(next.toString())
      while(next<end){
        arr.push(next);
        const c=new Date(next)
        strings.push(JSON.stringify(c.toString()))
        old=new Date(next)
       
        next= new Date(next.setDate(old.getDate()+1))
        console.log("next:"+next)


      }
      setTimeout(()=>{
          all_dates.push(arr)
      },60)
    })
  }
  setTimeout(()=>{
    res.json({success:true,string_dates:all_dates,string_string_dates:strings})
  },500)
 })
router.get("/roomsAvailable",async(req,res)=>{
  var months= ["Jan","Feb","Mar","Apr","May","Jun","Jul",
  "Aug","Sep","Oct","Nov","Dec"];
  var monthnum=["01","02","03","04","05","06","07","08","09","10","11","12"]

  //date=new Date(date[3],monthnum[months.indexOf(date[1])-1],date[2])
 
  
  const apps=await Application.find({$and:[{"application_status":"CONFIRMED"},{"fullSuite":false}]})
  const dates=[]
  const allBook=[]
  const datesArr=[]
  apps.map(async(a)=>{
    const booked=await BookedDate.find({$and:[{"application_id":a._id}]})
   //const min= booked.reduce(function (a, b) { return new Date(a.date.split(" ")[3],monthnum[months.indexOf(a.date.split(" ")[1])-1],a.day.split(" ")[2]) < new Date(b.date.split(" ")[3],monthnum[months.indexOf(b.date.split(" ")[1])-1],b.date.split(" ")[2])  ? a : b; }); 
   const max= booked.reduce(function (a, b) { return new Date(a.date.split(" ")[3],monthnum[months.indexOf(a.date.split(" ")[1])-1],a.date.split(" ")[2]) < new Date(b.date.split(" ")[3],monthnum[months.indexOf(b.date.split(" ")[1])-1],b.date.split(" ")[2])  ? a : b; }); 
   const min= booked.reduce(function (a, b) { return new Date(a.date.split(" ")[3],monthnum[months.indexOf(a.date.split(" ")[1])-1],a.date.split(" ")[2]) > new Date(b.date.split(" ")[3],monthnum[months.indexOf(b.date.split(" ")[1])-1],b.date.split(" ")[2])  ? a : b; }); 
    console.log(min)
   console.log(max)
   var mi=min.date.split(" ")
   var ma=max.date.split(" ")
   mi=new Date(mi[3],monthnum[months.indexOf(mi[1])-1],mi[2])
   ma=new Date(ma[3],monthnum[months.indexOf(ma[1])-1],ma[2])


   dates.push({startDate:new Date(ma),endDate:new Date(mi),roomOne:a.roomOne,roomTwo:a.roomTwo,roomThree:a.roomThree})




  })
  setTimeout(()=>{
    axios.get("http://localhost:3012/admin-applications/roomsAvailableString").then((response)=>{
      console.log(response.data)
      res.json({success:true,room_dates:dates,room_string_dates:response.data.string_dates,room_string_strings:response.data.string_string_dates})

    })
  },500)
 
})
async function sort(arr){
  var i=0
  
 const arr3=await sort2(arr,0,arr.length-1,arr2,i)
 return arr3

 
}
async function sort2(arr,l,r,arr2,i){
 
  if(l<r && i<arr.length-1){
    console.log(i)
    var m=l+(r-l)/2
    //console.log(m +" "+ l+" "+ r)
    sort2(arr,l,m,i+1)
    sort2(arr,m+1,r,i+1)
    merge(arr,l,m,r,i,arr2)
    
    
  }
  setTimeout(()=>{
    return arr
  ,2000})
}

function merge(arr,l,m,r,index,arr2){
  console.log("here:"+index)

  const n1=l+m+1;
  const n2=r-m

  const L=[]
  const R=[]

  for(let ii=0;ii<n1;++ii){
    //console.log(L[ii])
    L[ii]=new Date(arr[l+ii]);
  }
  for(let jj=0;jj<n2;++jj){
    R[jj]=new Date(arr[jj+m+1]);
   // console.log(R[jj].toString())
  }
 var  i=0
 var j=0
 var  k=l
 if(i<10){
  while(i<n1 && j<n2){
    if(L[i]<=R[j] ){
      if((Object.prototype.toString.call(L[i]) === "[object Date]")){
     //console.log(L[i])
      arr2[k]=new Date(L[i])
      i++
      k++
      }else{
        return
      }
    }else{
     //console.log(R[j] )
     if((Object.prototype.toString.call(R[j]) === "[object Date]")){
      arr2[k]=new Date(R[j])
      k++
      j++
     }else{
      return
     }
    }
  }

  while(i<n1){
    if((Object.prototype.toString.call(L[i]) === "[object Date]")){
     // console.log(L[i])
       arr2[k]=new Date(L[i])
       i++
       k++
       }else{
         break
       }
  }
  while(j<n2){

    if((Object.prototype.toString.call(R[j]) === "[object Date]")){
     // console.log(new Date(L[i]))
       arr2[k]=new Date(R[j])
       j++
       k++
       }else{
         break
       }
  }
  setTimeout(()=>{
    
    return arr2
  },500)
}
}
/************************************************************* */
router.get("/newGetPaymentDueDate",async(req,res)=>{  res.setHeader("Access-Control-Allow-Origin","*")
  res.setHeader("Access-Control-Allow-Origin", "*");

  var cDate=new Date()
  var nextDate=new Date(cDate);
  var index=0
  while(index<6){
    var nextnext=nextDate.setDate(nextDate.getDate()+1)
    nextDate=new Date(nextnext)
    console.log((nextDate.toString().substring(0,15)))
    index++
  }
  
  console.log(nextDate.toString())
  res.json(nextDate.toString().substring(0,15))
})

module.exports=router

/**
 * 
 *  db.query("select * from ghanahomestay.booked_dates",(err,results)=>{
    if(err){
      console.log(err)
    }else{
      const conflict_dates=[]
      console.log(results)
      if(results==null || results.length==0){
        axios.get("http://localhost:3012/admin-applications/calculate-all-booked-dates/"+req.params.id).then((response)=>{
          console.log(response.data.booked_dates)
          const booked_dates=response.data.booked_dates
          var index=1
          booked_dates.map((date)=>{
            db.query("insert into ghanahomestay.booked_dates (date,application_id) values(?,?)",[date,req.params.id],(err1,results1)=>{
                if(err1){
                  console.log(err1)
                }else{
                  console.log(results1)
                  index++
                }
            })
          })
         
            res.json({success:true,no_days_booked:booked_dates.length})
          
        })
      }else{
        axios.get("http://localhost:3012/admin-applications/calculate-all-booked-dates/"+req.params.id).then((response)=>{
          const booked_dates=response.data.booked_dates

        const flagApproved=false
         //set confirmed approve to 1
         const prom1=new Promise((resolve1,reject1)=>{
          results.map((date)=>{
            if(booked_dates.includes(date.date)){
              conflict_dates.push({date:date})
  
            }
           })
           resolve()

         })

         prom1.then(()=>{
          console.log(conflict_dates)
          if(conflict_dates.length>0){
           res.json({success:false,conflicts:conflict_dates})
          }else{
           res.json({success:true,dates:booked_dates})
          }

         }).catch(()=>{
          res.json({success:false})
         })

       
        })
      }
    }
  })
 */