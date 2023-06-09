const express = require("express");
const router = express.Router();

// ℹ️ Handles password encryption
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

// How many rounds should bcrypt run the salt (default - 10 rounds)
const saltRounds = 10;

// Require the User model in order to interact with the database
const User = require("../models/User.model");
const Profile = require("../models/Profile.model")
const Recipe = require("../models/Recipe.model");

// Require necessary (isLoggedOut and isLiggedIn) middleware in order to control access to specific routes
const isLoggedOut = require("../middleware/isLoggedOut");
const isLoggedIn = require("../middleware/isLoggedIn");

// GET /auth/signup
router.get("/signup", isLoggedOut, (req, res, next) => {
  res.render("user/signup");
});

// POST /auth/signup
router.post("/signup", isLoggedOut, async (req, res, next) => {
  const { name, email, password } = req.body;


  // Check that username, email, and password are provided
  if (name === "" || email === "" || password === "") {
    res.status(400).render("user/signup", {
      errorMessage:
        "All fields are mandatory. Please provide your name, email and password.",
    });

    return;
  }

  if (password.length < 6) {
    res.status(400).render("user/signup", {
      errorMessage: "Your password needs to be at least 6 characters long.",
    });

    return;
  }

  //   ! This regular expression checks password for special characters and minimum length
  /*
  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (!regex.test(password)) {
    res
      .status(400)
      .render("auth/signup", {
        errorMessage: "Password needs to have at least 6 chars and must contain at least one number, one lowercase and one uppercase letter."
    });
    return;
  }
  */

  // Check if the user already exists in the database
  try {
    console.log(req.body)
    const name = req.body.name
    const existingUser = await User.findOne({ $or: [{ name }, { email }] });
    console.log("Existing User: " + existingUser)
    if (existingUser) {
      res.status(400).render("user/signup", {
        errorMessage: "The email already exist, please Login.",
      });
      return;
    }
  } catch (error) {
    next(error);
    return;
  }

  // Create a new user - start by hashing the password
  bcrypt
    .genSalt(saltRounds)
    .then((salt) => bcrypt.hash(password, salt))
    .then((hashedPassword) => {
      // Create a user and save it in the database
      return User.create({ name: name, email, password: hashedPassword });
    })
    
    .then((user) => {
      res.redirect("/user/login");
    })
    .catch((error) => {
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(500).render("user/signup", { errorMessage: error.message });
      } else if (error.code === 11000) {
        console.log(error.message)
        res.status(500).render("user/signup", {
          errorMessage:
            "Email needs to be unique. Provide a valid email.",
        });
      } else {
        next(error);
      }
    });
});

// GET /auth/login
router.get("/login", isLoggedOut, (req, res) => {
  res.render("user/login");
});


// POST /auth/login
router.post("/login", isLoggedOut, (req, res, next) => {
  const {email, password } = req.body;

  // Check that email, and password are provided
  if (email === "" || password === "") {
    res.status(400).render("user/login", {
      errorMessage:
        "All fields are mandatory. Please provide name, email and password.",
    });

    return;
  }

  // Here we use the same logic as above
  // - either length based parameters or we check the strength of a password
  if (password.length < 6) {
    return res.status(400).render("user/login", {
      errorMessage: "Your password needs to be at least 6 characters long.",
    });
  }

  // Search the database for a user with the email submitted in the form
  User.findOne({ email })
    .then((user) => {
      // If the user isn't found, send an error message that user provided wrong credentials
      if (!user) {
        res
          .status(400)
          .render("user/login", { errorMessage: "Wrong credentials." });
        return;
      }

      // If user is found based on the username, check if the in putted password matches the one saved in the database
      bcrypt
        .compare(password, user.password)
        .then((isSamePassword) => {
          if (!isSamePassword) {
            res
              .status(400)
              .render("user/login", { errorMessage: "Wrong credentials." });
            return;
          }
          console.log('USER: ', user);
          // Add the user object to the session object
          req.session.currentUser = user.toObject();
          // Remove the password field
          delete req.session.currentUser.password;
         
          // HERE WE NEED TO CHECK FOR A PROFILE RELATED TO THIS USER
          Profile.findOne({user: user._id})
          .then((profile)=>{
            console.log('THIS IS THE PROFILE: ', profile);
            if(profile){
              res.redirect("/profile/kitchen-overview");

            }
            else{
              res.redirect(`/profile/create-profile?name=${user.name}`);
            }
          })

          /*  if (user.profile) {
             console.log(req.session.currentUser);
          } else {
            console.log('THIS IS WHAT WE WANT: ',req.session.currentUser.profile);
            // if user has a profile redirecto /kitchen-overview
            // if not to create-profile
          } */
        })

        .catch((err) => next(err)); // In this case, we send error handling to the error handling middleware.
    })
    .catch((err) => next(err));
});

// GET /auth/logout
router.get("/logout", isLoggedIn, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).render("user/logout", { errorMessage: err.message, isLoggedIn: req.isLoggedIn });
      return;
    }

    res.redirect("/");
  });
});

module.exports = router;
