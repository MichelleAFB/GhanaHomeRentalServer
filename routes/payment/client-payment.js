const express = require("express");
const router = express.Router();
const cookie = require("universal-cookie");
const bcrypt = require("bcryptjs");
const db_config = require("../../config/db");
const mysql = require("mysql");
const cors = require("cors");
const new_db_config=require("../../config/newdb")
const bodyParser = require("body-parser");
var {db}=require("../../config/db")
const mongoose=require("mongoose")
const uniqueValidator = require('mongoose-unique-validator')
const { Application } =require('../../models/Application');
const { reject } = require('lodash');
const process=require("process")
const strip=require('stripe')(process.env.STRIP_LIVE_SECRET_KEY)
const dotenv = require("dotenv").config({path:"../../config/.env"})

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



router.get("/",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.json("Welcome to home stay ghana server : PAYMENTS")
})

router.post("/checkout/:id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");
console.log("\n\n\n"+req.params.id+"\n\n\n")
  const id=req.params.id
  const fees=req.body.fees
  console.log(fees)
  console.log("hi")
  const items=[]
  const prom=new Promise((resolve,reject)=>{
    fees.map((item)=>{
      if(item.quantity!=null){
      items.push({
        price:item.id,
        quantity:item.quantity
      })
    }else{
      try{
        reject()
      }catch(error){
        console.log(error)
      }
    }
    })
    resolve()
  })
 
  prom.then(()=>{

    

    const prom1=new Promise((resolve1,reject1)=>{

      const checkout=async()=>{

        const session=await strip.checkout.sessions.create({
          line_items:items,
          mode:"payment",
          success_url:"https://ghanahomerental.onrender.com/payment/success/"+id,
          cancel_url:"https://ghanahomerental.onrender.com/payment/cancel"
        })
       try{ 
        console.log(session.url)
        return session.url.toString()
       }catch(error){
          console.log(error)
          reject(error)
       }
      }
      checkout().then((response)=>{
        console.log(response)
        resolve1(response)
      })  

    })

    prom1.then(async(response)=>{
      console.log(response)
      const cDate=new Date()
      if(response!=null){
        
      
      const currDate=cDate.toString().substring(0,15)
      const updated=await Application.updateOne(
        {"id":req.params.id},
        {
          $set:{
           
            "paymentSessionUrl":response,

          }
        }
      )
      console.log(updated)
      if(updated.acknowledged==true){
        res.json({success:true,url:response,updated:updated})
      }
    }else{
        res.json({success:false,message:"error",updated:updated})
      }
  
    })
  }).catch((err)=>{
    res.json({success:false,error:err})
  })
})


router.get("/checkPaymentDue/:id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");


  db.query("select * from ghanahomestay.applications where id=?",req.params.id,(err,results)=>{
    const application=results[0]
    console.log("start:"+application.stay_start_date)
    console.log("end:"+application.stay_end_date)
    const ss=new Date().toString().substring(0,15)
    const e=application.datePaymentDue.toString()
    const start=ss.split(" ")
    const end=e.split(" ")
      console.log(end)
      var months= ["Jan","Feb","Mar","Apr","May","Jun","Jul",
            "Aug","Sep","Oct","Nov","Dec"];
      var daysInMonth=[31,28,31,30,31,30,31,31,30,31,30,31]
      const currentDate=new Date()
      const currentYear=currentDate.getFullYear()
     
      const leapYears=[2024,2028,2032,2036,2040,2044,2048,2052]
  
    if(start[3]==end[3]){
     
      const startMonth=months.indexOf(start[1])
      const endMonth=months.indexOf(end[1])
  
      const diffMonth=endMonth-startMonth
  
      var diffDays
      console.log("startMonth:"+startMonth+" end month:"+endMonth)
      //same month
      if(diffMonth==0){
        
        console.log("under a month: no days="+diffDays) 
        if(leapYears.includes(parseInt(end[3]))){
          
        }else{
          diffDays=end[2]-start[2]
          console.log(diffDays)
          res.status(200).json({success:true,days:diffDays})
        }
      }
      //different month
      else{
        //diff month
        console.log("diffmonth")
        if(leapYears.includes(parseInt(end[3]))){
          months[1]=months[1]+1
          var startString
          var endString
          const sDays=daysInMonth[months.indexOf(start[1])]
          const eDays=daysInMonth[months.indexOf(end[1])]
          console.log("sday:"+sDays);
          console.log("enddays:"+eDays)
          console.log(parseInt(start[2].substring(0,1)))
          if(parseInt(start[2].substring(0,1))==0){
            startString=parseInt(start[2].substring(1,2))
          }else{
            startString=parseInt(start[2])
  
          }
          if(parseInt(end[2].substring(0,1))==0){
            endString=parseInt(end[2].substring(1,2))
          }else{
            endString=parseInt(end[2])
          }
          console.log(startString)
          var stDays
          console.log(startString==parseInt(daysInMonth[months.indexOf(start[1])]))
          if(startString==parseInt(daysInMonth[months.indexOf(start[1])])){
            stDays=1
          }else{
            console.log(sDays-startString)
            stDays=sDays-startString
          }
          console.log("stDays:"+stDays)
          const enDays=endString
          console.log("endays:"+enDays)
          var totalDays=enDays+stDays
          console.log("TOTAL:"+totalDays)
          if(diffMonth>1){
            var index=endMonth-startMonth+1
            while(index<endMonth){
              console.log("totalDay:"+totalDays)
              totalDays=totalDays+daysInMonth[months.indexOf(months[index])]
              index++
            }
            console.log("HERE1")
           
            const total=totalDays
            res.json({success:true,days:total})
            return total
            sessionStorage.setItem("noDays",total)
          }else{
            console.log("HERERER")
            res.json({success:true,days:totalDays})
            return totalDays
            sessionStorage.setItem("noDays",totalDays)
          }
          
        }else{
          var startString
          var endString
          const sDays=daysInMonth[months.indexOf(start[1])]
          const eDays=daysInMonth[months.indexOf(end[1])]
          console.log("sday:"+sDays);
          console.log("enddays:"+eDays)
          console.log(parseInt(start[2].substring(0,1)))
          if(parseInt(start[2].substring(0,1))==0){
            startString=parseInt(start[2].substring(1,2))
          }else{
            startString=parseInt(start[2])
  
          }
          if(parseInt(end[2].substring(0,1))==0){
            endString=parseInt(end[2].substring(1,2))
          }else{
            endString=parseInt(end[2])
          }
          console.log(startString)
          var stDays
          console.log(startString==parseInt(daysInMonth[months.indexOf(start[1])]))
          if(startString==parseInt(daysInMonth[months.indexOf(start[1])])){
            stDays=1
          }else{
            console.log(sDays-startString)
            stDays=sDays-startString
          }
          console.log("stDays:"+stDays)
          const enDays=endString
          console.log("endays:"+enDays)
          var totalDays=enDays+stDays
          console.log("total days:"+totalDays)
          if(diffMonth>1){
            var index=endMonth-startMonth+1
            while(index<endMonth){
              console.log("totalDay:"+totalDays)
              totalDays=totalDays+daysInMonth[months.indexOf(months[index])]
              index++
            }
            console.log("nes totalDays"+totalDays)
            sessionStorage.setItem("noDays",totalDays)
           
            const total=totalDays
            res.json({success:true,days:totalDays})
            return total
          }else{
            console.log("HEREE@")
            res.json({success:true,days:totalDays})
          }
        }
  
        
  
      }
    }else{
  
      console.log("years dont match")
    }

  })
})
router.post("/get-payment-details",async(req,res)=>{
  const customers=await strip.charges.list({})
  console.log(customers)
customers.data.map(async(c)=>{
  console.log(Object.keys(c))
  console.log("\n\n")
  const time=new Date()
  time.setSeconds(c.created)
  const t=new Date(time)

  var app=await Application.find({$and:[{"datePaid":t}]})
  if(app[0]!=null){
    console.log(app)
  }
  
})
})

router.post("/update-session-url",async(req,res)=>{
  const id=req.body.application
  const url=req.body.url
  console.log(id,url)
  const update=await Application.updateOne({$and:[{"_id":id}]},{
    $set:{"paymentSessionUrl":url}
  })
  const a=await Application.find({$and:[{"_id":id}]})
  res.json({update:update,success:true,updatedUrl:a[0].paymentSessionUrl})

})
router.get("/switch",async(req,res)=>{
  const apps=await Application.find({$and:[{"datePaid":{$ne:null}}]})
  const charges=await strip.charges.list({})
  function find(date,charges){
    var value=false
    charges.data.map((c)=>{
      const time=new Date()
      const other=new Date()
      other.setMilliseconds(c.created)
     // console.log(other.toString().substring(0,15))
     // console.log(date.toString().substring(0,15))
      console.log("\n\n")
      if(date.toString().substring(0,15)==other.toString().substring(0,15) || other.toString().contains("Oct")){
        console.log("MATCH\n")
        console.log(date.toString())
        value=c
      }
      if(value!=false){
        return value
      }
    })
    setTimeout(()=>{
      return value
    },1500)
    
  }
  apps.map((a)=>{
    if(a.datePaid!=null){
      console.log("NEW:"+a.datePaid.toString()+"\n")
      const same=find(a.datePaid,charges)
      console.log("\n\nsame:",same)
    }
  })
  res.json(charges.data)
})




module.exports=router

/**
 *      axios.post("https://ghanahomerental.herokuapp.com/client-applications/setStatus/"+id+"/"+"PAYED").then((response1)=>{
              console.log(response1)
              if(response1.data.success){
                db.query("update ghanahomestay.applications set paymentSessionUrl=? where id=?",[response,id],(err2,response2)=>{
                  if(err2){
                    console.log(err2)
                  }else{
                    res.json({success:true,sessionUrl:response})
                  }
                })

              }
            })
 */

            /**
             * docker tag local-image:tagname new-repo:tagname
docker push new-repo:tagname
             */