const assert = require("node:assert/strict");
const test = require("node:test");
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
const Order = require("../src/models/Order");
const Product = require("../src/models/Product");
const User = require("../src/models/User");

const resetDatabase = async () => {
  await Promise.all([
    Cart.deleteMany({}),
    Order.deleteMany({}),
    Product.deleteMany({}),
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

test("Glutenia API integration flow", async () => {
  const health = await request(app).get("/").expect(200);
  assert.equal(health.body.success, true);
  assert.equal(health.body.data.status, "running");

  const missing = await request(app).get("/missing-route").expect(404);
  assert.deepEqual(missing.body, {
    success: false,
    message: "Route not found",
  });

  const customerRegister = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Customer One",
      email: "customer@glutenia.test",
      password: "secret123",
    })
    .expect(201);

  assert.equal(customerRegister.body.success, true);
  assert.ok(customerRegister.body.data.token);
  assert.equal(customerRegister.body.data.user.email, "customer@glutenia.test");
  assert.equal(customerRegister.body.data.user.password, undefined);

  const customerToken = customerRegister.body.data.token;
  const customerId = customerRegister.body.data.user._id;

  const duplicate = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Customer Duplicate",
      email: "customer@glutenia.test",
      password: "secret123",
    })
    .expect(409);

  assert.equal(duplicate.body.success, false);

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
    .set("Authorization", `Bearer ${customerToken}`)
    .expect(200);

  assert.equal(me.body.data.email, "customer@glutenia.test");
  assert.equal(me.body.data.role, "customer");

  const adminPassword = await bcrypt.hash("admin123", 12);
  await User.create({
    name: "Admin",
    email: "admin@glutenia.test",
    password: adminPassword,
    role: "admin",
  });

  const adminLogin = await request(app)
    .post("/api/auth/login")
    .send({
      email: "admin@glutenia.test",
      password: "admin123",
    })
    .expect(200);

  const adminToken = adminLogin.body.data.token;

  await request(app)
    .post("/api/products")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({
      name: "Blocked Product",
      price: 1,
      category: "Snacks",
    })
    .expect(403);

  const createdProduct = await request(app)
    .post("/api/products")
    .set("Authorization", `Bearer ${adminToken}`)
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
  assert.equal(createdProduct.body.data.createdBy, adminLogin.body.data.user._id);

  const productId = createdProduct.body.data._id;

  const products = await request(app)
    .get("/api/products?category=Bread&search=pain")
    .expect(200);

  assert.equal(products.body.data.length, 1);
  assert.equal(products.body.data[0]._id, productId);

  const productDetail = await request(app)
    .get(`/api/products/${productId}`)
    .expect(200);

  assert.equal(productDetail.body.data.name, "Pain sans gluten");

  const updatedProduct = await request(app)
    .put(`/api/products/${productId}`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ stock: 20 })
    .expect(200);

  assert.equal(updatedProduct.body.data.stock, 20);

  const uploadedImage = await request(app)
    .put(`/api/products/${productId}/image`)
    .set("Authorization", `Bearer ${adminToken}`)
    .attach("image", Buffer.from("glutenia-image"), {
      filename: "product.png",
      contentType: "image/png",
    })
    .expect(200);

  assert.match(uploadedImage.body.data.imageUrl, /^data:image\/png;base64,/);

  await Cart.create({
    user: customerId,
    items: [
      {
        product: productId,
        name: "Pain sans gluten",
        qty: 1,
        price: 4.5,
        imageUrl: "https://example.com/pain.jpg",
      },
    ],
  });

  const order = await request(app)
    .post("/api/orders")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({
      items: [
        {
          productId,
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

  const emptiedCart = await Cart.findOne({ user: customerId });
  assert.equal(emptiedCart.items.length, 0);

  const myOrders = await request(app)
    .get("/api/orders/my")
    .set("Authorization", `Bearer ${customerToken}`)
    .expect(200);

  assert.equal(myOrders.body.data.length, 1);

  const adminOrders = await request(app)
    .get("/api/orders")
    .set("Authorization", `Bearer ${adminToken}`)
    .expect(200);

  assert.equal(adminOrders.body.data.length, 1);
  assert.equal(adminOrders.body.data[0].user.email, "customer@glutenia.test");

  const orderDetail = await request(app)
    .get(`/api/orders/${order.body.data._id}`)
    .set("Authorization", `Bearer ${customerToken}`)
    .expect(200);

  assert.equal(orderDetail.body.data.total, 9);

  const secondCustomer = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Customer Two",
      email: "customer2@glutenia.test",
      password: "secret123",
    })
    .expect(201);

  await request(app)
    .get(`/api/orders/${order.body.data._id}`)
    .set("Authorization", `Bearer ${secondCustomer.body.data.token}`)
    .expect(403);

  const users = await request(app)
    .get("/api/users")
    .set("Authorization", `Bearer ${adminToken}`)
    .expect(200);

  assert.equal(users.body.data.length, 3);
  assert.equal(users.body.data.some((user) => user.password), false);

  const userOrders = await request(app)
    .get(`/api/users/${customerId}/orders`)
    .set("Authorization", `Bearer ${adminToken}`)
    .expect(200);

  assert.equal(userOrders.body.data.length, 1);

  const deletedProduct = await request(app)
    .delete(`/api/products/${productId}`)
    .set("Authorization", `Bearer ${adminToken}`)
    .expect(200);

  assert.equal(deletedProduct.body.data._id, productId);
});
