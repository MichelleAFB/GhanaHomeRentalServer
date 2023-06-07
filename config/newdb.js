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

const new_db_config={
  host:'localhost',
  port:'3306',
  user:"root",
  password:"Mirchoella22",
  
}
var db=mysql.createConnection(new_db_config)
//localhost:3306/fullstack
/*
const new_db_config=  mysql.createConnection({
  user:"bd4e78905dad5a",
  host:'us-cdbr-east-06.cleardb.net',
  password:"5e037d99",
  port:3306,
  database:"heroku_ad7f7c4ee7bc6b0"
}) 
*/


module.exports={new_db_config,db}
