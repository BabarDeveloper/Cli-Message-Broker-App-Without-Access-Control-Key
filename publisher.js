// publisher.js - Publisher Client
const io = require("socket.io-client");
const readline = require("readline");

// Server se connection establish karo
const socket = io("http://localhost:3000");

// CLI input ke liye readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "pub> ",
});

let currentTopic = null; // current active topic track karne ke liye

console.log("\n📡 Publisher Client Started");
console.log("=================================");
console.log("Commands:");
console.log("  create <topic>     - Create a new topic");
console.log("  send <message>     - Send message to current topic");
console.log("  use <topic>        - Switch to different topic");
console.log("  list               - List all topics");
console.log("  exit               - Quit");
console.log("=================================\n");

// Server se connection successful
socket.on("connect", () => {
  console.log("✅ Connected to broker server\n");
  rl.prompt();
});

// Connection error
socket.on("connect_error", (err) => {
  console.log("❌ Connection failed! Make sure server is running on port 3000");
  process.exit(1);
});

// Server se response aane par
socket.on("response", (data) => {
  if (data.success) {
    console.log(`✅ ${data.message}`);
  } else {
    console.log(`❌ ${data.message}`);
  }
  rl.prompt();
});

// User input handle karna
rl.on("line", (line) => {
  const input = line.trim();
  const parts = input.split(" ");
  const command = parts[0].toLowerCase();

  switch (command) {
    case "create":
      // Naya topic create karo
      if (parts.length < 2) {
        console.log("❌ Usage: create <topicname>");
      } else {
        const topicName = parts[1];
        socket.emit("createTopic", { topicName }, (response) => {
          if (response.success) {
            currentTopic = topicName;
            console.log(`✅ Now using topic: ${currentTopic}`);
          } else {
            console.log(`❌ ${response.message}`);
          }
          rl.prompt();
        });
      }
      break;

    case "send":
      // Message bhejo current topic pe
      if (!currentTopic) {
        console.log("❌ No topic selected! First create or use a topic.");
      } else if (parts.length < 2) {
        console.log("❌ Usage: send <message>");
      } else {
        const message = parts.slice(1).join(" ");
        socket.emit(
          "publish",
          { topicName: currentTopic, message },
          (response) => {
            if (response.success) {
              console.log(`✅ Message sent to '${currentTopic}': ${message}`);
            } else {
              console.log(`❌ ${response.message}`);
            }
            rl.prompt();
          },
        );
      }
      break;

    case "use":
      // Different topic select karo
      if (parts.length < 2) {
        console.log("❌ Usage: use <topicname>");
      } else {
        currentTopic = parts[1];
        console.log(`✅ Switched to topic: ${currentTopic}`);
      }
      rl.prompt();
      break;

    case "list":
      // Server se topics ki list mango
      console.log("📋 To see all topics, check server console");
      console.log("💡 Server shows status every 10 seconds");
      rl.prompt();
      break;

    case "exit":
      console.log("👋 Goodbye!");
      socket.disconnect();
      rl.close();
      process.exit(0);
      break;

    default:
      console.log(
        "❌ Unknown command! Available: create, send, use, list, exit",
      );
      rl.prompt();
  }
});

// Ctrl+C handle karo
rl.on("SIGINT", () => {
  console.log("\n👋 Goodbye!");
  socket.disconnect();
  process.exit(0);
});
