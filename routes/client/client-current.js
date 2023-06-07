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

handleDisconnect();




router.get("/", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.json("Welcome to home stay ghana server : CURRENT RESIDENT");
});


function handleDisconnect() {
  if (db == null || db.state == "disconnected") {
  db = mysql.createConnection(
    {
      user:"bd4e78905dad5a",
      host:'us-cdbr-east-06.cleardb.net',
      password:"5e037d99",
      database:"heroku_ad7f7c4ee7bc6b0"
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

handleDisconnect();

/*********************************************GUESTS & RESTRICTED INDIVIDUALS */
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



router.post("/edit-guests/:id/:occupant_id",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  const id=req.params.id
  const occupant_id=req.params.occupant_id
  const guests=req.body.guests
  var index=0
  

  const prom=new Promise((resolve,reject)=>{
    db.query("select count(*) as appCount from ghanahomestay.application_occupants where application_id=? && id=?",[id,occupant_id],(err,results)=>{
      if(err){
        console.log(err)
      }else{
        const appCount=Object.values(JSON.parse(JSON.stringify(results)))
        const count=appCount[0].appCount
        console.log(count)
        if(count>0){
          
          db.query("select count(*) as appCount from ghanahomestay.applications where id=? && currentlyOccupied=1 ",[id],(err1,results1)=>{
              if(err1){
                console.log(err1)
              }else{
                const appCount1=Object.values(JSON.parse(JSON.stringify(results1)))
                const count1=appCount1[0].appCount
                console.log("count1:"+count1)
                if(count1>0){
                  console.log(req.body.guests)
                  var guests=req.body.guests
                  db.query("delete from ghanahomestay.application_guests where occupant_id=? ",occupant_id,(err2,results2)=>{
                    if(err2){
                      console.log(err2)
                    }
                   
                    if(guests.length>0){
                        guests.map((g)=>{
                            db.query("insert into ghanahomestay.application_guests (occupant_id,firstname,lastname,phone,email,application_id) values (?,?,?,?,?,?)",[occupant_id,g.firstname,g.lastname,g.phone,g.email,id],(err3,results3)=>{
                              if(err3){
                                console.log(err3)
                              }else{
                                console.log(results3)
                                index++
                                console.log("index:"+index)
                              }
                            })
                        })
                    }else{

                    } 
                  })
                 

                }else{
                    res.json({success:false,message:"Cannot set guest for occupant not current residing in rental"})
                }
              }
          })

        }else{
          res.json({success:false,message:"no occupants with id "+occupant_id})
        }
        
        setTimeout(()=>{
          resolve()
        },100)
        

      }
    })

  })

  prom.then(()=>{
    if(index==0){
      res.json({success:true,guests:guests,no_guests:index})
    }
    if(index>0){
      res.json({success:true,guests:req.body.guests,no_guests:index})
    }
  

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

router.get("/restricted-individuals/:id/:occupant_id",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");


  db.query("select count(*) as appCount from ghanahomestay.application_restricted_individuals where application_id=? && occupant_id=? ",[req.params.id,req.params.occupant_id],(err,results)=>{
    if(err){
      console.log(err)
    }else{
      const appCount=Object.values(JSON.parse(JSON.stringify(results)))
      const count=appCount[0].appCount
      if(count<1){
        res.json({success:true,restricted_individuals:[],no_restricted_individuals:count})
      }else{
        db.query("select * from ghanahomestay.application_restricted_individuals where application_id=? && occupant_id=? ",[req.params.id,req.params.occupant_id],(err1,results1)=>{
          if(err1){
            console.log(err1)
          }else{
            res.json({success:true,restricted_individuals:results1,no_restricted_individuals:count})
          }
        })
        
      }
    }
  })
})

router.post("/restricted-individuals/:id/:occupant_id",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  const restricted=req.body.restricted
  console.log(restricted)
  var index=0
  const prom=new Promise((resolve,reject)=>{
    db.query("select count(*) as appCount from ghanahomestay.application_restricted_individuals where application_id=? && occupant_id=? ",[req.params.id,req.params.occupant_id],(err,results)=>{
      if(err){
        console.log(err)
      }else{
        const appCount=Object.values(JSON.parse(JSON.stringify(results)))
        const count=appCount[0].appCount
       
        db.query("delete from ghanahomestay.application_restricted_individuals where occupant_id=?",req.params.occupant_id,(err2,results2)=>{
          if(err2){
            console.log(err2)
          }else{
            console.log(results2)
            restricted.map((r)=>{
              if(r.firstname !="" && r.lastname!=""){
                db.query(" insert into  ghanahomestay.application_restricted_individuals (application_id,occupant_id,firstname,lastname,img_url) values (?,?,?,?,?) ",[req.params.id,req.params.occupant_id,r.firstname,r.lastname,r.img_url],(err1,results1)=>{
                  if(err1){
                    console.log(err1)
                  }else{
                    index++
                   // res.json({success:true,restricted_individuals:results1,no_restricted_individuals:count})
                  }
                })
  
              }
          })
          }
        })
         
       
         
        
      }
    })
    resolve()
  })

  prom.then(()=>{
   
    res.json({success:true,no_restricted:index})
   
  })
 
})

/****************************************MAINTENANCE*************************** */

router.get("/maintenance-issues/:id",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  db.query("select count(*) as appCount from ghanahomestay.maintenance where application_id=?",req.params.id,(err,results)=>{
    if(err){
      console.log(err)
    }else{
      const appCount=Object.values(JSON.parse(JSON.stringify(results)))
      const count=appCount[0].appCount
      console.log(count)
      if(count>0){
        db.query("select * from ghanahomestay.maintenance where application_id=?",req.params.id,(err1,results1)=>{
          if(err1){
            console.log(err1)
          }else{
            console.log(results1)
            res.json({success:true,issues:results1,no_issues:count})
          }
      })

      }else{
        res.json({success:true,issues:[],no_issues:count})
      }
    }
  })
})

router.post("/new-maintenance/:id",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  console.log(req.params.occupant_id)
  const issue=req.body.issue

  db.query("select count(*) as appCount from ghanahomestay.applications where id=? && currentlyOccupied=1",req.params.id,(err,results)=>{
    if(err){
      console.log(err)
    }else{
      const appCount=Object.values(JSON.parse(JSON.stringify(results)))
      const count=appCount[0].appCount
      console.log(count)
      if(count>0){
        db.query("insert into ghanahomestay.maintenance (mechanism,message,dateRecieved,status,application_id) values(?,?,?,?,?)",[issue.mechanism,issue.message,issue.dateRecieved,"ISSUED",id],(err1,results1)=>{
          if(err1){
            console.log(err1)
          }else{
            res.json({success:true})
          }
        })

      }else{
        res.json({success:false,message:"No active application with id "+ req.params.id})
      }
  

    }
  })
})

router.post("/checkout/:id",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  const checkoutTime=req.body.checkoutTime
  console.log(new Date())
  db.query("select count(*) as appCount from ghanahomestay.applications where id=? ",req.params.id,(err,results)=>{
    if(err){
      console.log(err)
    }else{
      const appCount=Object.values(JSON.parse(JSON.stringify(results)))
      const count=appCount[0].appCount
      console.log(count)
      if(count>0){
        db.query("update ghanahomestay.applications set currentlyOccupied=0, checkoutTime=? where id=?",[checkoutTime,req.params.id],(err1,results1)=>{
          if(err1){
            console.log(err1)
          }else{
            console.log(results1)
            db.query("select * from ghanahomestay.applications where id=?",req.params.id,(err2,results2)=>{
              if(err2){
                console.log(err2)
              }else{
                res.json({success:true,application:results2[0],changed:results1.changedRows})
              }
            })
          }
        })

      }else{
        res.json({success:false,message:"no active applications for application "+req.params.id})
      }
    }
  })
})

router.post("/review/:id",(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");

  console.log(req.body)
  
  db.query("select count(*) as appCount from ghanahomestay.applications where id=? && (application_status='CHECKEDOUT' || currentlyOccupied=1)",req.params.id,(err,results)=>{
    if(err){
      console.log(err)
    }else{
      const appCount=Object.values(JSON.parse(JSON.stringify(results)))
      const count=appCount[0].appCount
      console.log(count)
      if(count>0){
        db.query("update ghanahomestay.applications set review=? where id=?",[req.body.review,req.params.id],(err1,results1)=>{
          if(err1){
            console.log(err1)
          }else{
            console.log(results1)
            db.query("select * from ghanahomestay.applications where id=?",req.params.id,(err2,results2)=>{
              if(err2){
                console.log(err2)
              }else{
               const images=req.body.images
               console.log(images)
               if(images!=null){
                console.log(typeof(images))
                images.map((m)=>{
                  db.query("insert into ghanahomestay.application_review_images (application_id,img_url) values (?,?)",[req.params.id,m.img_url],(err3,results3)=>{
                        if(err3){
                          console.log(err3)
                        }else{
                          console.log(results3)
                        }
                  })

                })
              }

                setTimeout(()=>{
                  res.json({success:true,application:results2[0],changed:results1.changedRows})
                },1000)
             
              }
            })
          }
        })

      }if(count==0){
        res.json({success:false,message:"no active applications for application "+req.params.id})
      }
    }
  })

})

module.exports=router