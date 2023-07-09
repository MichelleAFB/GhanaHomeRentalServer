const strip=require('stripe')("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")
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



router.get("/",(req,res)=>{
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
        return session.url
       }catch(error){
          console.log(error)
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
            "datePaid":currDate,
            "paymentSessionUrl":response,

          }
        }
      )
      if(updated.acknowledged==true){
        res.json({success:true,url:response})
      }
    }else{
        res.json({success:false,message:"error"})
      }
     /* db.query("update ghanahomestay.applications set datePaid=?, paymentSessionUrl=? where id=? ",[currDate,response,req.params.id],(err,results)=>{
        if(err){
          console.log(err)
        }else{
            res.json({success:true,url:response})
        }
      })
      */
    })
  }).catch(()=>{
    //res.json({success:false})
  })
})


router.get("/checkPaymentDue/:id",(req,res)=>{
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

//help:'/approve-booking
//calulates an array of all dates a reservation takes up
router.get("/calculate-all-booked-dates/:id",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");


  var appExist
const promise=new Promise((resolvePromise,rejectPromise)=>{

  db.query("select count(*) as appCount from ghanahomestay.applications where id=?",req.params.id,(err,results)=>{
    if(err){
      console.log(err)
    }
    const appCount=Object.values(JSON.parse(JSON.stringify(results)))
    const count=appCount[0].appCount
    console.log()
   console.log(count)
   if(count<1){
    appExist=false
    resolvePromise()
   }else{
    appExist=true
    resolvePromise()
   }
  })
})
  

promise.then(()=>{

  if(appExist){
    db.query("select* from ghanahomestay.applications where id=?",req.params.id,(err,results)=>{
      if(err){
        console.log(err)
      }
      else{
        const application=results[0]
        db.query("select * from ghanahomestay.applications where id !=?",application.id,(err1,results1)=>{
          if(err1){
            console.log(err1)
          }else{
            var iday
            if(results1!=null){
              const dates=[]
              const days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
              var daysInMonth=[31,28,31,30,31,30,31,31,30,31,30,31]
              var months= ["Jan","Feb","Mar","Apr","May","Jun","Jul",
              "Aug","Sep","Oct","Nov","Dec"];
                const prom=new Promise((resolve,reject)=>{
                  const sdate=application.stay_start_date.split(" ")
                  const edate=application.stay_end_date.split(" ")
                  console.log(sdate)
                  console.log(edate)
                  var index=parseInt(sdate[2]) //index for day number
                   iday=days.indexOf(sdate[0]) //index for weekday number
                  var idaysInMonth=months.indexOf(sdate[1].toString())
  
                  console.log(iday)
                  if(edate[1]==sdate[1]){
                    while(index<=parseInt(edate[2])){
                      if(index>10){
                        dates.push({application_id:req.params.id,date:days[iday]+" "+ sdate[1]+ " "+index+" "+ sdate[3]})
                    }else{
                      dates.push({application_id:req.params.id,date:days[iday]+" "+ sdate[1]+ " 0"+index+" "+ sdate[3]})
  
                    }
                      index++
                      iday++;
                      if(iday==(days.length)){
                        iday=0;
                      }
                    }
                  }else{
                    //different months
                    console.log(days[iday]+" "+ sdate[1]+" "+index+" "+sdate[3])
                    console.log(parseInt(index)+" "+daysInMonth[idaysInMonth])
                    while(parseInt(index)<=daysInMonth[idaysInMonth]){
                      dates.push({application_id:req.params.id,date:days[iday]+" "+ sdate[1]+" "+index+" "+sdate[3]})
                      console.log(iday)
                      iday=iday+1;
                      index=index+1;
                      console.log("hereee"+ iday+ " "+days[iday])
                      if(iday==days.length){
                        iday=0
                      }
                    }
  
                    var diffMonth=months.indexOf(edate[1])-months.indexOf(sdate[1])
                    if(diffMonth==1){
                       index=1 //index for day number
                       //iday=days.indexOf(edate[0])
                        //index for weekday number
                        console.log("\n\n"+edate[0])
                        console.log("iday"+iday)
                        console.log("\n\nIday"+days[iday])
                        console.log('edate '+ days.indexOf(edate[0])+"\n\n")
                       idaysInMonth=months.indexOf(edate[1].toString())
  
                       while(index<=parseInt(edate[2])){
                        if(index>10){
                          dates.push({application_id:req.params.id,date:days[nextDay]+" "+edate[1]+" "+index+" "+edate[3]})
                          
                        }else{
                          dates.push({application_id:req.params.id,date:days[iday]+" "+edate[1]+" 0"+index+" "+edate[3]})
  
                        }
                        index++
                        iday++
                        if(iday==days.length){
                          iday=0
                        }
                       }  
                       console.log(dates)
                    }
                    if(diffMonth>1){
                      console.log("multiple months")
                      var currMonth=months.indexOf(sdate[1])+1
                      console.log(dates[dates.length-1])
                      var currDate=dates[dates.length-1].date.split(" ")
                      var wkday=currDate[0]
                      var currWDIndex=days.indexOf(wkday)+1
                      console.log("pickup last weekday"+currDate)
                      index=1
                      while(currMonth<months.indexOf(edate[1])+1){
                        console.log("currMonth:"+currMonth)
                        console.log("eMonth:"+months.indexOf(edate[1]))
                        while(index<=daysInMonth[currMonth]){
                          if(index<10){
                            dates.push({application_id:req.params.id,date:days[currWDIndex]+ " "+months[currMonth]+ " 0"+index+" "+sdate[3]})
                          }else{
                            dates.push({application_id:req.params.id,date:days[currWDIndex]+ " "+months[currMonth]+ " "+index+" "+sdate[3]})
                          }
                          index++;
                          currWDIndex++
                          if(currWDIndex==days.length){
                            currWDIndex=0
                          }
                        }
                        currMonth++
                        index=1
                      }
  
                      index=1 //index for day number
                      iday=days.indexOf(edate[0]) //index for weekday number
                      idaysInMonth=months.indexOf(edate[1].toString())
  
                      while(index<=parseInt(edate[2])){
                       if(index>9){
                         dates.push({application_id:req.params.id,date:days[iday]+" "+edate[1]+" "+index+" "+edate[3]})
                         
                       }else{
                         dates.push({application_id:req.params.id,date:days[iday]+" "+edate[1]+" 0"+index+" "+edate[3]})
  
                       }
                       index++
                       iday++
                       if(iday==days.length){
                         iday=0
                       }
                      }  
                      console.log(dates)
                      
                    }
                    
                
                  }
                  resolve()
                })
  
                prom.then(()=>{
                  res.json({success:true,booked_dates:dates})
                })
            }
          }
        })
      }
    })
  }else{
   // res.json({success:false,message:"no application "+req.params.id+" exist"})
  }


})

 

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