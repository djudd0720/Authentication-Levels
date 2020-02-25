//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
//added express-session, passport and passport-local mongoose
//this authentication process uses cookies and sessions
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");



const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: 'This is our BIG secret',
  resave: false,
  saveUninitialized: false,
  //cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema ({
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose); //using to salt and hash our passwords and save our unser to db

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

//this route checks to see if the user is authenticated and if so, sends to secrets page, otherwise redirects them to the login page to try again
app.get("/secrets", function(req, res){
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else{
    res.redirect("/login");
  }
});

//logout function - this will deauthenticate the user

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

//Register new user

app.post("/register", function(req, res){
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });


});

//login validation
app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });


//use passport to authenticate this user - pass to /secrets route to if they are indeed authenticated

  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local") (req, res, function() {
        res.redirect("/secrets");
      });
    }
  });

});




app.listen(3000, function() {
  console.log("Server started on port 3000");
});
