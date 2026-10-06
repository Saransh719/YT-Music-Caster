import YouTubeCastReceiver from "yt-cast-receiver";
import { CastPlayer } from "./castPlayer.js";
import { PersistentDataStore } from "./dataStore.js";
import {
  broadcastToExtension,
  sendToExtension,
  setPlayerStateHandler
} from "../bridge/websocketServer.js";

export async function startCastReceiver() {
  const player = new CastPlayer();

  setPlayerStateHandler(async (state) => {
    await player.updateExternalState(state);
  });

  const dataStore = new PersistentDataStore();
  await dataStore.init();

  const receiver = new YouTubeCastReceiver(player, {
    device: {
      name: "MyPC"
    },

    dataStore
  });

  const publishDeviceState = () => {
    broadcastToExtension("device_state", {
      devices: receiver.getConnectedSenders().map((sender) => ({
        name: sender.name || "YouTube device"
      }))
    });
  };

  receiver.on("senderConnect", (sender) => {
    console.log(
      `📱 Sender connected: ${sender.name}`
    );
    publishDeviceState();
  });

  receiver.on("senderDisconnect", (sender) => {
    console.log(
      `📱 Sender disconnected: ${sender.name}`
    );
    publishDeviceState();
  });

  const pairingService =
    receiver.getPairingCodeRequestService();

  pairingService.on("response", (code) => {
    sendToExtension("pairing_code", { code });
    console.log("");
    console.log("================================");
    console.log("📺 YOUTUBE TV CODE");
    console.log(`       ${code}`);
    console.log("================================");
    console.log("");
  });

  pairingService.on("error", (error) => {
    console.error("❌ Pairing error:", error);
  });

  await receiver.start();
  publishDeviceState();

  pairingService.start();

  console.log("🎵 Cast receiver started");

  return receiver;
}
