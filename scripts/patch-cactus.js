#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const buildGradlePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'cactus-react-native',
  'android',
  'build.gradle'
);

console.log('Patching Cactus build.gradle to only use arm64-v8a...');

if (!fs.existsSync(buildGradlePath)) {
  console.log('Cactus build.gradle not found, skipping patch');
  process.exit(0);
}

let content = fs.readFileSync(buildGradlePath, 'utf8');

// Replace the reactNativeArchitectures function to always return arm64-v8a
const oldFunction = `def reactNativeArchitectures() {
  def value = rootProject.getProperties().get("reactNativeArchitectures")
  return value ? value.split(",") : ["arm64-v8a"]
}`;

const newFunction = `def reactNativeArchitectures() {
  // Force arm64-v8a only (Cactus native libs only available for this arch)
  return ["arm64-v8a"]
}`;

if (content.includes(oldFunction)) {
  content = content.replace(oldFunction, newFunction);
  fs.writeFileSync(buildGradlePath, content, 'utf8');
  console.log('✅ Successfully patched Cactus to use arm64-v8a only');
} else {
  console.log('⚠️  Cactus build.gradle format changed, patch may not be needed');
}
