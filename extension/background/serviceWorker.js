import {
  connectWebSocket,
  setMessageHandler,
  send
} from "./websocket.js";

import {
  getLatestPairingCode,
  getLatestDeviceState,
  handleMessage
} from "./messageHandler.js";

setMessageHandler(handleMessage);

const NATIVE_HOST_NAME = "com.ytmusiccaster.host";

let nativePort = null;

function connectNativeHost() {
  try {
    nativePort = chrome.runtime.connectNative(
      NATIVE_HOST_NAME
    );

    nativePort.onMessage.addListener((message) => {
      console.log(
        "[YT Caster] Native host:",
        message
      );
    });

    nativePort.onDisconnect.addListener(() => {
      if (chrome.runtime.lastError) {
        console.error(
          "[YT Caster] Native host disconnected:",
          chrome.runtime.lastError.message
        );
      }

      nativePort = null;
    });

    nativePort.postMessage({
      type: "start"
    });

    console.log(
      "[YT Caster] Native host connected"
    );

  } catch (error) {
    console.error(
      "[YT Caster] Native host connection failed:",
      error
    );
  }
}

// Chrome starts the MV3 service worker on demand. These lifecycle events
// explicitly initialize the connection after browser startup and install/update.
let initialized = false;

function initialize() {
  if (initialized) {
    return;
  }

  initialized = true;
  connectNativeHost();
  connectWebSocket();
  console.log("[YT Caster] Service worker initialized");
}

chrome.runtime.onStartup.addListener(initialize);
chrome.runtime.onInstalled.addListener(initialize);

// Also initialize when Chrome starts this worker for another event, such as
// an incoming message, or when the extension is first loaded.
initialize();


chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "get_pairing_code") {
    sendResponse({
      code: getLatestPairingCode(),
      deviceState: getLatestDeviceState()
    });
    return true;
  }

  if (message.type === "player_state") {
    send({
      type: "player_state",
      state: message.state
    });
  }
});
