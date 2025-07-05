const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const PORT = 8000;
const PUBLIC_DIR = "./public";

// MIME types for different file extensions
const mimeTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
};

// Function to get MIME type
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || "application/octet-stream";
}

// Function to serve static files
function serveFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("File not found");
      return;
    }

    const mimeType = getMimeType(filePath);
    res.writeHead(200, { "Content-Type": mimeType });
    res.end(data);
  });
}

// Function to rebuild TypeScript
function rebuildTypeScript() {
  console.log("🔄 Rebuilding TypeScript...");
  const tsc = spawn("npx", ["tsc", "--project", "tsconfig.json"], {
    stdio: "inherit",
    shell: true,
  });

  tsc.on("close", (code) => {
    if (code === 0) {
      console.log("✅ TypeScript rebuild complete");
    } else {
      console.log("❌ TypeScript rebuild failed");
    }
  });
}

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // Handle CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle different routes
  let filePath = path.join(
    PUBLIC_DIR,
    req.url === "/" ? "/index.html" : req.url
  );

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // Try with .html extension for SPA routing
      if (!path.extname(filePath)) {
        filePath = path.join(PUBLIC_DIR, "index.html");
      }
    }

    serveFile(filePath, res);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Development server running at http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${path.resolve(PUBLIC_DIR)}`);
  console.log(`🔄 TypeScript files will be rebuilt automatically`);
  console.log(`\n💡 Tips:`);
  console.log(`   - Edit TypeScript files in public/js/services/*.ts`);
  console.log(`   - Changes will trigger automatic rebuild`);
  console.log(`   - Open http://localhost:${PORT} in your browser`);
  console.log(`   - Press Ctrl+C to stop the server`);
});

// Watch for TypeScript file changes
const chokidar = require("chokidar");

// Check if chokidar is available, if not, install it
try {
  const watcher = chokidar.watch("public/js/services/*.ts", {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
  });

  watcher
    .on("add", (path) => {
      console.log(`📝 File ${path} has been added`);
      rebuildTypeScript();
    })
    .on("change", (path) => {
      console.log(`📝 File ${path} has been changed`);
      rebuildTypeScript();
    })
    .on("unlink", (path) => {
      console.log(`🗑️ File ${path} has been removed`);
      rebuildTypeScript();
    });

  console.log("👀 Watching for TypeScript file changes...");
} catch (error) {
  console.log("⚠️ chokidar not available, installing...");
  const { execSync } = require("child_process");
  try {
    execSync("npm install chokidar --save-dev", { stdio: "inherit" });
    console.log("✅ chokidar installed successfully");
    console.log("🔄 Please restart the dev server: npm run dev");
  } catch (installError) {
    console.log("❌ Failed to install chokidar, file watching disabled");
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down development server...");
  server.close(() => {
    console.log("✅ Server stopped");
    process.exit(0);
  });
});
