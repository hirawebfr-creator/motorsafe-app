const { execSync } = require("child_process");

execSync("next build --webpack", { stdio: "inherit", env: process.env });
