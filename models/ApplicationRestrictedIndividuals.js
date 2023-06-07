const mongoose=require("mongoose")
const uniqueValidator = require('mongoose-unique-validator')

const applicationRestrictedIndividualsSchema=new mongoose.Schema({
  firstname:{
    type:String,
    required:true,
  },
  lastname:{
    type:String,
    required:true
  },
  middlename:{
    type:String,
    required:false
  },
  img_url:{
    type:String,
    required:false
  },
  application_id:{
    type:String,
    required:true
  },
  occupant_id:{
    type:String,
    required:true
  }
})

const ApplicationRestrictedIndividual=mongoose.model("application_restricted_individuals",ApplicationRestrictedIndividualsSchema)
module.exports={ApplicationRestrictedIndividual}