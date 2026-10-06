import {
  getOrCreateYouTubeMusicTab,
  findYouTubeMusicTab,
  waitForTabLoaded
} from "./tabManager.js";

import { send } from "./websocket.js";

let latestPairingCode = null;
let latestDeviceState = { devices: [] };

export function getLatestPairingCode() {
  return latestPairingCode;
}

export function getLatestDeviceState() {
  return latestDeviceState;
}

async function sendToTab(tabId, command, payload = {}) {
  try {
    const tabMessage = {
      command,
      ...payload
    };
    const response = await chrome.tabs.sendMessage(tabId, tabMessage);
    return response;
  } catch (error) {
    console.error(
      `[YT Caster] Failed to send ${command} to tab ${tabId}:`,
      error
    );

    return {
      ok: false,
      error: error.message
    };
  }
}

export async function handleMessage(message) {
  switch (message.type) {
    case "pairing_code":
      latestPairingCode = message.code;
      chrome.runtime.sendMessage(message).catch(() => {});
      send({
        type: "ack",
        requestId: message.requestId,
        ok: true
      });
      break;

    case "device_state":
      latestDeviceState = { devices: message.devices ?? [] };
      chrome.runtime.sendMessage({
        type: "device_state",
        ...latestDeviceState
      }).catch(() => {});
      break;

    case "play":
      await handlePlay(message);
      break;

    case "pause":
      await handlePause(message);
      break;

    case "resume":
      await handleResume(message);
      break;

    case "seek":
      await handleSeek(message);
      break;

    case "stop":
      await handleStop(message);
      break;

    case "volume":
      await handleVolume(message);
      break;

    default:
      console.warn(
        `[YT Caster] Unknown command: ${message.type}`
      );
  }
}

async function handlePlay(message) {
  const existingTab = await findYouTubeMusicTab();
  const tab = await getOrCreateYouTubeMusicTab(
    message.videoId
  );

  if (!existingTab) {
    await waitForTabLoaded(tab.id);
  }

  const result = await sendToTab(
    tab.id,
    "play",
    {
      videoId: message.videoId,
      position: message.position ?? 0
    }
  );

  send({
    type: "ack",
    requestId: message.requestId,
    ok: result?.ok === true
  });
}

async function handlePause(message) {
  const tab = await findYouTubeMusicTab();

  if (!tab) {
    sendAck(message.requestId, false);
    return;
  }

  const result = await sendToTab(
    tab.id,
    "pause"
  );

  sendAck(
    message.requestId,
    result?.ok === true
  );
}

async function handleResume(message) {
  const tab = await findYouTubeMusicTab();

  if (!tab) {
    sendAck(message.requestId, false);
    return;
  }

  const result = await sendToTab(
    tab.id,
    "resume"
  );

  sendAck(
    message.requestId,
    result?.ok === true
  );
}

async function handleSeek(message) {
  const tab = await findYouTubeMusicTab();

  if (!tab) {
    sendAck(message.requestId, false);
    return;
  }

  const result = await sendToTab(
    tab.id,
    "seek",
    {
      position: message.position
    }
  );

  sendAck(
    message.requestId,
    result?.ok === true
  );
}

async function handleStop(message) {
  const tab = await findYouTubeMusicTab();

  if (!tab) {
    sendAck(message.requestId, true);
    return;
  }

  const result = await sendToTab(
    tab.id,
    "stop"
  );

  sendAck(
    message.requestId,
    result?.ok === true
  );
}

async function handleVolume(message) {
  const tab = await findYouTubeMusicTab();

  if (!tab) {
    sendAck(message.requestId, false);
    return;
  }

  const result = await sendToTab(
    tab.id,
    "volume",
    {
      level: message.level,
      muted: message.muted
    }
  );

  sendAck(
    message.requestId,
    result?.ok === true
  );
}

function sendAck(requestId, ok) {
  send({
    type: "ack",
    requestId,
    ok
  });
}
