const mongoose=require("mongoose")
const uniqueValidator = require('mongoose-unique-validator')

const applicationOccupantSchema=new mongoose.Schema({
  firstname:{
    type:String,
    required:true
  },
  lastname:{
    type:String,
    required:true
  },
  age:{
    type:Number,
    required:true
  },
  association:{
    type:String,
    requried:true
  },
  application_id:{
    type:String,
    required:true
  },
  email:{
    type:String,
    required:false
  },
  child:{
    type:Number,
    default:0,
    required:false

  }
})

const ApplicationOccupant=mongoose.model("ApplicationOccupant",applicationOccupantSchema)
module.exports={ApplicationOccupant}