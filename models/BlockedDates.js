const mongoose=require("mongoose")
const uniqueValidator = require('mongoose-unique-validator')

const blockedDatesSchema=new mongoose.Schema({

  day:{
    type:String,
    required:true,
    unique:true
  }


})

const BlockedDate=mongoose.model("blocked_dates",blockedDatesSchema)
module.exports={BlockedDate}