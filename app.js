require("dotenv").config();
const express = require("express");
const DbConnect = require("./app/config/db");
const cors = require("cors");
const router = require("./app/routes");
const cookieParser = require("cookie-parser");

require("./app/cron/deleteUser");

const app = express();

// Database
DbConnect();

app.use(cors());

// Json Config
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// EJS
app.set("view engine", "ejs");
app.set("views", "views");

// Session Cookie
app.use(cookieParser());

// Router
app.use(router);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Port is running on ${PORT}`);
});
