const mongoose=require("mongoose")
const uniqueValidator = require('mongoose-unique-validator')

const applicationReviewImagesSchema= new mongoose.Schema({
  application_id:{
    type:String,
    required:true
  },
  img_url:{
    type:String,
    required:true
  },
  publicID:{
    type:String,
    required:true,
  }
})



const ApplicationReviewImage=mongoose.model("application_review_images",applicationReviewImagesSchema)
module.exports={ApplicationReviewImage}