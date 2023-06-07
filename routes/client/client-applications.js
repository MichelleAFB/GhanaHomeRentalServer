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
const ApplicationOccupant=require("../../models/ApplicationOccupant")
const Application=require("../../models/ApplicationOccupant")

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

handleDisconnect();




router.get("/", (req, res) => {
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

router.post("/",(req,res)=>{

  
  console.log(req.body)
  const application =req.body
  const children=req.body.children
  const adults=req.body.adults
  console.log(req.body.adults.length)
  const st=req.body.startDate.split(" ")
  const ed=req.body.endDate.split(" ")
  const startDate=st[0]+" "+st[1]+" "+st[2]+" "+st[3]
  const endDate=ed[0]+" "+ed[1]+" "+ed[2]+" "+ed[3]
  console.log(req.body)
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
router.post("/create-application",(req,res)=>{

  console.log(req.body)
  const application =req.body
  const children=req.body.children
  const adults=req.body.adults
  console.log(req.body.adults.length)
  const st=req.body.startDate.split(" ")
  const ed=req.body.endDate.split(" ")
  const startDate=st[0]+" "+st[1]+" "+st[2]+" "+st[3]
  const endDate=ed[0]+" "+ed[1]+" "+ed[2]+" "+ed[3]
  console.log(req.body)
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

router.get("/application/:id",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  console.log("getting application"+ "\n\n")
  console.log(req.params.id)

  db.query("select * from ghanahomestay.applications where id=?",req.params.id,(err,results)=>{
    if(err){
      console.log(err)
    }
    console.log(results)
    db.query("select * from ghanahomestay.application_occupants where application_id= ?",req.params.id,(err1,results1)=>{
      if(err1){
        console.log(err1)
      }
      console.log(results1)
      res.json({application:results[0],occupants:results1})
    })
  })
})


router.get("/getActiveStatus/:id",(req,res)=>{
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


router.post("/release-reservation-due-to-unpaid/:id",(req,res)=>{
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


//TODO:ADD MORE STATUSES
//TODO: fix can send response after sender
//Client can only set certain status from their end APPLIED,PAID
//admin can set APPROVED and RESERVED
router.post("/setStatus/:id/:status",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");


  console.log(req.params.status)
  console.log(req.body)
  db.query("select count(*) as appCount from ghanahomestay.applications where id=?",req.params.id,(err,results)=>{
    const appCount=Object.values(JSON.parse(JSON.stringify(results)))
    const count=appCount[0].appCount
    console.log(count)
    if(count>0){

      if(req.params.status=="PAYED"&& req.body.message!=null){
        var cDate=new Date()
        const currDate=cDate.toString().substring(0,15)
      db.query("update ghanahomestay.applications set application_status=?,notify_admin=1,notify_admin_message=?,datePaid=? where id=?",[req.params.status,req.body.message,currDate,req.params.id],(err1,results1)=>{
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
      if(req.params.status!="APPLIED"&& req.params.status!="PAYED"&&req.body.message!=null){
        var cDate=new Date()
        const currDate=cDate.toString().substring(0,15)
      db.query("update ghanahomestay.applications set application_status=?,notify_admin=1,notify_admin_message=? where id=?",[req.params.status,req.body.message,req.params.id],(err1,results1)=>{
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
   
    }

  })
})


//turns off notify_applicant after application has seen notification update
router.post("/turnOffNotifyApplicant/:id",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

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
})


//calulate all booked dates for an application
router.get("/allBookingDatesForApplication/:id",(req,res)=>{
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
router.get("/guests/:id",(req,res)=>{
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

router.post("/guests/:id/:occupant_id",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  const id=req.params.id
  const occupant_id=req.params.occupant_id
  const guests=req.body.guests

  

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

        }else{
          res.json({success:false,message:"no occupants with id "+occupant_id})
        }
        

        resolve()

      }
    })

  })

  prom.then(()=>{
    res.json({success:true,guests:guests})

  })
})

router.get("/guests/:id/:occupant_id",(req,res)=>{
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


router.get("/get-all-reviews",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");


  const reviews=[]

  
 var images
 const allReviews=[]

  const prom=new Promise((resolve,reject)=>{

  
    db.query("select * from ghanahomestay.application_review_images",(err,results)=>{
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

  })
})
module.exports=router