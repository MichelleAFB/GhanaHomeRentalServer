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
const process=require("process");
const { Charge } = require("../../models/Charges");
const { default: Stripe } = require("stripe");
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

router.get("/create-charges",async(req,res)=>{
  const arr=[]
  const apps=await Application.find({$and:[{"paymentSessionUrl":{$ne:null}}]})
  const sessions=await strip.checkout.sessions.list({})
  //res.json(sessions)
  apps.map(async(a)=>{
    var s=sessions.data.filter((s)=>{
      if(a.url==s.url){
        return s
      }
    })
    console.log()
    if(s.length>0){
    console.log("\n\n")
    s=s[0]
    console.log(Object.keys(s))
    const intent=s.payment_intent
    var charge=await strip.charges.list({
      "payment_intent":intent
    })
    //console.log("\n\n")
    charge=charge.data[0]

    var time =new Date()
    time.setMilliseconds(charge.created)
    //const date= new Date(time.setMilliseconds())
    console.log(time)
    const newCharge=new Charge({
     chargeId:charge.id,
     application_Id:a._id,
     amount:charge.amount/100,
     receipt_url:charge.receipt_url,
     payment_intent:intent,
     payment_method:charge.payment_method,
     card:charge,
     created:time
    })

    //console.log(newCharge)
    try{
    const save=await newCharge.save()
    }catch(err){
      console.log(arr)
    }
    //console.log(newCharge)
    arr.push({charge:charge})
    }
    
  })

  setTimeout(()=>{
      res.json(arr)
  },1000)
})
//TODO after paying create charge

router.post("/create-charge",async(req,res)=>{
    const id=req.body.id
    console.log(req.body)
    var app=await Application.find({$and:[{"_id":id},{"paymentSessionUrl":{$ne:null}}]})
    console.log(app)
    app=app[0]
    if(app.paymentSessionUrl!=null){
      console.log("here")
      var sessions=await strip.checkout.sessions.list({})
     // console.log(sessions)
      var session=sessions.data.filter((a)=> {
       console.log(a)
        if(a.url==app.paymentSessionUrl){
        return a
      }})
      if(session.length>0){
        session=session

     // console.log(Object.keys(session))

      const intent=session.payment_intent
      var charge=await strip.charges.list({
        "payment_intent":intent
      })
      console.log("\n\n")
      charge=charge.data[0]
  
      var time =new Date()
      time.setMilliseconds(charge.created)
      //const date= new Date(time.setMilliseconds())
      const allCharges=await Charge.find({$and:[{"chargeId":charge.id}]})
      if(allCharges.length==0){
      console.log(time)
      try{
      const newCharge=new Charge({
       chargeId:charge.id,
       application_Id:app._id,
       amount:charge.amount/100,
       receipt_url:charge.receipt_url,
       payment_intent:intent,
       payment_method:charge.payment_method,
       card:charge,
       created:time
      })
  
      console.log(newCharge)
      const save=await newCharge.save()
      res.json({success:true,charge:save})
      arr.push({charge:charge})
      }catch(err){
        res.json({success:true,err:err})
      }
    }else{
      res.json({success:false,err:"charge already exists"})
    }
      
     /* var intent=session.payment_intent
      console.log("intent",intent)
      var charge=await strip.charges.retreive({
        payment_intent:intent
      })
      console.log("CHARGE:::",charge)
      */
    }
      
    }
})

router.get("/create-new-charge/:application_id/:payment_intent",async(req,res)=>{
  const arr=[]
  const apps=await Application.find({$and:[{"paymentSessionUrl":{$ne:null}}]})
  const sessions=await strip.checkout.sessions.list({})
  //res.json(sessions)
  apps.map(async(a)=>{
    var s=sessions.data.filter((s)=>{
      if(a.url==s.url){
        return s
      }
    })
    if(s.length>0){
    console.log("\n\n")
    s=s[0]
    const intent=s.payment_intent
    var charge=await strip.charges.list({
      "payment_intent":intent
    })
    console.log("\n\n")
    charge=charge.data[0]

    var time =new Date()
    time.setMilliseconds(charge.created)
    //const date= new Date(time.setMilliseconds())
    console.log(time)
    const newCharge=new Charge({
     chargeId:charge.id,
     application_Id:a._id,
     amount:charge.amount/100,
     receipt_url:charge.receipt_url,
     payment_intent:intent,
     payment_method:charge.payment_method,
     card:charge,
     created:time
    })

    console.log(newCharge)
    //const newCharge=await newCharge.save()
    //console.log(newCharge)
    arr.push({charge:charge})
    }
    
  })

  setTimeout(()=>{
      res.json(arr)
  },1000)
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