const assert = require("node:assert/strict");
const test = require("node:test");

const { getDbNameFromUri } = require("../src/config/db");

test("reads database name from MongoDB URI when present", () => {
  assert.equal(
    getDbNameFromUri("mongodb://127.0.0.1:27017/glutenia_test"),
    "glutenia_test"
  );
  assert.equal(
    getDbNameFromUri(
      "mongodb+srv://user:pass@example.mongodb.net/glutenia?retryWrites=true"
    ),
    "glutenia"
  );
});

test("returns null for Atlas URI without a database path", () => {
  assert.equal(
    getDbNameFromUri(
      "mongodb+srv://user:pass@example.mongodb.net/?retryWrites=true&appName=glutenia"
    ),
    null
  );
});
