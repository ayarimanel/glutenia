const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// This machine has limited RAM; Metro's default worker pool (one process per
// CPU core) exhausts physical memory during release bundling and crashes with
// a native OOM ("Zone Allocation failed"). Capping to 1 worker trades bundle
// speed for a build that actually completes.
config.maxWorkers = 1;

module.exports = config;
