import { WebSocketServer } from "ws";
import crypto from "node:crypto";

const PORT = 8765;

let extensionSocket = null;
let playerStateHandler = null;
let latestDeviceState = { devices: [] };

export function setPlayerStateHandler(handler) {
  playerStateHandler = handler;
}

const pendingRequests = new Map();

export function startWebSocketServer() {
  const server = new WebSocketServer({
    port: PORT
  });

  server.on("listening", () => {
    console.log(`🌐 WebSocket server listening on port ${PORT}`);
  });

  server.on("connection", (socket) => {
    console.log("🌐 Chrome extension connected");

    extensionSocket = socket;

    socket.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type !== "player_state") {
          console.log("🌐 Extension → Node:", message);
        }

        handleMessage(message);
      } catch (error) {
        console.error("❌ Invalid extension message:", error);
      }
    });

    socket.on("close", () => {
      console.log("🌐 Chrome extension disconnected");

      if (extensionSocket === socket) {
        extensionSocket = null;
      }
    });

    socket.on("error", (error) => {
      console.error("❌ WebSocket error:", error);
    });
  });

  return server;
}

export function sendToExtension(type, payload = {}) {
  return new Promise((resolve) => {
    if (
      !extensionSocket ||
      extensionSocket.readyState !== 1
    ) {
      console.log("⚠️ Chrome extension is not connected");
      resolve(false);
      return;
    }

    const requestId = crypto.randomUUID();

    pendingRequests.set(requestId, resolve);

    const message = { type, requestId, ...payload };
    extensionSocket.send(JSON.stringify(message));

    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        resolve(false);
      }
    }, 10000);
  });
}

export function broadcastToExtension(type, payload = {}) {
  if (type === "device_state") {
    latestDeviceState = payload;
  }

  if (!extensionSocket || extensionSocket.readyState !== 1) {
    return false;
  }

  extensionSocket.send(JSON.stringify({ type, ...payload }));
  return true;
}

function handleMessage(message) {
  if (message.type === "extension_ready") {
    console.log("✅ Chrome extension is ready");
    broadcastToExtension("device_state", latestDeviceState);
    return;
  }

  if (message.type === "ack") {
    const resolve = pendingRequests.get(message.requestId);

    if (!resolve) {
      return;
    }

    pendingRequests.delete(message.requestId);

    resolve(message.ok === true);
  }

  if (message.type === "player_state") {
    if (playerStateHandler) {
      Promise.resolve(
        playerStateHandler(message.state)
      ).catch((error) => {
        console.error(
          "❌ Failed to handle player state:",
          error
        );
      });
    }
    return;
  }
}
