const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");

let lastDishId = dishes.reduce((maxId, dish) => Math.max(maxId, dish.id), 0)

// Middleware and Validation

//Validate if name exists
function nameExists(req, res, next) {
  const { data: { name } = {} } = req.body;

  if (name) {
    return next();
  }

  next({
    status: 400,
    message: "Dish must include a name",
  });
}

//Validate if description exists
function descriptionExists(req, res, next) {
  const { data: { description } = {} } = req.body;

  if (description) {
    return next();
  }

  next({
    status: 400,
    message: "Dish must include a description",
  });
}

//Validate if price exists
function priceExists(req, res, next) {
  const { data: { price } = {} } = req.body;

  if (!price) {
    next({
      status: 400,
      message: "Dish must include a price",
    });
  } else if (price <= 0 || typeof price != "number") {
    next({
      status: 400,
      message: "Dish must hav a price that is an integer greater than 0",
    });
  }

  return next();
}

//Validate existence of image
function imageExists(req, res, next) {
  const { data: { image_url } = {} } = req.body;

  if (image_url) {
    return next();
  }

  next({
    status: 400,
    message: "Dish must include a image_url",
  });
}

//Validate existence of specific dish
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }

  next({
    status: 404,
    message: `Dish does not exist: ${dishId}`,
  });
}

/********************************************/


//CREATE FUNCTION
function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newId = nextId();

  const newDish = {
    id: newId,
    name,
    description,
    price,
    image_url,
  };

  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

//READ FUNCTION
function read(req, res) {
  const dish = res.locals.dish;
  res.json({ data: dish });
}

//UPDATE FUNCTION
function update(req, res, next) {
  const dish = res.locals.dish;
  const { dishId } = req.params;
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  if (dishId === id) {
    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;

    res.json({ data: dish });
  }

  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
  });
}

//LIST FUNCTION
function list(req, res) {
  res.json({ data: dishes });
}

module.exports = {
  create: [nameExists, descriptionExists, priceExists, imageExists, create],
  read: [dishExists, read],
  update: [
    dishExists,
    nameExists,
    descriptionExists,
    priceExists,
    imageExists,
    update,
  ],
  list,
};
