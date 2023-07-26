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

const { User } = require("../../models/User");
const {Application}=require("../../models/Application")
const {ApplicationOccupant}=require("../../models/ApplicationOccupant");
const{ ApplicationReviewImage }=require( "../../models/ApplicationReviewImages");
const{ApplicationGuest}=require("../../models/ApplicationGuests")


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




router.get("/", async(req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.json("Welcome to home stay ghana server : CLIENT APPLICATIONS");
});

//TODO:use count to avoid map errors


//first stages
//args:firstname,lastname,email,phone
const ad=[]
console.log(ad.hasOwnProperty('length'))
const add={child:[]}
console.log(add.child.hasOwnProperty("length"))

router.post("/",async(req,res)=>{

  
  console.logasync(req.body)
  const application =req.body
  const children=req.body.children
  const adults=req.body.adults
  console.logasync(req.body.adults.length)
  const st=req.body.startDate.split(" ")
  const ed=req.body.endDate.split(" ")
  const startDate=st[0]+" "+st[1]+" "+st[2]+" "+st[3]
  const endDate=ed[0]+" "+ed[1]+" "+ed[2]+" "+ed[3]
  console.logasync(req.body)
  var applicant
 
  if(adults.length>0){
    if(adults.length>1){
      adults.map((a)=>{
        if(a.association=="applicant"){
        applicant=a
        }
      })

    }
  
  }else{
    applicant=adults[0]
  }

  const prom=new Promise((resolve,reject)=>{
    //retrieve applicant info
    db.query("select * from ghanahomestay.users where firstname=? && lastname=? && email=?",[applicant.firstname,applicant.lastname,applicant.email],(err,results)=>{
      if(err){
        console.log(err)
      }
      if(results){
        console.log("found applicant")
        console.log(results)
        const user=results[0]
          const cDate=new Date()
          var aLength=0
          var cLength=0
          console.log(children==null)
       if(adults.hasOwnProperty("length")){
         aLength=adults.length
         console.log("lerngth true")

       }
       if(children!=null){
        if(children.hasOwnProperty("length")==true){
          cLength=children.length
        
        }
       }
          const currDate=cDate.toString().substring(0,15)
          console.log(currDate)
          var status="APPLIED"
          db.query("insert into ghanahomestay.applications (firstname,middlename,lastname,phone,email,stay_start_date,stay_end_date,no_adults,no_children,dateReceived,notify_admin_message) values (?,?,?,?,?,?,?,?,?,?,?)",[user.firstname,req.body.middleName,user.lastname,user.phone,user.email,startDate,endDate,aLength,cLength,currDate,status],(err1,results1)=>{
            if(err1){
              console.log(err1)
            }
            console.log(results1)
            console.log(results1.affectedRows)
            const prom1=new Promise((resolve1,reject1)=>{

              adults.forEach((a)=>{
                db.query("insert into ghanahomestay.application_occupants (firstname,lastname,age,email,association,application_id) values (?,?,?,?,?,?)",[a.firstname,a.lastname,a.age,a.email,a.association,results1.insertId],(err3,results3)=>{
                  if(err3){
                    console.log(err3)
                  }
                  console.log(results3)
                })
            })
            resolve1()
            })

            prom1.then(()=>{

                if(results1.affectedRows>0){
              db.query("select * from ghanahomestay.applications where email=? && firstname=? && lastname=? && phone=?",[user.email,user.firstname,user.lastname,user.phone],(err2,results2)=>{
                if(err2){
                  console.log(err2)
                }
                else{
                  
                  const prom2=new Promise((resolve2,reject2)=>{
                    if( children!=null){
                    if(children.length>1){
                      children.map((c)=>{
                        db.query("insert into ghanahomestay.application_occupants (firstname,lastname,age,association,application_id,child) values (?,?,?,?,?,1)",[c.firstname,c.lastname,c.age,c.association,results1.insertId],(err4,results4)=>{
                          console.log(results4)
                          if(err4){
                            console.log(err4) 
                          }
  
                        })
                      })
                    }
                    resolve2()
                  }
                  if(children!=null){
                    if(children.length==1){
                     const c=children[0]
                        db.query("insert into ghanahomestay.application_occupants (firstname,lastname,age,association,application_id,child) values (?,?,?,?,?,1)",[c.firstname,c.lastname,c.age,c.association,results1.insertId],(err4,results4)=>{
                          console.log(results4)
                          if(err4){
                            console.log(err4) 
                          }
  
                        })
                      
                    }
                    resolve2()
                  }if(children==null){
                    resolve2()
                  }
                  
                  })
                
                  prom2.then(()=>{
                    res.json({success:true,applications:results2})
                  }) 
                  
                }
              })
            }else{
              res.json({success:false})
            }
            
            })
           
          
          })
    
        
      }
    })
  })

})
router.post("/create-application",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");
  console.log(req.body)
  const application =req.body
  const children=req.body.children
  const adults=req.body.adults
  const st=req.body.startDate.split(" ")
  const ed=req.body.endDate.split(" ")
  const startDate=st[0]+" "+st[1]+" "+st[2]+" "+st[3]
  const endDate=ed[0]+" "+ed[1]+" "+ed[2]+" "+ed[3]
  const rooms=req.body.rooms
  console.log(adults)


 //console.logasync(req.body)
 console.log(adults)
  const applicant={firstname:req.body.firstname,middlename:req.body.middlename,lastname:req.body.lastname,email:req.body.email}
 

  const prom=new Promise(async(resolve,reject)=>{


    //const applicant=adults[0]
    console.log("applicant")
    console.log(applicant)
    const use= await User.find({
     $and:[
       {"email":applicant.email}
     ]
    })
    var user={firstname:req.body.firstname,middlename:req.body.middleName,lastname:req.body.lastname,email:req.body.email}
   

    console.log("\n\n\n\n user")
    console.log(user)
    if(user!=null){
      console.log("user not null")
      console.log("found applicant")
     
        const cDate=new Date()
        const currDate=cDate.toString().substring(0,15)
        var aLength=0
        var cLength=0
        console.log(children==null)
     if(adults.length>0){
       aLength=adults.length
       console.log("lerngth true")

     }
     if(children!=null){
      if(children.hasOwnProperty("length")==true){
        cLength=children.length
      }
    }
    var start=req.body.startDate.toString()
    var end=req.body.endDate.toString()
    const application=new Application({
      firstname:user.firstname,
      middlename:user.middlename,
      lastname:user.lastname,
      phone:user.phone,
      email:user.email,
      stay_start_date:start.substring(0,15),
      stay_end_date:end.substring(0,15),
      no_adults:aLength,
      no_children:cLength,
      dateReceived:currDate,
      notify_admin_message:"",
      no_occupants:cLength+aLength,
      notify_applicant:0,
      notify_admin:1,
      application_status:"APPLIED",
      approved:0,
      dateApproved:"",
      confirmedApproved:0,
      dateReserved:"",
      dateDenied:"",
      datePaymentDue:"",
      notify_admin_message:"",
      notify_applicant_message:"",
      datePaid:"",
      currentlyOccupied:0,
      checkoutTimeout:"",
      review:"",
      paymentSessionUrl:"",
      checkedIn:"",
      timeCheckedIn:"",
      roomOne:rooms.roomOne,
      roomTwo:rooms.roomTwo,
      roomThree:rooms.roomThree,
      fullSuite:rooms.fullSuite
    })
    const saved=await application.save()
    var adultSaved
    var childSaved
    adults.map(async(o)=>{

     const adult=new ApplicationOccupant({
        firstname:o.firstname,
        lastname:o.lastname,
        age:o.age,
        association:o.association,
        application_id:saved.id,
        email:o.email,
        child:0
      })
    adultSaved=await adult.save()
    })
    if(cLength>0){
      children.map(async(o)=>{
        const child=new ApplicationOccupant({
          firstname:o.firstname,
          lastname:o.lastname,
          age:o.age,
          association:o.association,
          application_id:saved.id,
          email:o.email,
          child:1
        })
       childSaved=await child.save()
      })
    }
  setTimeout(()=>{
   res.json({success:true,application:application})
  },800)
  }else{
    res.json({success:false,message:"no account found"})
  }
  })
})

router.get("/getRoomAvailability",(req,res)=>{
  const start=req.body.startDate
  const end=req.body.endDate
})

//get number of days
router.get("/getNoDays/:id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  const app=await Application.find({$and:[{"_id":req.params.id}]})
    const application=app[0]
    if(application!=null){
    console.log("start:"+application.stay_start_date)
    console.log("end:"+application.stay_end_date)
    const s=application.stay_start_date.toString()
    const e=application.stay_end_date.toString()
    const start=s.split(" ")
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
  }else{
    res.json({success:false,message:"app "+req.params.id+" does not exist"})
  }

  
})

  


    //retrieve applicant info
   /* db.query("select * from ghanahomestay.users where firstname=? && lastname=? && email=?",[applicant.firstname,applicant.lastname,applicant.email],(err,results)=>{
      if(err){
        console.log(err)
      }
      if(results){
        console.log("found applicant")
        console.log(results)
        const user=results[0]
          const cDate=new Date()
          var aLength=0
          var cLength=0
          console.log(children==null)
       if(adults.hasOwnProperty("length")){
         aLength=adults.length
         console.log("lerngth true")

       }
       if(children!=null){
        if(children.hasOwnProperty("length")==true){
          cLength=children.length
        
        }
       }
          const currDate=cDate.toString().substring(0,15)
          console.log(currDate)
          var status="New Application"
          db.query("insert into ghanahomestay.applications (firstname,middlename,lastname,phone,email,stay_start_date,stay_end_date,no_adults,no_children,dateReceived,notify_admin_message) values (?,?,?,?,?,?,?,?,?,?,?)",[user.firstname,req.body.middleName,user.lastname,user.phone,user.email,startDate,endDate,aLength,cLength,currDate,status],(err1,results1)=>{
            if(err1){
              console.log(err1)
            }
            console.log(results1)
            console.log(results1.affectedRows)
            const prom1=new Promise((resolve1,reject1)=>{

              adults.forEach((a)=>{
                db.query("insert into ghanahomestay.application_occupants (firstname,lastname,age,email,association,application_id) values (?,?,?,?,?,?)",[a.firstname,a.lastname,a.age,a.email,a.association,results1.insertId],(err3,results3)=>{
                  if(err3){
                    console.log(err3)
                  }
                  console.log(results3)
                })
            })
            resolve1()
            })

            prom1.then(()=>{

                if(results1.affectedRows>0){
              db.query("select * from ghanahomestay.applications where email=? && firstname=? && lastname=? && phone=?",[user.email,user.firstname,user.lastname,user.phone],(err2,results2)=>{
                if(err2){
                  console.log(err2)
                }
                else{
                  
                  const prom2=new Promise((resolve2,reject2)=>{
                    if( children!=null){
                    if(children.length>1){
                      children.map((c)=>{
                        db.query("insert into ghanahomestay.application_occupants (firstname,lastname,age,association,application_id,child) values (?,?,?,?,?,1)",[c.firstname,c.lastname,c.age,c.association,results1.insertId],(err4,results4)=>{
                          console.log(results4)
                          if(err4){
                            console.log(err4) 
                          }
  
                        })
                      })
                    }
                    resolve2()
                  }
                  if(children!=null){
                    if(children.length==1){
                     const c=children[0]
                        db.query("insert into ghanahomestay.application_occupants (firstname,lastname,age,association,application_id,child) values (?,?,?,?,?,1)",[c.firstname,c.lastname,c.age,c.association,results1.insertId],(err4,results4)=>{
                          console.log(results4)
                          if(err4){
                            console.log(err4) 
                          }
  
                        })
                      
                    }
                    resolve2()
                  }if(children==null){
                    resolve2()
                  }
                  
                  })
                
                  prom2.then(()=>{
                    res.json({success:true,applications:results2})
                  }) 
                  
                }
              })
            }else{
              res.json({success:false})
            }
            
            })
           
          
          })
    
        
      }
    })
    */
  
 




//get all client applications
router.get("/get-all-applications/:firstname/:lastname/:email",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

   
   const prom=new Promise(async(resolve,reject)=>{
const apps=[]
  const applications=await Application.find({
      $and:[
        {"firstname":req.params.firstname},
        {"email":req.params.email},
        {"lastname":req.params.lastname}
      ]
  })
  var i=0
  applications.map(async(r)=>{
    const occ= await ApplicationOccupant.find({
      $and:[{"application_id":r.id}]
    })
    apps.push({application:r,occupants:occ})
    i++
    console.log(i)
    if(i>=applications.length){
      res.json({success:true,applications:apps,no_applications:apps})
    }
   
  })

   })
})



router.get("/application/:id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  console.log("getting application"+ "\n\n")
  console.logasync(req.params.id)
  const app=await Application.find({$and:[{"_id":req.params.id}]})
  const occupants=await ApplicationOccupant.find({$and:[{"application_id":req.params.id}]})
  if(app!=null && occupants!=null){
    res.json({application:app[0],occupants:occupants})

  }else{
    res.json({success:false,message:"app "+req.params.id+" does not exist"})
  }


})

/*
router.get("/getActiveStatus/:id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");


  db.query("select count(*) as appCount from ghanahomestay.applications where id=?",req.params.id,(err,results)=>{
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
})
*/

router.get("/active",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");
  const apps=await Application.find({})

  apps.map((a)=>{
    console.log(a)
    axios.get("https://ghanahomestayserver.onrender.com/client-applications/getActiveStatus/"+a._id).then((response)=>{
      console.log(response)
    })
  })
})
/*

router.get("/getActiveStatus/:id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");
  
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
            if(app.currentlyOccupied==1 && app.application_status=="CONFIRMED"){
            
              console.log("ALREADY SET")
              res.json({success:true,currentlyOccupied:true})
            }if((app.currentlyOccupied!=1 && (activeDate>=startDate && activeDate<endDate) ) && app.application_status=="CONFIRMED"){
              console.log(app.stay_start_date+" "+activeDate.toString().substring(0,15))
              console.log("ACTIVED")
             /* const updated=await Application.updateOne(
                {"_id":req.params.id}
                ,{
                  $set:{
                    "currentlyOccupied":1
                  }
                })
                console.log(updated)
                if(updated.acknowledged){
                  res.json({success:true,currentlyOccupied:true})
                }
                
          
              
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
  
})
*/
/*
router.post("/release-reservation-due-to-unpaid/:id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");


  db.query("select count(*) as appCount from ghanahomestay.applications where id=?",req.params.id,(err,results)=>{
    if(err){
      console.log(err)
    }else{
      const appCount=Object.values(JSON.parse(JSON.stringify(results)))
      const count=appCount[0].appCount
     console.log(count)
     
     if(count>0){
      axios.get("https://ghanahomerental.herokuapp.com/admin-applications/checkPaymentDeadline/"+req.params.id).then((response)=>{
        console.log(response.data)
        console.log(response.data.success==true&& response.data.hasDueDate==true && response.data.passedDue==true)
        if(response.data.success && response.data.hasDueDate && response.data.passedDue ){

          //change application status
        
            

                
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
  
})
*/
router.get("/activity",async(req,res)=>{
  const applications=await Application.find({})
  const apps=[]
  applications.map((a)=>{
    axios.get("https://ghanahomestayserver.onrender.com/client-applications/activeStatus/"+a._id).then((response)=>{
      console.log(response)
      apps.push({app:a,data:response.data})
    })
  })
  setTimeout(()=>{
    res.json(apps)
  },2000)

})

router.get("/checkAllActive",async(req,res)=>{
  const applications=await Application.find({})
  const apps=[]
  applications.map((a)=>{
    axios.get("https://ghanahomestayserver.onrender.com/client-applications/getActiveStatus/"+a._id).then((response)=>{
    apps.push({response:response.data,date:a.stay_start_date+" "+a.stay_end_date})
    })
  })
  setTimeout(()=>{
    res.json({apps})
  },1000)
})

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
                 axios.post("https://ghanahomestayserver.onrender.com/admin-applications/setStatus/"+app._id+"/CHECKEDOUT/",{message:"Occupants might have forgotten to checkout. Updated application status to checkedout on "+currDate}).then((response)=>{
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

                    axios.post("https://ghanahomestayserver.onrender.com/admin-applications/setStatus/"+app._id+"/CHECKEDOUT/",{message:"Occupants might have forgotten to checkout. Updated application status to checkedout on "+currDate}).then((response)=>{
                      console.log(response.data)
                      if(response.data.success){
                        console.log(app.stay_start_date+" changed to checkout by force")
                        res.json({success:true,currentlyOccupied:false})
                      }else{
                       res.json({success:false,message:"could not change status"})
                      }
                    })
                  }catch(error){
                    console.log(err)
                  }
               
                }else if(cDate>endDate && app.application_status=="CONFIRMED"){
                  console.log("fix currentlyOccupied")
                  console.log(app)
                  const update=await Application.updateOne(
                    {"_id":req.params.id},{
                      $set:[
                        {"currentlyOccupied":0}
                      ]
                    })
                    
                    axios.post("https://ghanahomestayserver.onrender.com/admin-applications/setStatus/"+app._id+"/CHECKEDOUT",{message:"Applicants checked out at "+ cDate}).then((response)=>{
                      console.log(response)
                      if(response.data.success){
                        res.json({success:true,currentlyOccupied:false})
                      }
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
  axios.get("https://ghanahomestayserver.onrender.com/admin-applications/checkPayementDeadline/"+req.params.id).then(async(response)=>{
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

})


//TODO:ADD MORE STATUSES
//TODO: fix can send response after sender
//Client can only set certain status from their end APPLIED,PAID
//admin can set APPROVED and RESERVED



router.post("/setStatus/:id/:status",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  if(req.params.status!="APPLIED"&& req.body.message==null){
    res.json({success:false,message:"setting status for statuses other than 'APPLIED' must include a notification message "})
}else{
    if(req.params.status=="RESERVED"){
      var currDate=new Date()
      currDate=currDate.toString().substring(0,15)
      axios.get("https://ghanahomestayserver.onrender.com/admin-applications/newGetPaymentDueDate").then(async(response)=>{
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
            "notify_admin":1,
            "notify_admin_message":req.body.message,
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
    else  if(req.params.status=="PAYED"){
      var currDate=new Date()
      currDate=currDate.toString().substring(0,15)
      
        const application=await Application.updateOne(
          {"_id":req.params.id},
          {$set:{
            "application_status":req.params.status,
            "notify_admin":1,
            "notify_admin_message":req.body.message,
            "datePaid":currDate,
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
    else  if(req.params.status=="PAYEDANDAPPROVED"){
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
        if(application.acknowledged==true){
          res.json({success:true,no_applications:application.matchedCount,application:updatedApp})
        }else{
          res.json({success:false,no_applications:0})
        }
      
    }
    else if(req.params.status=="CHECKEDOUT"){
      var currDate=new Date()
      currDate=currDate.toString().substring(0,15)
      const application=await Application.updateOne({"_id":req.params.id},{
        $set:{
          "application_status":req.params.status,
          "notify_admin":1,
          "notify_admin_message":req.body.message,
          "checkoutTime":new Date(),
          "currentlyOccupied":0
        }
      })
     
      const updatedApp=await Application.find({$and:[{"_id":req.params.id}]})
      console.log(application)
      if(application.acknowledged==true){
        res.json({success:true,no_applications:application.matchedCount,application:updatedApp})
      }else{
        res.json({success:false,no_applications:0})
      }
    

    }
    if(req.params.status=="CHECKEDIN"){
      const currDate=new Date()
      const timeCheckedIn=currDate.toTimeString()
      const day=currDate.toString().substring(0,15)
      const checkin=timeCheckedIn +" "+day
      console.log(checkin)
      const updated=await Application.updateOne(
        {"_id":req.params.id},
        {$set:
          {"application_status":req.params.status,
          "notify_admin":1,
          "notify_admin_message":req.body.message,
          "checkinTime":checkin
        }
        }
      )
      console.log(updated)
      if(updated.acknowledged){
        var application=await Application.find({$and:[{"_id":req.params.id}]})
        application=application[0]
        console.log(application)
        res.json({success:true,application:application})

      }else{
        res.json({success:false,no_applications:0})

      }

    }
   
  }

})

router.get("/application/:id",async(req,res)=>{
  console.logasync(req.params.id)
  var app=await Application.find({$and:[{"id":req.params.id}]})
  console.log(app)
  var appUpdated=await Application.find({$and:[{"id":req.params.id}]})
  res.json({success:true,application:appUpdated})
})

//turns off notify_applicant after application has seen notification update
router.post("/turnOffNotifyApplicant/:id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");
  var app=await Application.find({$and:[{"_id":req.params.id}]})
  app=app[0]
  if(app!=null){
    if(app.notify_applicant==0){
      res.json({success:true,no_applications:0})
    }else{
      const updated=await Application.update({"_id":req.params.id},{
        $set:{"notify_applicant":0}
      })
      if(updated.acknowledged==true){
        res.json({success:true,no_applications:1})
      }else{
        res.json({success:false,no_applications:0})
      }
    }
  }
/*
  db.query("select count(*) as appCount from ghanahomestay.applications where id=?",req.params.id,(err,results)=>{
    const appCount=Object.values(JSON.parse(JSON.stringify(results)))
    const count=appCount[0].appCount
    console.log(count)
    if(count>0){
      db.query("update ghanahomestay.applications set notify_applicant=0 where id=?",[req.params.id],(err1,results1)=>{
        if(err1){
          console.log(err1)
        }
        console.log(results1.affectedRows)
        if(results1.affectedRows==count){
          res.json({success:true,no_applications:results1.affectRows})
        }
        if(results1.affectedRows!=count){
          res.json({success:false,no_applications:count})
        }
      })
    }

  })
*/
})

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
  booked_dates.push({application_id:req.params.id,date:startDate.toString().substring(0,15)})

  while(nextDate.toString().substring(0,15)!=endDate.toString().substring(0,15)){
    var nextnext=nextDate.setDate(nextDate.getDate()+1)
    nextDate=new Date(nextnext)
    booked_dates.push({application_id:req.params.id,date:nextDate.toString().substring(0,15)})  
    index++
  }
  console.log(booked_dates)
  res.json({success:true,booked_dates:booked_dates,no_days:index})
}else{
  res.json({success:false,message:"application "+req.params.id+" does not exist"})
}

 
})


//calulate all booked dates for an application
router.get("/allBookingDatesForApplication/:id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  db.query("select count(*) as appCount from ghanahomestay.applications where id=?",req.params.id,(err,results)=>{
    if(err){
        console.log(err)
        res.json({success:false,error:err})
    }else{
      const appCount=Object.values(JSON.parse(JSON.stringify(results)))
      const count=appCount[0].appCount
      console.log(count)
      if(count>0){
        db.query("select * from ghanahomestay.applications where id=?",req.params.id,(err1,results1)=>{
          if(err1){
            console.log(err1)
            res,json({success:false,error:err1})
          }else{
            const app=results1[0]
            var months= ["Jan","Feb","Mar","Apr","May","Jun","Jul",
            "Aug","Sep","Oct","Nov","Dec"];
            var monthnum=["01","02","03","04","05","06","07","08","09","10","11","12"]
            var cDate=new Date()
            console.log(app)
            var index=1
            console.log(cDate)
            var st=app.stay_start_date.split(" ")
            var et=app.stay_end_date.split(" ")
           
           const booked_dates=[]
           
            const startDate=new Date(st[3],monthnum[months.indexOf(st[1])-1],st[2])
            const endDate=new Date(et[3],monthnum[months.indexOf(et[1])-1],et[2])
            var nextDate=new Date(startDate);
            booked_dates.push({application_id:req.params.id,date:startDate.toString().substring(0,15)})

            while(nextDate.toString().substring(0,15)!=endDate.toString().substring(0,15)){
              var nextnext=nextDate.setDate(nextDate.getDate()+1)
              nextDate=new Date(nextnext)
              console.log((nextDate.toString().substring(0,15)))
              booked_dates.push({application_id:req.params.id,date:nextDate.toString().substring(0,15)})  
              index++
            }
            console.log(booked_dates)
            res.json({success:true,booked_dates:booked_dates,no_days:index-1})
          }
        })

      }else{
        res.json({success:false,message:"application "+req.params.id+" does not exist"})
      }

    }
  })
})

/********************************************GUESTS************************ */
/*
router.get("/guests/:id",async(req,res)=>{
  const id=req.params.id

  const guests=[]

  const prom=new Promise((resolve,reject)=>{
    db.query("select * from ghanahomestay.application_occupants where application_id=?",id,(err,results)=>{
      if(err){
        console.log(err)
      }else{
        results.map((r)=>{
            db.query("select count(*) as appCount from ghanahomestay.application_guests where occupant_id=?",r.id,(err1,results1)=>{
              if(err1){
                console.log(err1)
              }else{
                console.log()
                const appCount=Object.values(JSON.parse(JSON.stringify(results1)))
                 const count=appCount[0].appCount
                 console.log(count)
                 if(count<1){
                  guests.push({occupant:r,guests:[]})
                 }else{
                  db.query("select * from ghanahomestay.application_guests where occupant_id=?",r.id,(err2,results2)=>{
                    if(err2){
                      console.log(err2)
                    }else{
                      guests.push({occupant:r,guests:results2})
                    }
                  })
                 }
              }

            })
        })

        resolve()

      }
    })

  })

  prom.then(()=>{
    res.json({success:true,guests:guests})

  })
})
*/

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
/*
router.get("/guests/:id/:occupant_id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  const id=req.params.id
  const occupant_id=req.params.occupant_id
  //const guests=req.body.guests
  console.log(occupant_id)
  var guests=[]
  const prom=new Promise((resolve,reject)=>{
    db.query("select count(*) as appCount from ghanahomestay.application_occupants where application_id=? && id=?",[id,occupant_id],(err,results)=>{
      if(err){
        console.log(err)
      }else{
        const appCount=Object.values(JSON.parse(JSON.stringify(results)))
        const count=appCount[0].appCount
        console.log(count)
        if(count>0){
          console.log("guests")
          db.query("select count(*) as appCount from ghanahomestay.application_guests where occupant_id=?",occupant_id,(err1,results1)=>{
            if(err1){
              console.log(err1)
            }else{
              const appCount1=Object.values(JSON.parse(JSON.stringify(results1)))
              const count1=appCount1[0].appCount
              console.log("\n\n\n"+count1)
              if(count1<1){
                res.json({success:true,guests:[],no_guests:0})
              }else{
                db.query("select * from ghanahomestay.application_guests where occupant_id=?",occupant_id,(err2,results2)=>{
                  res.json({success:true,guests:results2,no_guests:count1})
                })
              }
              
            }
          })

        }else{
          res.json({success:false,message:"no occupants with id "+occupant_id})
        }
        

        resolve()

      }
    })
  })

  prom.then(()=>{
   // res.json({success:true,guests:[],no_guests:0})

  })
})
*/


router.get("/get-all-reviews",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");



  const reviews=[]

  
 var images
 const allReviews=[]

  const prom=new Promise(async(resolve,reject)=>{

    const reviews=[]
    const review_img=await ApplicationReviewImage.find({})

    review_img.map(async(r)=>{
      var app=await Application.find({$and:[{"_id":r.application_id}]})
       app=app[0]
       
       //console.log(app._id.toString())
       //console.log(r.application_id+"\n")
      
       
       const value=JSON.parse(JSON.stringify(app.application_status))
      

      if(!reviews.includes(r.application_id ) && (value=='CHECKEDOUT' || value=="CHECKEDOUT" )){
      
        reviews.push(r.application_id)
      }
    })
    
   

   
    setTimeout(()=>{
      console.log(reviews)
      const our_reviews=[]
      console.log(reviews)
      reviews.map((i)=>{
        images=[]
        review_img.map(async(r)=>{
          const v=JSON.parse(JSON.stringify(r.application_id))
          console.log(typeof(r.application_id))
          console.log(typeof(i))
          
          if(r.application_id==i){
            images.push(r)
          }
        })
        our_reviews.push({application_id:i,images:images})
      })
      
      setTimeout(()=>{
        res.json({success:true,reviews:our_reviews,no_reviews:our_reviews.length})

      },200)
    },500)
  
    /*db.query("select * from ghanahomestay.application_review_images",(err,results)=>{
      if(err){
        console.log(err)
      }else{
         images=results;

        results.map((r)=>{
          console.log(results.length)
          console.log(!reviews.includes(r.application_id))
          if(!reviews.includes(r.application_id)){
            reviews.push(r.application_id)
          
          }
        })

        setTimeout(()=>{
            resolve()
        },500)
      }
    })
 })

  prom.then(()=>{
    console.log(reviews)

    const prom1=new Promise((resolve1,reject1)=>{
      var i=0
      reviews.map((m)=>{
        allReviews[i]={application_id:m,images:[]}
        images.map((im)=>{
          if(im.application_id==m){
            allReviews[i].images.push(im)
            console.log(allReviews)
          }
        })
        i++
      })
      setTimeout(()=>{
          resolve1()
      },500)
    })
   const newReviews=[]
    prom1.then(()=>{
      //res.json(allReviews)
      var index=0
      const prom2=new Promise((resolve2,reject2)=>{
        allReviews.map((r)=>{
          console.log(r)
          //console.log(r.application_id)
          db.query("select * from ghanahomestay.applications where id=?",r.application_id,(err1,results1)=>{
            if(err1){
              res.json({success:false,err:err1})
            }
            else{
            
             // allReviews[index].application=results1
              newReviews[index]={reviews:allReviews[index]}
            }
          })
          index++
        })
        setTimeout(()=>{
            resolve2(newReviews)
        },1000)

      })

      prom2.then(()=>{
          res.json({success:true,reviews:allReviews})
      })

    })
    */

  })
})
module.exports=router