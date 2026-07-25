// Read-only export of records left orphaned by the 2026-07-22 accidental
// User/Product wipe. Writes full documents to local JSON files so nothing
// is lost if a cleanup ever deletes them from the live database. Does not
// modify the database in any way.
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");

const OUT_DIR = path.join(__dirname, "..", "orphaned-data-backup-2026-07-22");

const run = async () => {
  await connectDB();
  const db = mongoose.connection.db;

  const existingUserIds = new Set(
    (await db.collection("users").find({}, { projection: { _id: 1 } }).toArray()).map((d) =>
      d._id.toString()
    )
  );
  const existingProductIds = new Set(
    (await db.collection("products").find({}, { projection: { _id: 1 } }).toArray()).map((d) =>
      d._id.toString()
    )
  );

  const isOrphanUserId = (id) => id && !existingUserIds.has(id.toString());

  const specs = [
    { name: "orders", refField: "user" },
    { name: "establishments", refField: "owner" },
    { name: "events", refField: "createdBy" },
    { name: "usergamifications", refField: "userId" },
    { name: "userbadges", refField: "userId" },
    { name: "xpledgers", refField: "userId" },
    { name: "notifications", refField: "user" },
    { name: "scanhistories", refField: "userId" },
  ];

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const summary = {};
  for (const { name, refField } of specs) {
    const all = await db.collection(name).find({}).toArray();
    const orphaned = all.filter((doc) => isOrphanUserId(doc[refField]));
    fs.writeFileSync(
      path.join(OUT_DIR, `${name}.json`),
      JSON.stringify(orphaned, null, 2)
    );
    summary[name] = { total: all.length, orphaned: orphaned.length };
  }

  console.log("Export complete →", OUT_DIR);
  console.table(summary);

  await mongoose.disconnect();
};

run();
