/********************************ROUTES*********************************************************** */

//handle application process
//associated routes:residents
//const applicationsRouter = require("./routes/applications");


//resident data
//associated rotues:applications
 const residentsRouter = require("./routes/residents");


//signup
const signUpRouter=require("./routes/signup");

//signin
const signInRouter=require("./routes/signin");



//const clientRouter=require("./routes/client/client")
//admin application endpoints
const adminApplicationsRouter=require("./routes/admin/admin-applications")


//client application endpoints
const clientApplicationsRouter=require("./routes/client/client-applications")

//payment transaction
const stripPaymentRouter=require("./routes/payment/payment")

const currentClientRouter=require("./routes/client/client-current")

const adminCurrentClientRouter=require("./routes/admin/admin-client-current")


const paymentClientRouter=require("./routes/payment/client-payment")

 module.exports={clientApplicationsRouter,adminApplicationsRouter,residentsRouter,signInRouter,signUpRouter,stripPaymentRouter,currentClientRouter,adminCurrentClientRouter,paymentClientRouter}