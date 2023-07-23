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
  roomOne:{
    type:Boolean,
    default:false,
  },
  roomTwo:{
    type:Boolean,
    default:false
  },
  roomThree:{
    type:Boolean,
    default:false
  },
    fullSuite:{
      type:Boolean,
      default:true,

  }

})

const BookedDate=mongoose.model("booked_dates",bookedDatesSchema)
module.exports={BookedDate}