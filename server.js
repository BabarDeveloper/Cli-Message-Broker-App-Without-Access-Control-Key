// server.js - Broker Server
const io = require("socket.io")(3000, {
  cors: {
    origin: "*", // sabhi clients ko allow karo
  },
});

// In-memory storage (no database)
const topics = new Map(); // topic name -> { subscribers[] }

console.log("🚀 Broker server running on port 3000");

// Jab bhi koi client connect hota hai
io.on("connection", (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // 1. Publisher: naya topic create karna
  socket.on("createTopic", (data, callback) => {
    const { topicName } = data;

    if (topics.has(topicName)) {
      callback({ success: false, message: "Topic already exists!" });
    } else {
      topics.set(topicName, {
        subscribers: new Set(), // subscribers ka set (unique IDs)
      });
      callback({ success: true, message: `Topic '${topicName}' created!` });
      console.log(`📢 New topic created: ${topicName}`);
    }
  });

  // 3. Subscriber: topic join karna (subscribe karna)
  socket.on("subscribe", (data, callback) => {
    const { topicName } = data;

    if (!topics.has(topicName)) {
      callback({ success: false, message: "Topic does not exist!" });
      return;
    }

    const topic = topics.get(topicName);

    // Subscriber ko group mein add karo
    topic.subscribers.add(socket.id);

    // Socket ko topic ke room mein bhi add karo (efficient broadcasting)
    socket.join(topicName);

    callback({
      success: true,
      message: `Subscribed to '${topicName}' successfully!`,
    });
    console.log(`👤 Subscriber ${socket.id} joined topic: ${topicName}`);
    console.log(
      `📊 Total subscribers for ${topicName}: ${topic.subscribers.size}`,
    );
  });

  // 4. Publisher: message bhejna
  socket.on("publish", (data, callback) => {
    const { topicName, message } = data;

    if (!topics.has(topicName)) {
      callback({ success: false, message: "Topic does not exist!" });
      return;
    }

    const topic = topics.get(topicName);

    // Topic ke saare subscribers ko message bhejo
    io.to(topicName).emit("newMessage", {
      topic: topicName,
      message: message,
      timestamp: new Date().toISOString(),
    });

    callback({ success: true, message: `Message published to '${topicName}'` });
    console.log(`📨 Message sent to topic '${topicName}': ${message}`);
    console.log(`📤 Delivered to ${topic.subscribers.size} subscriber(s)`);
  });

  // 5. Jab client disconnect ho
  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);

    // Har topic se is subscriber ko remove karo
    for (let [topicName, topic] of topics.entries()) {
      if (topic.subscribers.has(socket.id)) {
        topic.subscribers.delete(socket.id);
        console.log(`🗑️ Removed ${socket.id} from ${topicName}`);
      }
    }
  });
});

// Server status display every 10 seconds
setInterval(() => {
  console.log("\n📊 === BROKER STATUS ===");
  for (let [topicName, topic] of topics.entries()) {
    console.log(`Topic: ${topicName}`);
    console.log(`  Subscribers: ${topic.subscribers.size}`);
  }
  console.log("========================\n");
}, 10000);
