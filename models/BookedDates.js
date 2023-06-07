const mongoose=require("mongoose")
const uniqueValidator = require('mongoose-unique-validator')

const bookedDatesSchema=new mongoose.Schema({

  date:{
    type:String,
    required:true
  },
  application_id:{
    type:String,
    required:true
  },

})

const BookedDate=mongoose.model("booked_dates",bookedDatesSchema)
module.exports={BookedDate}