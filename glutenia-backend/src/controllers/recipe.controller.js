const Recipe = require("../models/Recipe");

const ALLOWED_FIELDS = [
  "name",
  "description",
  "category",
  "imageUrl",
  "calories",
  "carbo",
  "protein",
  "popular",
  "ingredients",
  "preparation",
];

const pickFields = (body) =>
  ALLOWED_FIELDS.reduce((fields, key) => {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      fields[key] = body[key];
    }
    return fields;
  }, {});

exports.getRecipes = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = {};
    if (category) {
      filter.category = category;
    }

    const recipes = await Recipe.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: recipes,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getRecipeById = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }

    return res.json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    return next(error);
  }
};

exports.createRecipe = async (req, res, next) => {
  try {
    const recipe = await Recipe.create({
      ...pickFields(req.body),
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateRecipe = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }

    Object.assign(recipe, pickFields(req.body));
    await recipe.save();

    return res.json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteRecipe = async (req, res, next) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }

    return res.json({
      success: true,
      data: { message: "Recipe deleted" },
    });
  } catch (error) {
    return next(error);
  }
};
