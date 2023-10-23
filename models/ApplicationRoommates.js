const mongoose=require("mongoose")
const uniqueValidator = require('mongoose-unique-validator')

const RoommateSchema=new mongoose.Schema({
startDate:{
  type:Date
},
endDate:{
  type:Date
},
roommates:{
  type:Array
}

})

const ApplicationRoommate=mongoose.model("application_roommates",RoommateSchema)
module.exports={ApplicationRoommate}