#!/usr/bin/env node

/**
 * Slack Webhook Validation Script
 * 
 * This script helps you validate and test your Slack webhook configuration.
 * 
 * Usage:
 *   node validate-slack.js                           # Interactive mode
 *   node validate-slack.js <webhook_url>             # Direct URL test
 *   node validate-slack.js --env                     # Use SLACK_WEBHOOK_URL from env
 */

const https = require("https");
const url = require("url");
const readline = require("readline");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatWebhookUrl(webhookUrl) {
  try {
    const urlObj = new url.URL(webhookUrl);
    const parts = webhookUrl.split("/services/")[1].split("/");
    const masked = `${parts[0]}/****/****`;
    return `https://hooks.slack.com/services/${masked}`;
  } catch {
    return "Invalid URL format";
  }
}

function postToSlack(webhookUrl, message) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new url.URL(webhookUrl);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Slack-Webhook-Validator/1.0",
      },
    };

    const data = JSON.stringify({ text: message });
    options.headers["Content-Length"] = Buffer.byteLength(data);

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body,
        });
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function validateWebhook(webhookUrl) {
  log("\n" + "=".repeat(60), "cyan");
  log("🔍 Slack Webhook Validation", "cyan");
  log("=".repeat(60), "cyan");

  // Step 1: URL Format Validation
  log("\n[1/4] Checking URL format...", "blue");
  try {
    const urlObj = new url.URL(webhookUrl);
    if (!webhookUrl.includes("hooks.slack.com")) {
      throw new Error("URL is not from hooks.slack.com");
    }
    log("✅ URL format is valid", "green");
    log(`    Masked URL: ${formatWebhookUrl(webhookUrl)}`, "cyan");
  } catch (error) {
    log("❌ Invalid URL format", "red");
    log(`    Error: ${error.message}`, "red");
    return false;
  }

  // Step 2: Connection Test
  log("\n[2/4] Testing connection to Slack...", "blue");
  try {
    const response = await postToSlack(
      webhookUrl,
      "🧪 Testing Slack webhook connectivity"
    );

    if (response.status === 200) {
      log("✅ Successfully connected to Slack", "green");
    } else if (response.status === 404) {
      log("❌ Webhook URL not found (404)", "red");
      log("    This URL is invalid or has been deleted.", "red");
      log("    Action: Generate a new webhook URL in Slack app settings", "yellow");
      return false;
    } else if (response.status === 410) {
      log("❌ Webhook has been deactivated (410)", "red");
      log("    This URL is no longer valid.", "red");
      log("    Action: Create a new webhook URL in Slack", "yellow");
      return false;
    } else {
      log(`❌ Unexpected response: ${response.status}`, "red");
      log(`    Body: ${response.body}`, "red");
      return false;
    }
  } catch (error) {
    log("❌ Connection failed", "red");
    log(`    Error: ${error.message}`, "red");
    return false;
  }

  // Step 3: Message Test
  log("\n[3/4] Sending test message...", "blue");
  try {
    const timestamp = new Date().toLocaleTimeString();
    const testMessage = `✨ Webhook validation successful at ${timestamp}\n_Test message from Slack integration validator_`;
    
    const response = await postToSlack(webhookUrl, testMessage);
    if (response.status === 200) {
      log("✅ Test message sent successfully", "green");
      log("    Check your Slack channel for the test message", "cyan");
    } else {
      log(`❌ Failed to send message: ${response.status}`, "red");
      return false;
    }
  } catch (error) {
    log("❌ Failed to send message", "red");
    log(`    Error: ${error.message}`, "red");
    return false;
  }

  // Step 4: Environment Configuration
  log("\n[4/4] Checking environment configuration...", "blue");
  const envUrl = process.env.SLACK_WEBHOOK_URL;
  if (envUrl) {
    if (envUrl === webhookUrl) {
      log("✅ SLACK_WEBHOOK_URL is set correctly", "green");
    } else {
      log("⚠️  SLACK_WEBHOOK_URL is set but different from tested URL", "yellow");
      log(`    Configured: ${formatWebhookUrl(envUrl)}`, "yellow");
      log(`    Tested:     ${formatWebhookUrl(webhookUrl)}`, "yellow");
    }
  } else {
    log("⚠️  SLACK_WEBHOOK_URL environment variable not found", "yellow");
    log("    For Vercel: Add to Settings → Environment Variables", "cyan");
    log("    For local: Add to .env.local file", "cyan");
  }

  // Summary
  log("\n" + "=".repeat(60), "cyan");
  log("✅ All validation checks passed!", "green");
  log("=".repeat(60), "cyan");
  log("\n📋 Configuration Steps:", "cyan");
  log("1. Verify the test message appears in your Slack channel", "blue");
  log("2. Add SLACK_WEBHOOK_URL to your Vercel environment variables", "blue");
  log("3. Redeploy your application", "blue");
  log("4. The Slack integration should now work!", "blue");

  return true;
}

async function main() {
  const args = process.argv.slice(2);
  let webhookUrl;

  if (args.includes("--env")) {
    webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      log("❌ SLACK_WEBHOOK_URL not found in environment", "red");
      process.exit(1);
    }
  } else if (args[0] && !args[0].startsWith("--")) {
    webhookUrl = args[0];
  } else {
    // Interactive mode
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    log("\n" + "=".repeat(60), "cyan");
    log("Slack Webhook URL Validator", "cyan");
    log("=".repeat(60), "cyan");
    log("\nEnter your Slack webhook URL to validate:", "blue");
    log("(You can find this at https://api.slack.com/apps → Your App → Incoming Webhooks)", "cyan");

    rl.question("\n🔗 Webhook URL: ", (input) => {
      rl.close();
      webhookUrl = input.trim();

      if (!webhookUrl) {
        log("\n❌ No URL provided", "red");
        process.exit(1);
      }

      validateWebhook(webhookUrl).then((success) => {
        process.exit(success ? 0 : 1);
      });
    });
    return;
  }

  if (!webhookUrl) {
    log("❌ No webhook URL provided", "red");
    log("\nUsage:", "yellow");
    log("  node validate-slack.js <webhook_url>", "cyan");
    log("  node validate-slack.js --env", "cyan");
    process.exit(1);
  }

  validateWebhook(webhookUrl).then((success) => {
    process.exit(success ? 0 : 1);
  });
}

main().catch((error) => {
  log(`\n❌ Unexpected error: ${error.message}`, "red");
  process.exit(1);
});
