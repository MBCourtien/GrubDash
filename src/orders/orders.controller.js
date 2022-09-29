const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

// Middleware / Validation: if requirements not met will return error message

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

// CRUDL

function list(req, res) {
  res.json({ data: orders });
}

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

function read(req, res) {
  const order = res.locals.order;
  res.json({ data: order });
}

function update(req, res, next) {
  const order = res.locals.order;
  const { orderId } = req.params;
  const { data: { id, deliverTo, mobileNumber, dishes, status } = {} } =
    req.body;
  if (!id || orderId === id) {
    const updatedOrder = {
      id: orderId,
      deliverTo,
      mobileNumber,
      dishes,
      status,
    };
    res.json({ data: updatedOrder });
  }

  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
  });
}

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
  delete: [orderExists, statusPending, destroy],
  list,
};