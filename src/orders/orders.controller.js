const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");


// TODO: Implement the /orders handlers needed to make the tests pass

// Middleware and Validation

//Validate existence of deliverTo
function deliverToExists(req, res, next) {
  const { data: { deliverTo } = {} } = req.body;

  if (deliverTo) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include a deliverTo",
  });
}

//Validate existence of mobileNumber
function mobileNumberExists(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;

  if (mobileNumber) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include a mobileNumber",
  });
}

//Validate existence of dishes
function dishesExists(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  if (!dishes) {
    next({
      status: 400,
      message: "Order must include a dish",
    });
  } else if (!Array.isArray(dishes) || dishes.length === 0) {
    next({
      status: 400,
      message: "Order must include at least one dish",
    });
  }
  return next();
}

//Validate existence of dishQuantity
function dishQuantityExists(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  const index = dishes.findIndex((dish) => !dish.quantity);

  if (index >= 0) {
    next({
      status: 400,
      message: `Dish ${index} must have a quantity that is an integer greater than 0`,
    });
  }

  return next();
}

//Ensure that dishQuantity is an integer
function dishQuantityIsInteger(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  const index = dishes.findIndex((dish) => !Number.isInteger(dish.quantity));

  if (index >= 0) {
    next({
      status: 400,
      message: `Dish ${index} must have a quantity that is an integer greater than 0`,
    });
  }

  return next();
}

//Validate existence of order
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }

  next({
    status: 404,
    message: `Order does not exist: ${orderId}`,
  });
}

//Ensure status is valid
function statusExists(req, res, next) {
  const { data: { status } = {} } = req.body;

  if (
    status === "pending" ||
    status === "preparing" ||
    status === "out-for-delivery"
  ) {
    return next();
  }

  next({
    status: 400,
    message:
      "Order must have a status of pending, preparing, out-for-delivery, delivered",
  });
}

//Chack if order status is pending
function statusPending(req, res, next) {
  const { order } = res.locals;

  if (order.status === "pending") {
    return next();
  }

  next({
    status: 400,
    message: "An order cannot be deleted unless it is pending",
  });
}

/*********************************************/

//LIST FUNCTION
function list(req, res) {
  res.json({ data: orders });
}

//CREATE FUNCTION
function create(req, res) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  const newId = nextId();

  const newOrder = {
    id: newId,
    deliverTo,
    mobileNumber,
    dishes,
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

//READ FUNCTION
function read(req, res) {
  const order = res.locals.order;
  res.json({ data: order });
}

//UPDATE FUNCTION
function update(req, res, next) {
  const order = res.locals.order;
  const { orderId } = req.params;
  const { data: { id, deliverTo, mobileNumber, dishes, status } = {} } =
    req.body;
  if (orderId === id) {
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.dishes = dishes;
    order.status = status;

    res.json({ data: order });
  }

  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
  });
}

//DELETE FUNCTION
function destroy(req, res, next) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  const removed = orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  create: [
    deliverToExists,
    mobileNumberExists,
    dishesExists,
    dishQuantityExists,
    dishQuantityIsInteger,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    deliverToExists,
    mobileNumberExists,
    dishesExists,
    dishQuantityExists,
    dishQuantityIsInteger,
    statusExists,
    update,
  ],
  delete: [
      orderExists,
    statusPending,
    destroy,
  ],
  list,
};
