import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔍 Searching for Hardhat build-info...");

const buildInfoDir = path.join(__dirname, 'artifacts', 'build-info');

try {
    const files = fs.readdirSync(buildInfoDir);
    const buildFile = files.find(f => f.endsWith('.json'));

    if (!buildFile) {
        console.error("❌ No build-info file found. Please run 'npx hardhat compile' first.");
        process.exit(1);
    }

    console.log(`📄 Found build file: ${buildFile}`);
    
    // Read the massive Hardhat wrapper file
    const rawData = fs.readFileSync(path.join(buildInfoDir, buildFile), 'utf8');
    const parsedData = JSON.parse(rawData);

    // Surgically extract ONLY the input object that Etherscan requires
    if (parsedData.input) {
        fs.writeFileSync('etherscan-input.json', JSON.stringify(parsedData.input, null, 2));
        console.log("✅ SUCCESS! Extracted 'etherscan-input.json'");
        console.log("🚀 You can now upload 'etherscan-input.json' to Celoscan!");
    } else {
        console.error("❌ Could not find the 'input' data. Try recompiling.");
    }

} catch (error) {
    console.error("❌ Error reading files:", error.message);
}