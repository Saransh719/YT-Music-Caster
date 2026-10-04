import YouTubeCastReceiver from "yt-cast-receiver";
import { CastPlayer } from "./castPlayer.js";
import { PersistentDataStore } from "./dataStore.js";
import { setPlayerStateHandler } from "../bridge/websocketServer.js";

export async function startCastReceiver() {
  const player = new CastPlayer();

  setPlayerStateHandler(async (state) => {
    await player.updateExternalState(state);
  });

  const dataStore = new PersistentDataStore();
  await dataStore.init();

  const receiver = new YouTubeCastReceiver(player, {
    device: {
      name: "SaranshPC"
    },

    dataStore
  });

  receiver.on("senderConnect", (sender) => {
    console.log(
      `📱 Sender connected: ${sender.name}`
    );
  });

  receiver.on("senderDisconnect", (sender) => {
    console.log(
      `📱 Sender disconnected: ${sender.name}`
    );
  });

  const pairingService =
    receiver.getPairingCodeRequestService();

  pairingService.on("response", (code) => {
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

  pairingService.start();

  console.log("🎵 Cast receiver started");

  return receiver;
}