const express = require("express");
const router = express.Router();
const cookie = require("universal-cookie");
const bcrypt = require("bcryptjs");
const db_config = require("../../config/db");
const mysql = require("mysql");
const cors = require("cors");

const bodyParser = require("body-parser");

router.use(bodyParser.json());
var corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};

router.use(cors(corsOptions));
/*

router.use(cors(corsOptions));
function handleDisconnect() {
  if (db == null || db.state == "disconnected") {
    db = mysql.createConnection(db_config); // Recreate the connection, since
    // the old one cannot be reused.
    db.connect(function (err) {
      // The server is either down
      if (err) {
        // or restarting (takes a while sometimes).
        console.log("error when connecting to db:", err);
        setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
      } // to avoid a hot loop, and to allow our node script to
    }); // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    db.on("error", function (err) {
      console.log("db error", err);
      if (err.code === "PROTOCOL_CONNECTION_LOST") {
        // Connection to the MySQL server is usually
        handleDisconnect(); // lost due to either server restart, or a
      } else {
        // connnection idle timeout (the wait_timeout
        // throw err; // server variable configures this)
        console.log(":mongo failed");
      }
    });
  }
}

handleDisconnect();

var db;



router.get("/", (req, res) => {
  console.log(this.list)
  res.json("Welcome to home stay ghana server : CLIENT APPLICATIONS");
});



/**********APPLICATION */



module.exports=router;