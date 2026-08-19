const path = require("path");

const appDir = __dirname;
const python = path.join(appDir, "backend", "venv", "bin", "python");

module.exports = {
  apps: [
    {
      name: "oatstone",
      cwd: path.join(appDir, "backend"),
      script: python,
      args: "-m uvicorn app.main:app --host 0.0.0.0 --port 8000",
      interpreter: "none",
      env: {
        APP_ENV: "production",
      },
    },
  ],
};
