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
    avatar: { type: String, required: true },
    password: { type: String, required: true },
  })
);
const Post = mongoose.model(
  "Post",
  new Schema(
    {
      author: { type: String, required: true },
      title: { type: String, required: true },
      post: { type: String, required: true },
      avatar: { type: String, required: true },
    },
    { timestamps: true }
  )
);
/// **** Middleware *** ////
app.use(express.static("public"));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
passport.use(
  new LocalStrategy((username, password, done) => {
    User.findOne({ username: username }, (err, user) => {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      if (
        bcrypt.compare(password, user.password, (err, res) => {
          if (res) {
            // if password matches
            return done(null, user);
          } else {
            // if password do not match
            return done(null, false, { message: "Incorect password" });
          }
        })
      ) {
      }
    });
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});
app.use(passport.initialize());
app.use(passport.session());
// to add user object Locals object under currentUser , so it can be available to all the views
app.use(function (req, res, next) {
  res.locals.currentUser = req.user;

  next();
});
app.use(express.urlencoded({ extended: false }));

//// ** Routes *** ////

//=> home page
app.get("/", (req, res) => {
  // res.render("index");
  Post.find()
    .sort({ createdAt: -1 })
    .then((result) => {
      res.render("index", { posts: result });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/dashboard", (req, res) => {
  if (req.user) {
    let loggedUser = req.user.username;

    Post.find({ author: loggedUser })
      .sort({ createdAt: -1 })
      .then((result) => {
        res.render("dashboard", { posts: result, loggedUser: loggedUser });
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    res.send("<h3> you need to log-in/register to see this page</h3>");
  }
});

//=> login page
app.get("/login", (req, res) => {
  res.render("login");
});

//=> registration page
// to redirect to secret code page
app.get("/secret", (req, res) => {
  res.render("check");
});
app.get("/register", (req, res) => {
  res.render("check");
});
// check secret code en redirect to registration page
app.post("/register", (req, res) => {
  const answer = req.body.secret;
  const secretCode = process.env.SECRET_CODE;
  if (answer === secretCode) {
    res.render("register");
  } else {
    res.send("<h3> you need to enter the SECRET CODE to register</h3>");
  }
});

//=> create new user
app.post("/sign-up", (req, res, next) => {
  bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
    if (err) {
      console.log(err);
    } else {
      const user = new User({
        username: req.body.username,
        email: req.body.email,
        avatar: req.body.avatar,
        password: hashedPassword,
      });
      user
        .save()
        .then((result) => {
          res.redirect("/");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  });
});

//=> to login users
app.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true,
  })
);
//=> to logout users

app.get("/log-out", (req, res, next) => {
  req.logOut((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});
//=> to create new post
app.post("/new-post", (req, res) => {
  const post = new Post(req.body);
  post
    .save()
    .then((result) => {
      res.redirect("/dashboard");
    })
    .catch((err) => {
      console.log(err);
    });
});

//=> to delete a post

app.get("/delete/:id", (req, res) => {
  const id = req.params.id;
  Post.findByIdAndDelete(id)
    .then((result) => {
      res.redirect("/dashboard");
    })
    .catch((err) => {
      console.log(err);
    });
});

//=> to edit post
app.get("/update/:id", (req, res) => {
  const id = req.params.id;
  Post.findById(id)
    .then((result) => {
      res.render("update", { post: result });
    })
    .catch((err) => {
      res.status(404).render("404", { title: "Blog not found" });
    });
});
app.post("/update/:id", (req, res) => {
  const id = req.params.id;
  Post.findByIdAndUpdate(id, req.body)
    .then((result) => {
      res.redirect("/dashboard");
    })
    .catch((err) => {
      console.log(err);
    });
});

app.listen(3003, () => {
  console.log(`server is running on port ${port}`);
});
