const fs = require("fs");
const path = require("path");

// Function to recursively get all files in a directory
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (
      file.endsWith(".tsx") ||
      file.endsWith(".ts") ||
      file.endsWith(".jsx") ||
      file.endsWith(".js")
    ) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

// Function to convert dark mode classes to light mode only
function convertToLightMode(content) {
  // Remove all dark: prefixed classes
  content = content.replace(/\s+dark:[^\s"'`}]+/g, "");

  // Replace light: prefix with no prefix (make it the default)
  content = content.replace(/light:/g, "");

  return content;
}

// Get all TypeScript/JavaScript files in src
const srcPath = path.join(__dirname, "../src");
const files = getAllFiles(srcPath);

let modifiedCount = 0;

files.forEach((file) => {
  const content = fs.readFileSync(file, "utf8");
  const newContent = convertToLightMode(content);

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, "utf8");
    console.log(`✓ Modified: ${path.relative(srcPath, file)}`);
    modifiedCount++;
  }
});

console.log(`\n✅ Conversion complete! Modified ${modifiedCount} files.`);
