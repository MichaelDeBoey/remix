const { execSync } = require("child_process");
const { readdirSync } = require("fs");
const { resolve, join } = require("path");

const packageDir = resolve(__dirname, "../packages");
const templatesDir = resolve(__dirname, "../templates");

/**
 * @param {string} dir
 */
const getAllChildDirs = (dir) =>
  readdirSync(dir, { withFileTypes: true })
    .filter((maybeDir) => maybeDir.isDirectory())
    .map((childDir) => join(dir, childDir.name));

const run = async () => {
  let packages = getAllChildDirs(packageDir);
  let templates = getAllChildDirs(templatesDir);

  console.log("Updating dependencies for root ...");
  execSync("npx npm-check-updates -u -t minor");

  [...templates, ...packages].forEach((pkgPath) => {
    console.log(`Updating dependencies for ${pkgPath} ...`);

    execSync(`cd ${pkgPath} && npx npm-check-updates -u -t minor`);
  });
};

run().then(
  () => {
    process.exit(0);
  },
  (error) => {
    console.error(error);
    process.exit(1);
  }
);
