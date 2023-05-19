const router = require("express").Router();

const User = require("../models/User.model");
const Profile = require("../models/Profile.model");

// we need to require our getRecipeByIngredients function here
const {
  getRecipeByIngredients,
  getRecipeInformation,
} = require("../API/index");

const Recipe = require("../models/Recipe.model");

const isLoggedOut = require("../middleware/isLoggedOut");
const isLoggedIn = require("../middleware/isLoggedIn");

// require middleware login

// GET /profile/create-profile
router.get("/create-profile", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.session.currentUser._id);
    console.log(user);
    console.log("trying to push");
    const username = user.username;
    console.log(username);
    res.render("profile/create-profile", {
      username,
      isLoggedIn: req.isLoggedIn,
    });
  } catch (error) {
    next(error);
  }
});

router.get("user/login", isLoggedIn, (req, res) => {
  res.render("profile/create-profile", { isLoggedIn: req.isLoggedIn });
});

router.post("/your-recipes", isLoggedIn, async (req, res) => {
  try {
    /*const author = new User({
        author: req.session.currentUser._id, //newly added
      });*/
    const newRecipe = await Recipe.create(req.body); // Send also the user ID author: req.session.currentUser._id
    console.log("Recipe created:", newRecipe);
    res.redirect("/profile/your-recipes", { isLoggedIn: req.isLoggedIn });
  } catch (err) {
    console.log("Recipe couldn't be created:", err);
    res.send("Error");
  }
});

router.get("/your-recipes", isLoggedIn, async (req, res) => {
  try {
    //const profile = new User({
    //user: req.session.currentUser._id //newly added
    //});
    const recipes = await Recipe.find();
    res.render("profile/new-recipe.hbs", {
      recipes,
      isLoggedIn: req.isLoggedIn,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/your-recipes/details/:id", isLoggedIn, async (req, res) => {
  try {
    const recipeId = req.params.id;
    const recipe = await Recipe.findById(recipeId);
    res.render("profile/recipe-details.hbs", {
      recipe,
      isLoggedIn: req.isLoggedIn,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/your-recipes/edit-recipe/:id", isLoggedIn, async (req, res) => {
  const recipeId = req.params.id;
  const updatedRecipe = req.body;

  try {
    const updated = await Recipe.findByIdAndUpdate(recipeId, updatedRecipe, {
      new: true,
    });
    res.render("profile/edit-recipe.hbs", {
      updatedRecipe: updated,
      isLoggedIn: req.isLoggedIn,
    });
  } catch (err) {
    console.error("Failed to update recipe:", err);
    res.status(500).send("Failed to update recipe");
  }
});

router.get("/your-recipes/delete/:id", isLoggedIn, async (req, res) => {
  try {
    const recipe = req.params.id;
    await Recipe.findByIdAndDelete(recipe);
    res.render("profile/recipe-deleted.hbs", {
      recipe,
      isLoggedIn: req.isLoggedIn,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});

// POST /profile/create-profile
router.post("/create-profile", isLoggedIn, async (req, res) => {
  try {
    const { username, diet, country } = req.body;

    // Create a new profile with the fixed username
    const profile = new Profile({
      user: req.session.currentUser._id,
      username,
      diet,
      country,
    });

    await profile.save();
    console.log("Redirecting to kitchen");

    res.redirect("/profile/kitchen-overview"); // Redirect to kitchen-state.hbs
  } catch (error) {
    console.error(error);
    res.send("Error");
  }
});

// GET /profile/kitchen
router.get("/kitchen-overview", isLoggedIn, (req, res) => {
  res.render("profile/kitchen-overview.hbs", { isLoggedIn: req.isLoggedIn });
});

// POST ROUTE FOR THE GETRECIPEBYINGREDIENTS function
router.post("/kitchen-overview", isLoggedIn, async (req, res) => {
  try {
    const ingredientsArray = req.body.ingredient;
    console.log("INGREDIENTS: ", ingredientsArray);
    const recipes = await getRecipeByIngredients(ingredientsArray);
    console.log(recipes);
    res.render("profile/kitchen-details.hbs", {
      recipes,
      isLoggedIn: req.isLoggedIn,
    });
  } catch (error) {
    console.error(error);
    res.send("Error");
  }
});
// we get the array of ingredients from the body of our form

// GET /profile/recipes
router.get("/kitchen-details", isLoggedIn, (req, res) => {
  res.render("profile/kitchen-details.hbs", { isLoggedIn: req.isLoggedIn });
});

// GET /profile/recipe-list-details
router.get("/kitchen-recipes", isLoggedIn, async (req, res) => {
  const recipeId = req.query.recipeId;
  try {
    const recipeInformation = await getRecipeInformation(recipeId);
    res.render("profile/kitchen-recipes.hbs", {
      recipeInformation,
      isLoggedIn: req.isLoggedIn,
    });
  } catch (error) {
    console.error(error);
    res.send("Error");
  }
});

router.get("/community-recipes", isLoggedIn, async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.render("profile/community-recipes.hbs", { recipes });
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/logout", isLoggedIn, (req, res) => {
  res.render("user/logout"); // Render the logout page after successful logout
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res
        .status(500)
        .render("/profile", {
          errorMessage: err.message,
          isLoggedIn: req.isLoggedIn,
        });
      return;
    }
  });
  res.render("index")
});

module.exports = router;
