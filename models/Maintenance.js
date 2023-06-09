const mongoose=require("mongoose")
const uniqueValidator = require('mongoose-unique-validator')


const maintenanceSchema=new mongoose.Schema({
  mechanism:{
    type:String,
    required:true
  },
  message:{
    type:String,
    required:true
  },
  dateRecieved:{
    type:String,
    required:false
  },
  status:{
    type:String,
    required:false
  },
  dateResolved:{
    type:String,
    required:false
  },
  application_id:{
    type:String,
    required:true
  }
})

const Maintenance=mongoose.model("maintence",maintenanceSchema)
module.exports={Maintenance}