const mongoose=require("mongoose")
const uniqueValidator = require('mongoose-unique-validator')


const chargeSchema=new mongoose.Schema({
  chargeId:{
    type:String,
    require:true,
    unique:true
  },
  application_Id:{
    type:String,
    required:true
  },charge:{
    type:Object
  },
  amount:{
    type:Number,
    required:true
  },
  receipt_url:{
    type:String
  },
  payment_intent:{
    type:String,
    required:true
  },
  payment_method:{
    type:String,
  },
  card:{
    type:Object
  },created:{
    type:Date
  },
  paid:{
    type:Boolean
  },
  payment_method_details:{
    type:Object
  },
  billing_details:{
    type:Object
  },
  refunded:{
    type:Boolean,
    default:false
  },
  status:{
    type:String
  }
})

const Charge=mongoose.model("charge",chargeSchema)
module.exports={Charge}