const mysql = require("mysql");

/*
const db_config = mysql.createConnection({
  host: "127.0.0.1",
  user: "b75edd622086d9",
  password:"Mirchoella22",
  port:3306,
  database: "ghanahomestay",
});



*/
/*
const db_config={
  host:'database-1.c6tdc1elydkq.us-east-1.rds.amazonaws.com',
  port:'3306',
  user:"michellebadu",
  password:"Mirchoella22",
  database:"heroku_74ccdb90d27e5ae"

}
//localhost:3306/fullstack
*/
const db_config = mysql.createConnection({
  user:"root",
  password:"Mirchoella22",
  host:'localhost',
  port:'3306',


}) 





 
/*
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "aacdb",
});
console.log(db);
*/

/*
mysql://b9a25f42e722fd:0331ec28@us-cdbr-east-06.cleardb.net/heroku_74ccdb90d27e5ae?reconnect=true
*/

module.exports = db_config;
