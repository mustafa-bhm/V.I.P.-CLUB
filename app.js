const express = require("express");
const app = express();
require("dotenv").config();
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");
const flash = require("express-flash");

app.set("view engine", "ejs");
const port = process.env.PORT || 3003;

/// to connect to DB
const mongoDb = process.env.DB_URL;
mongoose.set("strictQuery", false);
mongoose.connect(mongoDb, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;

// DB Schema
const User = mongoose.model(
  "User",
  new Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
  })
);

/// **** Middleware *** ////

//// ** Routes *** ////
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});
app.listen(3003, () => {
  console.log(`server is running on port ${port}`);
});
