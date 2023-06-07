const mongoose=require("mongoose")
const uniqueValidator = require('mongoose-unique-validator')


const applicationGuestsSchema=new mongoose.schema({
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
    required:false
  },
  association:{
    type:String,
    required:false
  },
  occupant_id:{
    type:String,
    required:true
  },
  application_id:{
    type:String,
    required:true
  },
  email:{
    type:String,
    required:false
  }
})

const ApplicationGuest=mongoose.model("application_guests",applicationGuestsSchema)
module.exports={ApplicationGuest}