
const mongoose=require("mongoose")
const uniqueValidator = require('mongoose-unique-validator')


const userSchema=new mongoose.Schema({
  firstname:{
    type:String,
    requried:true
  },
  lastname:{
    type:String,
    required:true
  },
  phone:{
    type:String,
    required:true
  },
  email:{
    type:String,
    requried:true
  },
  hash:{
    type:String,
    required:true
  },
  dateCreated:{
    type:String,
    required:true
  },
  admin:{
    type:Number,
    required:false,
    default:0
  },
  root:{
    type:Number,
    required:false,
    default:0
  
  },
  admin_id:{
    type:Number,
    required:false,
    default:0
  
  },customerId:{
    type:String
  },
  paymentObj:{
    type: Object
  }

})

const User=mongoose.model("Users",userSchema)
module.exports={User}