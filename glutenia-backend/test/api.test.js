const assert = require("node:assert/strict");
const { test, describe } = require("node:test");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const request = require("supertest");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "glutenia-test-secret";
process.env.JWT_EXPIRES_IN = "1h";
process.env.MONGO_URI =
  process.env.TEST_MONGO_URI || "mongodb://127.0.0.1:27017/glutenia_test";

const app = require("../src/app");
const Cart = require("../src/models/Cart");
const Event = require("../src/models/Event");
const Notification = require("../src/models/Notification");
const Order = require("../src/models/Order");
const Product = require("../src/models/Product");
const Recipe = require("../src/models/Recipe");
const User = require("../src/models/User");

const resetDatabase = async () => {
  await Promise.all([
    Cart.deleteMany({}),
    Event.deleteMany({}),
    Notification.deleteMany({}),
    Order.deleteMany({}),
    Product.deleteMany({}),
    Recipe.deleteMany({}),
    User.deleteMany({}),
  ]);
};

test.before(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const dbName = mongoose.connection.db.databaseName;
  assert.match(
    dbName,
    /test/i,
    `Refusing to run tests against non-test database: ${dbName}`
  );

  await resetDatabase();
});

test.after(async () => {
  await resetDatabase();
  await mongoose.disconnect();
});

// Shared state, populated as the suites below run in order.
const ctx = {};

const registerCustomer = async ({ name, email, password, role }) => {
  const registerResponse = await request(app)
    .post("/api/auth/register")
    .send({ name, email, password, role })
    .expect(201);

  return registerResponse.body.data;
};

describe("Authentication", () => {
  test("registers a new customer and issues a JWT", async () => {
    const health = await request(app).get("/").expect(200);
    assert.equal(health.body.success, true);
    assert.equal(health.body.data.status, "running");

    const missing = await request(app).get("/missing-route").expect(404);
    assert.deepEqual(missing.body, {
      success: false,
      message: "Route not found",
    });

    const verified = await registerCustomer({
      name: "Customer One",
      email: "customer@glutenia.test",
      password: "secret123",
    });

    assert.ok(verified.token);
    assert.equal(verified.user.email, "customer@glutenia.test");
    assert.equal(verified.user.password, undefined);

    ctx.customerToken = verified.token;
    ctx.customerId = verified.user._id;

    const duplicate = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Customer Duplicate",
        email: "customer@glutenia.test",
        password: "secret123",
      })
      .expect(409);

    assert.equal(duplicate.body.success, false);
  });

  test("logs in an existing user and returns their profile", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({
        email: "customer@glutenia.test",
        password: "secret123",
      })
      .expect(200);

    assert.ok(login.body.data.token);

    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .expect(200);

    assert.equal(me.body.data.email, "customer@glutenia.test");
    assert.equal(me.body.data.role, "customer");

    const adminPassword = await bcrypt.hash("admin123", 12);
    const admin = await User.create({
      name: "Admin",
      email: "admin@glutenia.test",
      password: adminPassword,
      role: "admin",
    });
    ctx.adminId = admin._id.toString();

    await request(app)
      .post("/api/auth/login")
      .send({
        email: "admin@glutenia.test",
        password: "wrong-password",
      })
      .expect(401);

    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: "admin@glutenia.test",
        password: "admin123",
      })
      .expect(200);

    ctx.adminToken = adminLogin.body.data.token;
  });
});

describe("Profile", () => {
  test("updates name and avatar", async () => {
    const updated = await request(app)
      .put("/api/auth/me")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .send({ name: "Customer One Updated", avatar: "data:image/png;base64,abc123" })
      .expect(200);

    assert.equal(updated.body.data.name, "Customer One Updated");
    assert.equal(updated.body.data.avatar, "data:image/png;base64,abc123");

    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .expect(200);

    assert.equal(me.body.data.name, "Customer One Updated");
  });

  test("rejects an empty name", async () => {
    const response = await request(app)
      .put("/api/auth/me")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .send({ name: "   " })
      .expect(400);

    assert.equal(response.body.success, false);
  });

  test("changes the password and rejects the wrong current password", async () => {
    const wrongCurrent = await request(app)
      .put("/api/auth/change-password")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .send({ currentPassword: "not-the-password", newPassword: "newsecret123" })
      .expect(401);

    assert.equal(wrongCurrent.body.success, false);

    await request(app)
      .put("/api/auth/change-password")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .send({ currentPassword: "secret123", newPassword: "newsecret123" })
      .expect(200);

    await request(app)
      .post("/api/auth/login")
      .send({ email: "customer@glutenia.test", password: "secret123" })
      .expect(401);

    const relogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "customer@glutenia.test", password: "newsecret123" })
      .expect(200);

    assert.ok(relogin.body.data.token);
  });
});

describe("Products", () => {
  test("lets an admin create, update and search for products", async () => {
    const createdProduct = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .send({
        name: "Pain sans gluten",
        description: "Pain moelleux sans gluten.",
        price: 4.5,
        category: "Bread",
        imageUrl: "https://example.com/pain.jpg",
        stock: 25,
        isGlutenFree: true,
      })
      .expect(201);

    assert.equal(createdProduct.body.success, true);
    assert.equal(createdProduct.body.data.createdBy, ctx.adminId);

    ctx.productId = createdProduct.body.data._id;

    const products = await request(app)
      .get("/api/products?category=Bread&search=pain")
      .expect(200);

    assert.equal(products.body.data.length, 1);
    assert.equal(products.body.data[0]._id, ctx.productId);

    const productDetail = await request(app)
      .get(`/api/products/${ctx.productId}`)
      .expect(200);

    assert.equal(productDetail.body.data.name, "Pain sans gluten");

    const updatedProduct = await request(app)
      .put(`/api/products/${ctx.productId}`)
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .send({ stock: 20 })
      .expect(200);

    assert.equal(updatedProduct.body.data.stock, 20);

    const uploadedImage = await request(app)
      .put(`/api/products/${ctx.productId}/image`)
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .attach("image", Buffer.from("glutenia-image"), {
        filename: "product.png",
        contentType: "image/png",
      })
      .expect(200);

    assert.match(uploadedImage.body.data.imageUrl, /^data:image\/png;base64,/);
  });

  test("blocks non-admin users from creating products", async () => {
    await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .send({
        name: "Blocked Product",
        price: 1,
        category: "Snacks",
      })
      .expect(403);
  });
});

describe("Recipes", () => {
  test("lets an admin create, update, and delete a recipe; reads are public", async () => {
    const blockedCreate = await request(app)
      .post("/api/recipes")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .send({ name: "Blocked Recipe" })
      .expect(403);
    assert.equal(blockedCreate.body.success, false);

    const created = await request(app)
      .post("/api/recipes")
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .send({
        name: "Test Salad",
        description: "A fresh test salad.",
        category: "Easy",
        imageUrl: "https://example.com/salad.jpg",
        calories: 200,
        carbo: 10,
        protein: 5,
        popular: true,
        ingredients: ["Lettuce", "Tomato"],
        preparation: "Mix everything together.",
      })
      .expect(201);

    assert.equal(created.body.data.name, "Test Salad");
    assert.deepEqual(created.body.data.ingredients, ["Lettuce", "Tomato"]);
    ctx.recipeId = created.body.data._id;

    const list = await request(app).get("/api/recipes").expect(200);
    assert.equal(list.body.data.some((r) => r._id === ctx.recipeId), true);

    const filtered = await request(app).get("/api/recipes?category=Easy").expect(200);
    assert.equal(filtered.body.data.every((r) => r.category === "Easy"), true);

    const detail = await request(app).get(`/api/recipes/${ctx.recipeId}`).expect(200);
    assert.equal(detail.body.data.name, "Test Salad");

    const updated = await request(app)
      .put(`/api/recipes/${ctx.recipeId}`)
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .send({ name: "Updated Salad", popular: false })
      .expect(200);
    assert.equal(updated.body.data.name, "Updated Salad");
    assert.equal(updated.body.data.popular, false);

    await request(app)
      .delete(`/api/recipes/${ctx.recipeId}`)
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .expect(403);

    await request(app)
      .delete(`/api/recipes/${ctx.recipeId}`)
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .expect(200);

    await request(app).get(`/api/recipes/${ctx.recipeId}`).expect(404);
  });
});

describe("Barcode", () => {
  test("finds a product by its barcode", async () => {
    await Product.findByIdAndUpdate(ctx.productId, {
      barcode: "3017620422003",
    });

    const found = await request(app)
      .get("/api/products/barcode/3017620422003")
      .expect(200);

    assert.equal(found.body.data._id, ctx.productId);
    assert.equal(found.body.data.name, "Pain sans gluten");
  });

  test("returns 404 for an unknown barcode", async () => {
    const missing = await request(app)
      .get("/api/products/barcode/0000000000000")
      .expect(404);

    assert.equal(missing.body.success, false);
  });
});

describe("Orders", () => {
  test("lets a customer place an order and clears their cart", async () => {
    await Cart.create({
      user: ctx.customerId,
      items: [
        {
          product: ctx.productId,
          name: "Pain sans gluten",
          qty: 1,
          price: 4.5,
          imageUrl: "https://example.com/pain.jpg",
        },
      ],
    });

    const order = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .send({
        items: [
          {
            productId: ctx.productId,
            name: "Client supplied name ignored",
            qty: 2,
            price: 999,
          },
        ],
        address: {
          fullName: "Customer One",
          addressLine: "12 Gluten Free Street",
          city: "Tunis",
          phone: "+21600000000",
        },
      })
      .expect(201);

    assert.equal(order.body.success, true);
    assert.equal(order.body.data.total, 9);
    assert.equal(order.body.data.items[0].name, "Pain sans gluten");
    assert.equal(order.body.data.items[0].price, 4.5);
    assert.equal(order.body.data.status, "confirmed");

    ctx.orderId = order.body.data._id;

    const emptiedCart = await Cart.findOne({ user: ctx.customerId });
    assert.equal(emptiedCart.items.length, 0);

    const myOrders = await request(app)
      .get("/api/orders/my")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .expect(200);

    assert.equal(myOrders.body.data.length, 1);

    const adminOrders = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .expect(200);

    assert.equal(adminOrders.body.data.length, 1);
    assert.equal(adminOrders.body.data[0].user.email, "customer@glutenia.test");
  });

  test("restricts order details to the owner or an admin", async () => {
    const orderDetail = await request(app)
      .get(`/api/orders/${ctx.orderId}`)
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .expect(200);

    assert.equal(orderDetail.body.data.total, 9);

    const secondCustomer = await registerCustomer({
      name: "Customer Two",
      email: "customer2@glutenia.test",
      password: "secret123",
    });

    await request(app)
      .get(`/api/orders/${ctx.orderId}`)
      .set("Authorization", `Bearer ${secondCustomer.token}`)
      .expect(403);

    const users = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .expect(200);

    assert.equal(users.body.data.length, 3);
    assert.equal(users.body.data.some((user) => user.password), false);

    const userOrders = await request(app)
      .get(`/api/users/${ctx.customerId}/orders`)
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .expect(200);

    assert.equal(userOrders.body.data.length, 1);

    const deletedProduct = await request(app)
      .delete(`/api/products/${ctx.productId}`)
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .expect(200);

    assert.equal(deletedProduct.body.data._id, ctx.productId);
  });
});

describe("AI endpoint", () => {
  test("rejects a scan request without an image", async () => {
    const response = await request(app)
      .post("/api/scan/label")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .send({})
      .expect(400);

    assert.equal(response.body.success, false);
    assert.equal(response.body.message, "No image provided");
  });

  test("rejects a scan request without authentication", async () => {
    await request(app)
      .post("/api/scan/label")
      .send({ imageBase64: "not-a-real-image" })
      .expect(401);
  });
});

describe("Notifications", () => {
  test("notifies a customer when they RSVP to an event, and lets them read it", async () => {
    const event = await Event.create({
      title: "Gluten-Free Market",
      date: "2026-08-01",
      location: "Tunis",
      category: "Markets",
      createdBy: ctx.adminId,
    });

    const rsvp = await request(app)
      .post(`/api/events/${event._id}/rsvp`)
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .expect(200);

    assert.equal(rsvp.body.data.isGoing, true);

    const afterJoin = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .expect(200);

    const joinNotification = afterJoin.body.data.find((n) => n.type === "event_join");
    assert.ok(joinNotification, "expected an event_join notification");
    assert.equal(joinNotification.read, false);

    await request(app)
      .post(`/api/events/${event._id}/rsvp`)
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .expect(200);

    const afterLeave = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .expect(200);

    assert.ok(afterLeave.body.data.some((n) => n.type === "event_leave"));

    const markedRead = await request(app)
      .put(`/api/notifications/${joinNotification._id}/read`)
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .expect(200);

    assert.equal(markedRead.body.data.read, true);

    await request(app)
      .put("/api/notifications/read-all")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .expect(200);

    const afterReadAll = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .expect(200);

    assert.equal(
      afterReadAll.body.data.every((n) => n.read),
      true
    );
  });

  test("notifies a customer when their order is marked shipped, and blocks professionals who don't own it", async () => {
    const outsiderPassword = await bcrypt.hash("secret123", 12);
    await User.create({
      name: "Unrelated Professional",
      email: "outsider@glutenia.test",
      password: outsiderPassword,
      role: "professional",
      professionalStatus: "approved",
    });

    const outsiderLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "outsider@glutenia.test", password: "secret123" })
      .expect(200);

    await request(app)
      .put(`/api/orders/${ctx.orderId}/status`)
      .set("Authorization", `Bearer ${outsiderLogin.body.data.token}`)
      .send({ status: "shipped" })
      .expect(403);

    const updated = await request(app)
      .put(`/api/orders/${ctx.orderId}/status`)
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .send({ status: "shipped" })
      .expect(200);

    assert.equal(updated.body.data.status, "shipped");

    const notifications = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .expect(200);

    const shippedNotification = notifications.body.data.find(
      (n) => n.type === "order_status"
    );
    assert.ok(shippedNotification, "expected an order_status notification");
    assert.match(shippedNotification.body, /on its way/i);
  });
});
