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
const CommunityProduct = require("../src/models/CommunityProduct");
const Establishment = require("../src/models/Establishment");
const Event = require("../src/models/Event");
const Listing = require("../src/models/Listing");
const MissingBarcode = require("../src/models/MissingBarcode");
const Notification = require("../src/models/Notification");
const Order = require("../src/models/Order");
const PatientResource = require("../src/models/PatientResource");
const Product = require("../src/models/Product");
const Recipe = require("../src/models/Recipe");
const ScanHistory = require("../src/models/ScanHistory");
const User = require("../src/models/User");

const resetDatabase = async () => {
  await Promise.all([
    Cart.deleteMany({}),
    CommunityProduct.deleteMany({}),
    Establishment.deleteMany({}),
    Event.deleteMany({}),
    Listing.deleteMany({}),
    MissingBarcode.deleteMany({}),
    Notification.deleteMany({}),
    Order.deleteMany({}),
    PatientResource.deleteMany({}),
    Product.deleteMany({}),
    Recipe.deleteMany({}),
    ScanHistory.deleteMany({}),
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

const ctx = {};

const registerCustomer = async ({ name, email, password, role }) => {
  const registerResponse = await request(app)
    .post("/api/auth/register")
    .send({ name, email, password, role })
    .expect(201);

  return registerResponse.body.data;
};

const createApprovedProfessional = async ({ name, email, password }) => {
  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    password: hashed,
    role: "professional",
    professionalStatus: "approved",
  });

  const login = await request(app)
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);

  return { id: user._id.toString(), token: login.body.data.token };
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

    const professional = await createApprovedProfessional({
      name: "Professional One",
      email: "professional@glutenia.test",
      password: "seller123",
    });
    ctx.professionalId = professional.id;
    ctx.professionalToken = professional.token;
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

describe("Products & Listings", () => {
  test("lets an admin manage the catalog, and a professional attach a listing to it", async () => {
    const createdProduct = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .send({
        name: "Pain sans gluten",
        description: "Pain moelleux sans gluten.",
        category: "Bread",
        imageUrl: "https://example.com/pain.jpg",
        isGlutenFree: true,
      })
      .expect(201);

    assert.equal(createdProduct.body.success, true);
    assert.equal(createdProduct.body.data.createdBy, ctx.adminId);
    assert.equal(createdProduct.body.data.price, undefined);
    assert.equal(createdProduct.body.data.stock, undefined);

    ctx.productId = createdProduct.body.data._id;

    const productDetail = await request(app)
      .get(`/api/products/${ctx.productId}`)
      .expect(200);
    assert.equal(productDetail.body.data.name, "Pain sans gluten");

    await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${ctx.professionalToken}`)
      .send({ name: "Should be blocked", category: "Snacks" })
      .expect(403);

    const createdListing = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${ctx.professionalToken}`)
      .send({ productId: ctx.productId, price: 4.5, stock: 25 })
      .expect(201);

    assert.equal(createdListing.body.success, true);
    assert.equal(createdListing.body.data.name, "Pain sans gluten");
    assert.equal(createdListing.body.data.price, 4.5);
    assert.equal(createdListing.body.data.stock, 25);

    ctx.listingId = createdListing.body.data._id;

    await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${ctx.professionalToken}`)
      .send({ productId: ctx.productId, price: 5, stock: 10 })
      .expect(409);

    const listings = await request(app)
      .get("/api/listings?category=Bread&search=pain")
      .expect(200);
    assert.equal(listings.body.data.length, 1);
    assert.equal(listings.body.data[0]._id, ctx.listingId);

    const updatedListing = await request(app)
      .put(`/api/listings/${ctx.listingId}`)
      .set("Authorization", `Bearer ${ctx.professionalToken}`)
      .send({ stock: 20 })
      .expect(200);
    assert.equal(updatedListing.body.data.stock, 20);

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

  test("blocks non-admin users from creating catalog products", async () => {
    await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .send({
        name: "Blocked Product",
        category: "Snacks",
      })
      .expect(403);
  });

  test("blocks a professional from managing another professional's listing, but admin can moderate it", async () => {
    const outsider = await createApprovedProfessional({
      name: "Other Professional",
      email: "other-seller@glutenia.test",
      password: "secret123",
    });

    await request(app)
      .put(`/api/listings/${ctx.listingId}`)
      .set("Authorization", `Bearer ${outsider.token}`)
      .send({ price: 999 })
      .expect(403);

    await request(app)
      .put(`/api/listings/${ctx.listingId}`)
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .send({ price: 4.5 })
      .expect(200);
  });
});

describe("Establishments", () => {
  test("lets a professional set up their establishment, and an admin verify or delete it", async () => {
    const upserted = await request(app)
      .put("/api/establishments/mine")
      .set("Authorization", `Bearer ${ctx.professionalToken}`)
      .send({ name: "Test Bakery", category: "Bakery", latitude: 36.8, longitude: 10.18 })
      .expect(200);

    assert.equal(upserted.body.data.verified, false);
    ctx.establishmentId = upserted.body.data._id;

    const publicListBefore = await request(app).get("/api/establishments").expect(200);
    assert.equal(
      publicListBefore.body.data.some((e) => e._id === ctx.establishmentId),
      false
    );

    await request(app)
      .get("/api/establishments/pending")
      .set("Authorization", `Bearer ${ctx.professionalToken}`)
      .expect(403);

    await request(app)
      .put(`/api/establishments/${ctx.establishmentId}/verify`)
      .set("Authorization", `Bearer ${ctx.professionalToken}`)
      .expect(403);

    const pending = await request(app)
      .get("/api/establishments/pending")
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .expect(200);

    assert.ok(pending.body.data.some((e) => e._id === ctx.establishmentId));

    const verified = await request(app)
      .put(`/api/establishments/${ctx.establishmentId}/verify`)
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .expect(200);

    assert.equal(verified.body.data.verified, true);

    const publicListAfter = await request(app).get("/api/establishments").expect(200);
    assert.ok(publicListAfter.body.data.some((e) => e._id === ctx.establishmentId));

    const pendingAfter = await request(app)
      .get("/api/establishments/pending")
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .expect(200);

    assert.equal(pendingAfter.body.data.some((e) => e._id === ctx.establishmentId), false);

    await request(app)
      .delete(`/api/establishments/${ctx.establishmentId}`)
      .set("Authorization", `Bearer ${ctx.professionalToken}`)
      .expect(403);

    await request(app)
      .delete(`/api/establishments/${ctx.establishmentId}`)
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .expect(200);
  });
});

describe("Own establishment deletion", () => {
  test("lets a professional delete their own establishment, and 404s when none is left", async () => {
    await request(app)
      .delete("/api/establishments/mine")
      .expect(401);

    const upserted = await request(app)
      .put("/api/establishments/mine")
      .set("Authorization", `Bearer ${ctx.professionalToken}`)
      .send({ name: "Delete Me Cafe", category: "Restaurant", latitude: 36.8, longitude: 10.18 })
      .expect(200);

    const removed = await request(app)
      .delete("/api/establishments/mine")
      .set("Authorization", `Bearer ${ctx.professionalToken}`)
      .expect(200);
    assert.equal(removed.body.data._id, upserted.body.data._id);

    const mine = await request(app)
      .get("/api/establishments/mine")
      .set("Authorization", `Bearer ${ctx.professionalToken}`)
      .expect(200);
    assert.equal(mine.body.data, null);

    await request(app)
      .delete("/api/establishments/mine")
      .set("Authorization", `Bearer ${ctx.professionalToken}`)
      .expect(404);
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

describe("Patient Resources", () => {
  test("lets an admin create, update, and delete a patient resource; reads are public", async () => {
    const blockedCreate = await request(app)
      .post("/api/patient-resources")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .send({ title: "Blocked Resource" })
      .expect(403);
    assert.equal(blockedCreate.body.success, false);

    const created = await request(app)
      .post("/api/patient-resources")
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .send({
        title: "Test Resource",
        description: "A test patient resource.",
        body: "Full article body.",
        category: "diet",
        readTimeMinutes: 5,
        featured: true,
      })
      .expect(201);

    assert.equal(created.body.data.title, "Test Resource");
    assert.equal(created.body.data.featured, true);
    ctx.patientResourceId = created.body.data._id;

    const list = await request(app).get("/api/patient-resources").expect(200);
    assert.equal(list.body.data.some((r) => r._id === ctx.patientResourceId), true);

    const filtered = await request(app).get("/api/patient-resources?category=diet").expect(200);
    assert.equal(filtered.body.data.every((r) => r.category === "diet"), true);

    const detail = await request(app).get(`/api/patient-resources/${ctx.patientResourceId}`).expect(200);
    assert.equal(detail.body.data.title, "Test Resource");

    const updated = await request(app)
      .put(`/api/patient-resources/${ctx.patientResourceId}`)
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .send({ title: "Updated Resource", featured: false })
      .expect(200);
    assert.equal(updated.body.data.title, "Updated Resource");
    assert.equal(updated.body.data.featured, false);

    await request(app)
      .delete(`/api/patient-resources/${ctx.patientResourceId}`)
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .expect(403);

    await request(app)
      .delete(`/api/patient-resources/${ctx.patientResourceId}`)
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .expect(200);

    await request(app).get(`/api/patient-resources/${ctx.patientResourceId}`).expect(404);
  });
});

describe("Barcode", () => {
  test("finds a sellable listing by its catalog product's barcode", async () => {
    await Product.findByIdAndUpdate(ctx.productId, {
      barcode: "3017620422003",
    });

    const found = await request(app)
      .get("/api/products/barcode/3017620422003")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .expect(200);

    assert.equal(found.body.data._id, ctx.listingId);
    assert.equal(found.body.data.product, ctx.productId);
    assert.equal(found.body.data.name, "Pain sans gluten");
    assert.equal(found.body.data.price, 4.5);
  });

  test("returns 404 for an unknown barcode", async () => {
    const missing = await request(app)
      .get("/api/products/barcode/0000000000000")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
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
            listingId: ctx.listingId,
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
    assert.equal(order.body.data.total, 16);
    assert.equal(order.body.data.items[0].name, "Pain sans gluten");
    assert.equal(order.body.data.items[0].price, 4.5);
    assert.equal(order.body.data.items[0].listing, ctx.listingId);
    assert.equal(order.body.data.status, "pending");
    assert.equal(order.body.data.sellerStatuses.length, 1);
    assert.equal(order.body.data.sellerStatuses[0].status, "pending");
    assert.equal(order.body.data.statusHistory[0].role, "customer");

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

  test("lets the professional see the order among their seller orders", async () => {
    const sellerOrders = await request(app)
      .get("/api/orders/seller")
      .set("Authorization", `Bearer ${ctx.professionalToken}`)
      .expect(200);

    assert.equal(sellerOrders.body.data.length, 1);
    assert.equal(sellerOrders.body.data[0]._id, ctx.orderId);
    assert.equal(sellerOrders.body.data[0].items.length, 1);
    assert.equal(sellerOrders.body.data[0].items[0].listing, ctx.listingId);
  });

  test("restricts order details to the owner or an admin", async () => {
    const orderDetail = await request(app)
      .get(`/api/orders/${ctx.orderId}`)
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .expect(200);

    assert.equal(orderDetail.body.data.total, 16);

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

    assert.equal(users.body.data.length, 5);
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

describe("Orders - stock integrity", () => {
  const createStockedListing = async (stock, name = `Stock Test ${Date.now()}-${Math.random()}`) => {
    const product = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .send({ name, category: "Bread" })
      .expect(201);

    const listing = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${ctx.professionalToken}`)
      .send({ productId: product.body.data._id, price: 3, stock })
      .expect(201);

    return listing.body.data._id;
  };

  const address = {
    fullName: "Stock Tester",
    addressLine: "1 Test Street",
    city: "Tunis",
    phone: "+21600000001",
  };

  test("decrements stock by the ordered quantity on success", async () => {
    const listingId = await createStockedListing(2);

    await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .send({ items: [{ listingId, qty: 2 }], address })
      .expect(201);

    const listing = await request(app).get(`/api/listings/${listingId}`).expect(200);
    assert.equal(listing.body.data.stock, 0);
  });

  test("rejects an order that exceeds available stock, leaving stock unchanged", async () => {
    const listingId = await createStockedListing(1);

    const rejected = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .send({ items: [{ listingId, qty: 2 }], address })
      .expect(409);
    assert.equal(rejected.body.success, false);
    assert.match(rejected.body.message, /only 1/i);

    const listing = await request(app).get(`/api/listings/${listingId}`).expect(200);
    assert.equal(listing.body.data.stock, 1);
  });

  test("rejects ordering an out-of-stock listing", async () => {
    const listingId = await createStockedListing(0);

    const rejected = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .send({ items: [{ listingId, qty: 1 }], address })
      .expect(409);
    assert.match(rejected.body.message, /out of stock/i);
  });

  test("rolls back the whole order when one of several items has insufficient stock", async () => {
    const plentyId = await createStockedListing(5);
    const scarceId = await createStockedListing(1);

    await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .send({
        items: [
          { listingId: plentyId, qty: 2 },
          { listingId: scarceId, qty: 5 },
        ],
        address,
      })
      .expect(409);

    const plenty = await request(app).get(`/api/listings/${plentyId}`).expect(200);
    const scarce = await request(app).get(`/api/listings/${scarceId}`).expect(200);
    assert.equal(plenty.body.data.stock, 5, "unaffected item's stock must not be decremented when the order as a whole fails");
    assert.equal(scarce.body.data.stock, 1);
  });

  test("returns 404 for a listing that doesn't exist", async () => {
    await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .send({ items: [{ listingId: new mongoose.Types.ObjectId().toString(), qty: 1 }], address })
      .expect(404);
  });

  test("lets only one of two concurrent orders win the last unit of stock", async () => {
    const listingId = await createStockedListing(1);

    const placeOrder = () =>
      request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${ctx.customerToken}`)
        .send({ items: [{ listingId, qty: 1 }], address });

    const [first, second] = await Promise.all([placeOrder(), placeOrder()]);
    const statuses = [first.status, second.status].sort();
    assert.deepEqual(statuses, [201, 409], "exactly one concurrent order for the last unit should succeed");

    const listing = await request(app).get(`/api/listings/${listingId}`).expect(200);
    assert.equal(listing.body.data.stock, 0);
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

    await request(app)
      .put(`/api/orders/${ctx.orderId}/status`)
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .send({ status: "confirmed" })
      .expect(200);

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

describe("Admin user management", () => {
  test("lets an admin view, update, and delete a user; blocks non-admins", async () => {
    const target = await registerCustomer({
      name: "Managed User",
      email: "managed@glutenia.test",
      password: "secret123",
    });
    const targetId = target.user._id;

    await request(app)
      .get(`/api/users/${targetId}`)
      .set("Authorization", `Bearer ${target.token}`)
      .expect(403);

    const detail = await request(app)
      .get(`/api/users/${targetId}`)
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .expect(200);

    assert.equal(detail.body.data.user.email, "managed@glutenia.test");
    assert.equal(detail.body.data.user.password, undefined);
    assert.equal(detail.body.data.orderCount, 0);

    await request(app)
      .put(`/api/users/${targetId}`)
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .send({ email: "customer@glutenia.test" })
      .expect(409);

    const updated = await request(app)
      .put(`/api/users/${targetId}`)
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .send({ name: "Renamed User", phone: "+216 20 123 456" })
      .expect(200);

    assert.equal(updated.body.data.name, "Renamed User");
    assert.equal(updated.body.data.phone, "+216 20 123 456");

    const admin = await User.findOne({ email: "admin@glutenia.test" });
    await request(app)
      .delete(`/api/users/${admin._id}`)
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .expect(400);

    await request(app)
      .delete(`/api/users/${targetId}`)
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .expect(200);

    assert.equal(await User.exists({ _id: targetId }), null);

    await request(app)
      .get(`/api/users/${targetId}`)
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .expect(404);
  });
});

describe("Admin order deletion", () => {
  test("lets only an admin delete an order, restoring reserved stock", async () => {
    const product = await Product.create({ name: "Deletable Bread", category: "Bread" });
    const pro = await createApprovedProfessional({
      name: "Stock Seller",
      email: "stockseller@glutenia.test",
      password: "secret123",
    });
    const listing = await Listing.create({
      product: product._id,
      professional: pro.id,
      price: 5,
      stock: 10,
    });

    const created = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .send({
        items: [{ listingId: listing._id.toString(), qty: 3 }],
        address: { fullName: "C", addressLine: "1 St", city: "Tunis", phone: "20123456" },
      })
      .expect(201);

    assert.equal((await Listing.findById(listing._id)).stock, 7);

    await request(app)
      .delete(`/api/orders/${created.body.data._id}`)
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .expect(403);

    await request(app)
      .delete(`/api/orders/${created.body.data._id}`)
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .expect(200);

    assert.equal(await Order.exists({ _id: created.body.data._id }), null);
    assert.equal((await Listing.findById(listing._id)).stock, 10);
  });
});

describe("Self-service account deletion", () => {
  test("removes a professional's establishment and listings along with the account", async () => {
    const seller = await createApprovedProfessional({
      name: "Leaving Seller",
      email: "leaving-seller@glutenia.test",
      password: "seller123",
    });
    const product = await Product.create({ name: "Farewell Bread", category: "Bread" });

    await request(app)
      .put("/api/establishments/mine")
      .set("Authorization", `Bearer ${seller.token}`)
      .send({ name: "Closing Shop", category: "Bakery", latitude: 36.8, longitude: 10.18 })
      .expect(200);

    await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${seller.token}`)
      .send({ productId: product._id, price: 3, stock: 5 })
      .expect(201);

    await request(app)
      .delete("/api/auth/me")
      .set("Authorization", `Bearer ${seller.token}`)
      .send({ password: "seller123" })
      .expect(200);

    assert.equal(await User.exists({ _id: seller.id }), null);
    assert.equal(await Establishment.exists({ owner: seller.id }), null);
    assert.equal(await Listing.exists({ professional: seller.id }), null);
  });
});

describe("Community product submission", () => {
  const labelScan = (userId, verdict, extra = {}) =>
    ScanHistory.create({ userId, scanType: "label", verdict, ...extra });

  const submit = (token, body) =>
    request(app)
      .post("/api/community-products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Mystery Biscuits", imageUrl: "data:image/jpeg;base64,AAAA", ...body });

  test("takes the gluten status from the user's label scan, never from the client", async () => {
    const safeScan = await labelScan(ctx.customerId, "safe");
    const created = await submit(ctx.customerToken, {
      barcode: "4006381333931",
      labelScanId: safeScan._id.toString(),
      isGlutenFree: false,
    }).expect(201);
    assert.equal(created.body.data.entry.isGlutenFree, true);

    const unsafeScan = await labelScan(ctx.customerId, "unsafe");
    const flagged = await submit(ctx.customerToken, {
      barcode: "5901234123457",
      labelScanId: unsafeScan._id.toString(),
      isGlutenFree: true,
    }).expect(201);
    assert.equal(flagged.body.data.entry.isGlutenFree, false);

    await submit(ctx.customerToken, {
      barcode: "4007817327098",
      labelScanId: safeScan._id.toString(),
    }).expect(400);
  });

  test("rejects missing, unclear, stale, or someone else's label scans", async () => {
    await submit(ctx.customerToken, { barcode: "4007817327098" }).expect(400);

    const caution = await labelScan(ctx.customerId, "caution");
    await submit(ctx.customerToken, {
      barcode: "4007817327098",
      labelScanId: caution._id.toString(),
    }).expect(400);

    const stale = await labelScan(ctx.customerId, "safe", {
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    });
    await submit(ctx.customerToken, {
      barcode: "4007817327098",
      labelScanId: stale._id.toString(),
    }).expect(400);

    const othersScan = await labelScan(ctx.professionalId, "safe");
    await submit(ctx.customerToken, {
      barcode: "4007817327098",
      labelScanId: othersScan._id.toString(),
    }).expect(400);

    assert.equal(await CommunityProduct.exists({ barcode: "4007817327098" }), null);
  });
});

describe("Community product admin review", () => {
  const asAdmin = (req) => req.set("Authorization", `Bearer ${ctx.adminToken}`);

  test("only an admin can list, review, or delete community reports", async () => {
    const entry = await CommunityProduct.findOne({ barcode: "4006381333931" });
    for (const token of [ctx.customerToken, ctx.professionalToken]) {
      await request(app).get("/api/community-products").set("Authorization", `Bearer ${token}`).expect(403);
      await request(app)
        .patch(`/api/community-products/${entry._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ isGlutenFree: false })
        .expect(403);
      await request(app)
        .delete(`/api/community-products/${entry._id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    }
  });

  test("lists every reported barcode, flagged ones first, with the submitter", async () => {
    const flaggedEntry = await CommunityProduct.findOne({ barcode: "5901234123457" });
    await request(app)
      .post(`/api/community-products/${flaggedEntry._id}/flag`)
      .set("Authorization", `Bearer ${ctx.professionalToken}`)
      .expect(200);

    const list = await asAdmin(request(app).get("/api/community-products")).expect(200);
    const barcodes = list.body.data.map((e) => e.barcode);
    assert.ok(barcodes.includes("4006381333931"));
    assert.equal(barcodes[0], "5901234123457");
    assert.equal(list.body.data[0].flagCount, 1);
    assert.equal(list.body.data[0].submittedBy.email, "customer@glutenia.test");
    assert.deepEqual(
      list.body.data[0].flaggedBy.map((u) => u.email),
      ["professional@glutenia.test"]
    );
  });

  test("a review corrects the gluten status and clears the flags", async () => {
    const entry = await CommunityProduct.findOne({ barcode: "5901234123457" });
    entry.flaggedBy = [ctx.professionalId, ctx.adminId, ctx.customerId];
    entry.flagCount = 3;
    entry.disputed = true;
    await entry.save();

    const reviewed = await asAdmin(request(app).patch(`/api/community-products/${entry._id}`))
      .send({ isGlutenFree: true })
      .expect(200);
    assert.equal(reviewed.body.data.isGlutenFree, true);
    assert.equal(reviewed.body.data.flagCount, 0);
    assert.equal(reviewed.body.data.disputed, false);

    const confirmed = await asAdmin(request(app).patch(`/api/community-products/${entry._id}`))
      .send({})
      .expect(200);
    assert.equal(confirmed.body.data.isGlutenFree, true);

    await asAdmin(request(app).patch(`/api/community-products/${entry._id}`))
      .send({ isGlutenFree: "yes" })
      .expect(400);
  });

  test("a deleted report no longer answers a barcode scan", async () => {
    const entry = await CommunityProduct.findOne({ barcode: "4006381333931" });
    await asAdmin(request(app).delete(`/api/community-products/${entry._id}`)).expect(200);
    await asAdmin(request(app).delete(`/api/community-products/${entry._id}`)).expect(404);
    assert.equal(await CommunityProduct.exists({ barcode: "4006381333931" }), null);
  });
});

describe("Missing barcodes", () => {
  const scan = (token, code) =>
    request(app)
      .get(`/api/products/barcode/${code}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);
  const listMissing = (token = ctx.adminToken) =>
    request(app).get("/api/products/missing-barcodes").set("Authorization", `Bearer ${token}`);

  test("records unknown scans, counting scans and distinct users, most wanted first", async () => {
    await MissingBarcode.deleteMany({});
    await scan(ctx.customerToken, "0000000000000");
    await scan(ctx.customerToken, "8712345678906");
    await scan(ctx.customerToken, "8712345678906");
    await scan(ctx.professionalToken, "8712345678906");
    await scan(ctx.customerToken, "96385074");
    await scan(ctx.customerToken, "1234567890123");

    const list = await listMissing().expect(200);
    assert.deepEqual(
      list.body.data.map((e) => [e.barcode, e.scanCount, e.userCount]),
      [
        ["8712345678906", 3, 2],
        ["96385074", 1, 1],
      ]
    );

    await listMissing(ctx.customerToken).expect(403);
    await listMissing(ctx.professionalToken).expect(403);
  });

  test("a barcode added to the catalog drops off the list, and the admin can dismiss one", async () => {
    await Product.create({ name: "Found At Last", category: "Snacks", barcode: "8712345678906" });
    const list = await listMissing().expect(200);
    assert.deepEqual(list.body.data.map((e) => e.barcode), ["96385074"]);

    const id = list.body.data[0]._id;
    await request(app)
      .delete(`/api/products/missing-barcodes/${id}`)
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .expect(403);
    await request(app)
      .delete(`/api/products/missing-barcodes/${id}`)
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .expect(200);
    assert.deepEqual((await listMissing().expect(200)).body.data, []);
  });
});

describe("Order status transitions", () => {
  const address = { fullName: "C", addressLine: "1 St", city: "Tunis", phone: "20123456" };

  const setup = async () => {
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const sellerA = await createApprovedProfessional({
      name: "Seller A",
      email: `seller-a-${stamp}@glutenia.test`,
      password: "secret123",
    });
    const sellerB = await createApprovedProfessional({
      name: "Seller B",
      email: `seller-b-${stamp}@glutenia.test`,
      password: "secret123",
    });
    const productA = await Product.create({ name: `Bread ${stamp}`, category: "Bread" });
    const productB = await Product.create({ name: `Pasta ${stamp}`, category: "Pasta" });
    const listingA = await Listing.create({ product: productA._id, professional: sellerA.id, price: 5, stock: 10 });
    const listingB = await Listing.create({ product: productB._id, professional: sellerB.id, price: 3, stock: 10 });
    return { sellerA, sellerB, listingA, listingB };
  };

  const placeOrder = async (listings) => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .send({ items: listings.map((l) => ({ listingId: l._id.toString(), qty: 2 })), address })
      .expect(201);
    return res.body.data;
  };

  const setStatus = (token, orderId, status) =>
    request(app)
      .put(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status });

  test("a seller confirms then ships their order; the customer marks it received", async () => {
    const { sellerA, listingA } = await setup();
    const order = await placeOrder([listingA]);
    assert.deepEqual(order.allowedActions, []);

    await setStatus(sellerA.token, order._id, "shipped").expect(400);
    await setStatus(sellerA.token, order._id, "delivered").expect(403);
    await setStatus(ctx.customerToken, order._id, "confirmed").expect(403);

    const confirmed = await setStatus(sellerA.token, order._id, "confirmed").expect(200);
    assert.equal(confirmed.body.data.status, "confirmed");
    assert.deepEqual(confirmed.body.data.allowedActions, ["shipped"]);

    await setStatus(sellerA.token, order._id, "confirmed").expect(400);
    await setStatus(ctx.customerToken, order._id, "delivered").expect(400);

    await setStatus(sellerA.token, order._id, "shipped").expect(200);

    const mine = await request(app)
      .get("/api/orders/my")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .expect(200);
    const shipped = mine.body.data.find((o) => o._id === order._id);
    assert.deepEqual(shipped.allowedActions, ["delivered"]);

    const delivered = await setStatus(ctx.customerToken, order._id, "delivered").expect(200);
    assert.equal(delivered.body.data.status, "delivered");
    assert.deepEqual(delivered.body.data.allowedActions, []);

    const saved = await Order.findById(order._id);
    assert.deepEqual(
      saved.statusHistory.map((h) => `${h.status}:${h.role}`),
      ["pending:customer", "confirmed:professional", "shipped:professional", "delivered:customer"]
    );

    await setStatus(ctx.adminToken, order._id, "delivered").expect(400);
    await setStatus(ctx.adminToken, order._id, "pending").expect(400);
  });

  test("in a multi-seller order each seller moves only their own part", async () => {
    const { sellerA, sellerB, listingA, listingB } = await setup();
    const order = await placeOrder([listingA, listingB]);
    assert.equal(order.sellerStatuses.length, 2);

    const afterA = await setStatus(sellerA.token, order._id, "confirmed").expect(200);
    assert.equal(afterA.body.data.status, "pending");

    await setStatus(sellerA.token, order._id, "confirmed").expect(400);

    const sellerView = await request(app)
      .get("/api/orders/seller")
      .set("Authorization", `Bearer ${sellerB.token}`)
      .expect(200);
    const bOrder = sellerView.body.data.find((o) => o._id === order._id);
    assert.equal(bOrder.sellerStatus, "pending");
    assert.equal(bOrder.items.length, 1);
    assert.deepEqual(bOrder.allowedActions, ["confirmed"]);

    const afterB = await setStatus(sellerB.token, order._id, "confirmed").expect(200);
    assert.equal(afterB.body.data.status, "confirmed");

    await setStatus(sellerA.token, order._id, "shipped").expect(200);
    await setStatus(ctx.customerToken, order._id, "delivered").expect(400);
    await setStatus(sellerB.token, order._id, "shipped").expect(200);
    await setStatus(ctx.customerToken, order._id, "delivered").expect(200);
  });

  test("an admin moves the whole order forward one step at a time", async () => {
    const { listingA, listingB } = await setup();
    const order = await placeOrder([listingA, listingB]);

    await setStatus(ctx.adminToken, order._id, "shipped").expect(400);
    const confirmed = await setStatus(ctx.adminToken, order._id, "confirmed").expect(200);
    assert.ok(confirmed.body.data.sellerStatuses.every((p) => p.status === "confirmed"));
    await setStatus(ctx.adminToken, order._id, "shipped").expect(200);
    const delivered = await setStatus(ctx.adminToken, order._id, "delivered").expect(200);
    assert.equal(delivered.body.data.status, "delivered");
  });

  test("blocks outsiders and other customers", async () => {
    const { listingA } = await setup();
    const order = await placeOrder([listingA]);
    const other = await registerCustomer({
      name: "Other Customer",
      email: `other-${Date.now()}@glutenia.test`,
      password: "secret123",
    });

    await setStatus(other.token, order._id, "confirmed").expect(403);
    await setStatus(ctx.professionalToken, order._id, "confirmed").expect(403);
  });

  test("deleting an order restores stock only for parts that haven't shipped", async () => {
    const { sellerA, listingA, listingB } = await setup();
    const order = await placeOrder([listingA, listingB]);

    await setStatus(sellerA.token, order._id, "confirmed").expect(200);
    await setStatus(sellerA.token, order._id, "shipped").expect(200);

    await request(app)
      .delete(`/api/orders/${order._id}`)
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .expect(200);

    assert.equal((await Listing.findById(listingA._id)).stock, 8);
    assert.equal((await Listing.findById(listingB._id)).stock, 10);
  });

  test("orders placed before per-seller statuses still work", async () => {
    const { sellerA, listingA } = await setup();
    const legacy = await Order.collection.insertOne({
      user: new mongoose.Types.ObjectId(ctx.customerId),
      items: [
        { product: listingA.product, listing: listingA._id, name: "Old bread", qty: 1, price: 5 },
      ],
      total: 12,
      deliveryFee: 7,
      address,
      status: "confirmed",
      createdAt: new Date(),
    });
    const orderId = legacy.insertedId.toString();

    const mine = await request(app)
      .get("/api/orders/my")
      .set("Authorization", `Bearer ${ctx.customerToken}`)
      .expect(200);
    const listed = mine.body.data.find((o) => o._id === orderId);
    assert.equal(listed.status, "confirmed");
    assert.deepEqual(listed.allowedActions, []);

    const shipped = await setStatus(sellerA.token, orderId, "shipped").expect(200);
    assert.equal(shipped.body.data.status, "shipped");
    const saved = await Order.findById(orderId);
    assert.equal(saved.sellerStatuses.length, 1);
    assert.equal(saved.items[0].professional.toString(), sellerA.id);
  });

  test("orders whose items have no listing still list, and deleting one leaves stock alone", async () => {
    const { listingA } = await setup();
    const totalStock = async () => (await Listing.find()).reduce((sum, l) => sum + l.stock, 0);
    const stockBefore = await totalStock();
    const ancient = await Order.collection.insertOne({
      user: new mongoose.Types.ObjectId(ctx.customerId),
      items: [{ product: listingA.product, name: "Ancient bread", qty: 2, price: 5 }],
      total: 17,
      deliveryFee: 7,
      address,
      status: "pending",
      createdAt: new Date(),
    });
    const orderId = ancient.insertedId.toString();

    for (const [path, token] of [
      ["/api/orders", ctx.adminToken],
      ["/api/orders/my", ctx.customerToken],
    ]) {
      const list = await request(app).get(path).set("Authorization", `Bearer ${token}`).expect(200);
      assert.ok(list.body.data.some((o) => o._id === orderId));
    }

    await request(app)
      .delete(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${ctx.adminToken}`)
      .expect(200);
    assert.equal(await totalStock(), stockBefore);
  });
});

describe("Login rate limiting", () => {
  const loginRateLimit = require("../src/middleware/loginRateLimit");

  test("locks an email after 5 failed logins and a success resets the count", async () => {
    loginRateLimit.reset();
    const email = "ratelimit@glutenia.test";
    await User.create({
      name: "Rate Limit",
      email,
      password: await bcrypt.hash("right123", 12),
      role: "customer",
    });

    for (let i = 0; i < 4; i += 1) {
      await request(app).post("/api/auth/login").send({ email, password: "wrong" }).expect(401);
    }
    await request(app).post("/api/auth/login").send({ email, password: "right123" }).expect(200);

    for (let i = 0; i < 5; i += 1) {
      await request(app).post("/api/auth/login").send({ email, password: "wrong" }).expect(401);
    }
    const blocked = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "right123" })
      .expect(429);
    assert.ok(blocked.headers["retry-after"]);

    await request(app)
      .post("/api/auth/login")
      .send({ email: "someone-else@glutenia.test", password: "wrong" })
      .expect(401);

    loginRateLimit.reset();
  });
});
