const WS_URL = "ws://127.0.0.1:8765";

let socket = null;
let reconnectTimer = null;

let messageHandler = null;

export function setMessageHandler(handler) {
  messageHandler = handler;
}

export function connectWebSocket() {
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  console.log("[YT Caster] Connecting to Node...");

  socket = new WebSocket(WS_URL);

  socket.addEventListener("open", () => {
    console.log("[YT Caster] Connected to Node");

    send({
      type: "extension_ready"
    });
  });

  socket.addEventListener("message", async (event) => {
    try {
      const message = JSON.parse(event.data);

      console.log("[YT Caster] Node → Extension:", message);

      if (messageHandler) {
        await messageHandler(message);
      }
    } catch (error) {
      console.error(
        "[YT Caster] Failed to process message:",
        error
      );
    }
  });

  socket.addEventListener("close", () => {
    console.log("[YT Caster] Disconnected from Node");

    socket = null;

    scheduleReconnect();
  });

  socket.addEventListener("error", (error) => {
    console.error("[YT Caster] WebSocket error:", error);
  });
}

export function send(message) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn(
      "[YT Caster] Cannot send, Node is not connected"
    );

    return false;
  }

  socket.send(JSON.stringify(message));

  return true;
}

function scheduleReconnect() {
  if (reconnectTimer) {
    return;
  }

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectWebSocket();
  }, 2000);
}