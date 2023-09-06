const mongoose=require("mongoose")
const uniqueValidator = require('mongoose-unique-validator')

const RoommateSchema=new mongoose.Schema({
startDate:{
  type:String
},
endDate:{
  type:String
},
roommates:{
  
}

})

const ApplicationRoommate=mongoose.model("application_roommates",RoommateSchema)
module.exports={ApplicationRoommate}