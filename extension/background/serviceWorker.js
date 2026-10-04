import {
  connectWebSocket,
  setMessageHandler,
  send
} from "./websocket.js";

import { handleMessage } from "./messageHandler.js";

setMessageHandler(handleMessage);

connectWebSocket();

console.log("[YT Caster] Service worker started");


chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "player_state") {
    send({
      type: "player_state",
      state: message.state
    });
  }
});
