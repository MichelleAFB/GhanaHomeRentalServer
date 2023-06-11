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

router.use(bodyParser.json());
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





router.get("/", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.json("Welcome to home stay ghana server : ADMIN APPLICATIONS");
});

router.get("/application/:id",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  db.query("select * from ghanahomestay.applications where id=?",req.params.id,(err,results)=>{
    res.json({success:true,application:results})
  })
})


//get all client applications for client
router.get("/get-all-applications/:firstname/:lastname/:email",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  console.log("get all apps")
  console.log(req.params)
   const applications=[]
  const prom=new Promise((resolve,reject)=>{

    db.query("select count(*) as appCount from ghanahomestay.applications where firstname=? && lastname =? && email=?",[req.params.firstname,req.params.lastname,req.params.email],(errCount,resultsCount)=>{

      const appCount=Object.values(JSON.parse(JSON.stringify(resultsCount)))
      const count=appCount[0].appCount
      console.log(count)
      if(count>0){
  
        db.query("select * from ghanahomestay.applications where firstname=? && lastname =? && email=?",[req.params.firstname,req.params.lastname,req.params.email],(err,results)=>{
          if(err){
            console.log(err)
          }
          
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
          },1000)
        
        })
       
      }
    })
  })

  prom.then(()=>{
    console.log(applications)
    console.log("here")
    res.json({success:true,no_applications:applications.length,applications:applications})

  })

})
//retreieve all applications
router.get("/applications",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");
  const apps=[]
  const applications=await Application.find({})
  var i=0
  applications.map(async(a)=>{
    const occupants=await ApplicationOccupant.find({
      $and:[
       { "application_id":a._id}
      ]
    })
    apps.push({application:a,occupants:occupants})
    i++
    if(i==applications.length-1){
      res.json({success:true,applications:apps,no_applications:applications.length})
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

router.post("/setStatus/:id/:status",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  if(req.params.status!="APPLIED"&& req.body.message==null){
    res.json({success:false,message:"setting status for statuses other than 'APPLIED' must include a notification message "})
}else{
    const application=await Application.updateOne(
      {"id":req.params.id},
      {$set:{
        "application_status":req.params.status,
        "notify_applicant":1,
        "notify_applicant_message":req.body.message
      }}
    )
    if(application.acknowledged==true){
      res.json({success:true,no_applications:application.matchedCount})
    }else{
      res.json({success:false,no_applications:0})
    }
  }
/*
  db.query("select count(*) as appCount from ghanahomestay.applications where id=?",req.params.id,(err,results)=>{
    const appCount=Object.values(JSON.parse(JSON.stringify(results)))
    const count=appCount[0].appCount
    console.log(count)
    
    if(count>0){
      if( req.body.message!=null){
        var cDate=new Date()
        const currDate=cDate.toString().substring(0,15)
      db.query("update ghanahomestay.applications set application_status=?,notify_applicant=1,notify_applicant_message=? where id=?",[req.params.status,req.body.message,req.params.id],(err1,results1)=>{
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
    if(req.params.status!="APPLIED"&& req.body.message==null){
      res.json({success:false,message:"setting status for statuses other than 'APPLIED' must include a notification message "})
  }
  
    }else{
      res.json({success:false,message:"application "+req.params.id+" does not exist"})
    }

  })
  */
})

/********************************************************************************************************************** */
router.get("/checkAvailability/:id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");


  const applicationBooked=await BookedDate.find({$and:[{"application_id":req.params.id}]})
  console.log(applicationBooked)
  
    var available=true
    const conflicting_dates=[]
    const prom= new Promise((resolve,reject)=>{
      axios.get("http://localhost:3012/admin-applications/allBookingDatesForApplication/"+req.params.id).then(async(response)=>{
            console.log(response.data)
            console.log("gere")
            const booked_dates=response.data.booked_dates
            const alldates=await BookedDate.find({})
            if(alldates.length>0){
              alldates.map((date)=>{
                  
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

    prom.then(async()=>{
         
      //TODO:NOW CHECK TO SE IF PAYED
        const payedApp=await Application.find({$or:[
          {$and:[{"application_status":"PAYED","id":req.params.id}]},
          {$and:[{"datePaid":!null,"id":req.params.id}]}
        ]})
        console.log(payedApp)
        if(payedApp!=null){
            res.json({success:true,paid:true,conflicting_dates:conflicting_dates})   
        }else{
           res.json({success:true,paid:false,conflicting_dates:conflicting_dates})
        }
      })
    
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
   console.log("aarrLength checkAvailability:"+count)
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







router.post("/deny-booking/:id",(req,res)=>{
  /**Unsets confirmedApprove and approve to -1 */
  res.setHeader("Access-Control-Allow-Origin", "*");

  db.query("select count(*) as appCount from ghanahomestay.applications where id=? ",req.params.id,(err,results)=>{
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
})
//helper to cancel bookings
router.post("/remove-booked-dates/:id",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  db.query("select count(*) as appCount from ghanahomstay.applications where id=?",req.params.id,(err1,results1)=>{
  
    
    if(err1){
      console.log("err\n\n")
      console.log(err1)
    }else{
      console.log("here"+results1)
      const appCount=Object.values(JSON.parse(JSON.stringify(results1)))
      console.log("here:"+appCount)
      const count=appCount[0].appCount
      if(count>0){
        db.query('delete from ghanahomestay.booked_dates where application_id=?',req.params.id,(err,results)=>{
          if(err){
            console.log(err)
          }else{
            res.json({success:true,canceled_dates:results.affectedRows})
          }
        })

      }else{
        res.json({success:false,messsage:" application "+req.params.id+" does not exist"})
      }
    }


  })
  
  db.query('delete from ghanahomestay.booked_dates where application_id=?',req.params.id,(err,results)=>{
    if(err){
      console.log(err)
    }else{
      res.json({success:true,canceled_dates:results.affectedRows})
    }
  })
})

router.post("/approve-booking/:id",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  axios.get("http://localhost:3012/admin-applications/checkAvailability/"+req.params.id).then((response)=>{
   
   
    console.log(response.data.conflicting_dates)
  
    if(!response.data.success){
      res.json({success:false,message:response.data.message})
    }
    else{
      const conflicting_dates=response.data.conflicting_dates
      console.log(conflicting_dates.length)
      if(conflicting_dates.length!=0 &&  response.data.paid){
      console.log("fdsd")
      res.json({success:true,approved:false,message:"conflighting dates",paid:response.data.paid,conflicting_dates:response.data.conflicting_dates})
    }
    if(conflicting_dates.length==0 && response.data.success && !response.data.paid){
      console.log("fdsd")
      res.json({success:true,approved:false,message:"not paid",paid:response.data.paid,conflicting_dates:response.data.conflicting_dates})
    }
    if(conflicting_dates.length==0 && response.data.paid==true && response.data.success){
      db.query("select count(*) as appCount from ghanahomestay.applications where id=?",req.params.id,(err,results)=>{
     console.log("here 1")
        if(err){
          console.log(err)
        }else {
          const appCount=Object.values(JSON.parse(JSON.stringify(results)))
          const count=appCount[0].appCount
          if(count>0){
            const cDate=new Date()
            const currDate=cDate.toString().substring(0,15)

            //make sure dates are available
            db.query("select * from ghanahomestay.booked_dates where application_id!=?",req.params.id,(err2,results2)=>{
              if(err2){
                console.log(err2)
              }else{
                console.log("herei")
               
                //check to see if paid if status was changed from payed to something else
                axios.get("http://localhost:3012/admin-applications/allBookingDatesForApplication/"+req.params.id).then((response1)=>{
                  console.log(response1)
                  const booked=results2
                  const our_dates=response1.data.booked_dates
                  var index=0
                  const conflicts=[]
                  console.log(our_dates+"\n\n")
                  booked.map((b)=>{
                    our_dates.map((o)=>{
                      console.log(o.date+" "+b.date)
                      console.log(b)
                      console.log(o.application_id+" "+b.application_id)
                      if(o.date==b.date && o.application_id!=b.application_id){
                        console.log("match\n\n")
                        conflicts.push({application_id:b.application_id,date:b.date})
                        
                        index++;
                      }
                    })
                  })
                 
                  if(index>0){
                  
                    res.json({success:true,approved:false,conflicting_dates:conflicts,paid:true,message:"conflicting dates"})
                  }else{
                    var indLength=0
                    var alreadyBooked=0
                    const prom2=new Promise((resolve2,reject2)=>{
                      our_dates.map((o)=>{

                        db.query("select count(*) as appCount from ghanahomestay.booked_dates where application_id=? && date=?",[req.params.id,o.date],(err5,results5)=>{
                          if(err5){
                            console.log(err5)
                          }else{
                            const appCount3=Object.values(JSON.parse(JSON.stringify(results5)))
                            const count3=appCount3[0].appCount
                            if(count3>0){
                              console.log(count3)
                              alreadyBooked++
                            }else{
                              db.query("insert into ghanahomestay.booked_dates (application_id,date) values (?,?)",[req.params.id,o.date],(err4,results4)=>{
                                if(err4){
                                  console.log(err4)
                                }else{
  
                                  console.log(results4)
                                  if(results4.affectedRows>0){
                                    indLength++
                                  }
                              
                                }
                              })
  
                            }
  
                          }
                        })
  
                      })
                      resolve2()

                    })
                   
                    prom2.then(()=>{
                      console.log(our_dates.length+" alreadyLength:"+alreadyBooked+" newbooked:"+index)
                        const cDate=new Date()
                        const currDate=cDate.toString().substring(0,15)
                      db.query("update ghanahomestay.applications set approved=1,dateApproved=? where id=?",[currDate,req.params.id],(err6,results6)=>{
                        if(err6){
                          console.log(err6)
                        }else{
                          console.log(alreadyBooked+indLength+" "+our_dates.length)
                          if(alreadyBooked+indLength==our_dates.length){
                          res.json({success:true,approved:true,conflicting_dates:conflicting_dates,paid:response.data.paid,no_booked:alreadyBooked+indLength})
                          }else{
                            
                          }
                        }
                      })

                      
                    })

                     
                  }
                })
              }

            })
            /*db.query("update ghanahomestay.applications set approved=1,dateApproved=? where id=?",[currDate,req.params.id],(err1,results1)=>{
    
            })
            */
    
          }else{
            res.json({success:false,message:"application "+ req.params.id+" does not exist."})
          }


        }


      })

    }
  }
  })
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

/*
router.post("/approve-booking/:id",(req,res)=>{
  db.query("select count(*) as appCount from ghanahomestay.applications where id=?",req.params.id,(err,results)=>{

  })
})
*/

//new get allbooked dates

//calulate all booked dates for an application
router.get("/allBookingDatesForApplication/:id",async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  var app=await Application.find({$and:[{"id":req.params.id}]})
  if(app!=null){
  app=app[0]
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
  res.json({success:true,booked_dates:booked_dates,no_days:index})
}else{
  res.json({success:false,message:"application "+req.params.id+" does not exist"})
}

  /*db.query("select count(*) as appCount from ghanahomestay.applications where id=?",req.params.id,(err,results)=>{
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
            res.json({success:true,booked_dates:booked_dates,no_days:index})
          }
        })

      }else{
        res.json({success:false,message:"application "+req.params.id+" does not exist"})
      }

    }
  })
  */
})

//help:'/approve-booking
//calulates an array of all dates a reservation takes up
router.get("/calculate-booked-dates-for-application/:id",(req,res)=>{
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
    
  const booked_dates=[]
  promise.then(()=>{
  
    if(appExist){
      db.query("select* from ghanahomestay.applications where id=?",req.params.id,(err,results)=>{
        if(err){
          console.log(err)
        }
        else{

          const application=results[0]

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
          }
        })
      }else{
        res.json({success:false,message:"application "+req.params.id+" does not exist"})
      }
    })

})


router.post("/reserveAndPromptPay/:id",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  const id=req.params.id

  db.query("select count(*) as appCount from ghanahomestay.applications where id=?",req.params.id,(err,results)=>{

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
})

router.get("/test/:id",(req,res)=>{
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
  const app=await Application.find({
    $and:[{"id":id}]
  })
  console.log(app)
  const dueDate=app.datePaymentDue
  console.log(dueDate)
  if(dueDate==null){
      res.json({success:true,message:"no payment due date",hasDueDate:false,passedDue:false})
  }else
  if(app!=null){
    var months= ["Jan","Feb","Mar","Apr","May","Jun","Jul",
    "Aug","Sep","Oct","Nov","Dec"];
    var monthnum=["01","02","03","04","05","06","07","08","09","10","11","12"]
    const cDate=new Date()
    const currdate=cDate.toString().substring(0,15)
    console.log(dueDate)
    console.log(currdate)
    const et=app.stay_end_date.split(" ")
    const endDate=new Date(et[3],monthnum[months.indexOf(et[1])-1],et[2])
    const dt=dueDate.split(" ")
    const dueDateObj=new Date(dt[3],monthnum[months.indexOf(dt[1])-1],dt[2])
   const currString=currdate.split(" ")
 
 
    if((currString[0]==dt[0] && currString[1]==dt[1]&& dt[2]==currString[2] && currString[3]==dt[3])  || cDate>=dueDateObj){
      res.json({success:true,hasDueDate:true,passedDue:true,current_date:currdate,due_date:dueDate})
      
    }else{
      res.json({success:true,hasDueDate:true,passedDue:false,current_date:currdate,due_date:dueDate})
    }
  }else{
    res.json({success:false,message:"application "+req.params.id+" does not exist"})

  }

})


/************************************************************* */
router.get("/newgetpaymentDueDate",(req,res)=>{
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