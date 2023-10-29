const mongoose=require("mongoose")
const uniqueValidator = require('mongoose-unique-validator')

const RoommateSchema=new mongoose.Schema({
startDate:{
  type:Date
},
endDate:{
  type:Date
},
startDateString:{
  type:String
},
endDateString:{
  type:String
},
roommates:{
  type:Array
},
roomOne:{
  type:Boolean,
  default:false
},
roomTwo:{
  type:Boolean,
  default:false
},
roomThree:{
  type:Boolean,
  default:false
}

})

const ApplicationRoommate=mongoose.model("application_roommates",RoommateSchema)
module.exports={ApplicationRoommate}