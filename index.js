import { startWebSocketServer } from "./src/bridge/websocketServer.js";
import { startCastReceiver } from "./src/receiver/castReceiver.js";

console.log("🚀 Starting YT Music Caster...");

startWebSocketServer();

await startCastReceiver();

console.log("✅ YT Music Caster is running");