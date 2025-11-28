// Script to download face-api.js models
// Run with: node scripts/download-models.js

import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/";
const modelsDir = path.join(__dirname, "../public/models");

const files = [
  "ssd_mobilenetv1_model-weights_manifest.json",
  "ssd_mobilenetv1_model-shard1",
  "ssd_mobilenetv1_model-shard2",
  "face_landmark_68_model-weights_manifest.json",
  "face_landmark_68_model-shard1",
  "face_recognition_model-weights_manifest.json",
  "face_recognition_model-shard1",
  "face_recognition_model-shard2",
];

// Create models directory if it doesn't exist
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
  console.log(`✅ Created directory: ${modelsDir}`);
}

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https
      .get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve();
          });
        } else if (response.statusCode === 301 || response.statusCode === 302) {
          // Handle redirects
          file.close();
          fs.unlinkSync(filepath);
          downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
        } else {
          file.close();
          fs.unlinkSync(filepath);
          reject(new Error(`Failed to download: ${response.statusCode}`));
        }
      })
      .on("error", (err) => {
        file.close();
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
        reject(err);
      });
  });
}

async function downloadAllModels() {
  console.log("📥 Starting model download...\n");
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const url = baseUrl + file;
    const filepath = path.join(modelsDir, file);
    
    try {
      process.stdout.write(`[${i + 1}/${files.length}] Downloading ${file}... `);
      await downloadFile(url, filepath);
      console.log("✅");
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log(`   Try downloading manually from: ${url}`);
    }
  }
  
  console.log("\n✨ Download complete!");
  console.log(`📁 Models saved to: ${modelsDir}`);
  console.log("\n💡 Next steps:");
  console.log("   1. Restart your Vite dev server (npm run dev)");
  console.log("   2. Reload the onboarding page");
  console.log("   3. Check DevTools Network tab to verify models load correctly");
}

downloadAllModels().catch(console.error);
