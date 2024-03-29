/**firstname,middlename,lastname,phone,email,stay_start_date,stay_end_date,no_adults,no_children,dateReceived,notify_admin_message */
const mongoose=require("mongoose")
const uniqueValidator = require('mongoose-unique-validator')

const applicationSchema=new mongoose.Schema({
 
  firstname:{
    type:String,
    required:true,
  },
  middlename:{
    type:String,
    required:false,
  },
  lastname:{
    type:String,
    required:false,
  },
  phone:{
    type:String,
    required:false
  },
  email:{
    type:String,
    require:true
  },
  stay_start_date:{
    type:String,
    required:false,
  },
  stay_end_date:{
    type:String,
    required:false
  },
  no_adults:{
    type:Number,
    require:true
  },
  no_children:{
    type:Number,
    require:true
  },
  dateReceived:{
    type:String,
    required:false
  },
  notify_admin_message:{
    type:String,
    required:false
  },
  no_occupants:{
    type:Number,
    required:false
  },
  notify_applicant:{
    type:Number,
    required:false,
    default:0
  },
  notify_admin:{
    type:Number,
    default:1,
    required:false
  },
  application_status:{
    type:String,
    default:"APPLIED",
    required:false
  },
  approved:{
    type:Number,
    default:0,
    required:false
  },
  dateApproved:{
    type:String,
    required:false
  },
  confirmedApproved:{
    type:Number,
    default:0,
    required:false
  },
  dateReserved:{
    type:String,
    required:false
  },
  dateDenied:{
    type:String,
    required:false
  },
  datePaymentDue:{
    type:String,
    required:false
  },
  notify_admin_message:{
    type:String,
    required:false
  },
  notify_applicant_message:{
    type:String,
    required:false
  },
  datePaid:{
    type:Date,
    required:false
  },
  currentlyOccupied:{
    type:Number,
    default:0,
    required:false
  },
  checkoutTime:{
    type:String,
    required:false,
    default:""
  },
  checkinTime:{
    type:String,
    required:false,
    default:""
  },
  review:{
    type:String,
    required:false
  },
  paymentSessionUrl:{
    type:String,
    required:false
  },
  checkedIn:{
    type:Number,
    default:0,
    required:false
  },
  timeCheckedIn:{
    type:Date,
    required:false
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
  },
  fullSuite:{
    type:Boolean,
    default:true
  },
  roommate:{
    type:Boolean,
    default:false
  },
  roommate1:{
    type:Boolean,
    default:false


  },
  roommate2:{
    type:Boolean,
    default:false

    
  },
  roommate_group:{
    type:Array
    
  },charges:{
    type: Object
  },
  roommates:{
    type:Array
  },needsRefund:{
    type:Boolean,
    default:false
  },
  dateNeedsRefund:{
    type:Date
  }


})

applicationSchema.plugin(uniqueValidator)

const Application=mongoose.model("Applications",applicationSchema)
module.exports={Application}