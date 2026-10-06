#!/usr/bin/env node

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const indexPath = path.join(projectRoot, "index.js");

let serverProcess = null;
let started = false;

function send(message) {
  const json = JSON.stringify(message);
  const payload = Buffer.from(json, "utf8");

  const header = Buffer.alloc(4);
  header.writeUInt32LE(payload.length, 0);

  try {
    process.stdout.write(header);
    process.stdout.write(payload);
  } catch (error) {
    console.error(
      "[YT Caster Host] Failed to send:",
      error
    );
  }
}

function startServer() {
  if (serverProcess) {
    console.error(
      "[YT Caster Host] Server already running"
    );

    send({
      type: "started",
      ok: true
    });

    return;
  }

  console.error(
    "[YT Caster Host] Starting YT Music Caster..."
  );

  serverProcess = spawn(
    process.execPath,
    [indexPath],
    {
      cwd: projectRoot,
      stdio: [
        "ignore",
        "pipe",
        "pipe"
      ]
    }
  );

  /*
   * NEVER allow the application stdout to reach
   * Native Messaging stdout.
   */
  serverProcess.stdout.on("data", (data) => {
    process.stderr.write(data);
  });

  serverProcess.stderr.on("data", (data) => {
    process.stderr.write(data);
  });

  serverProcess.on("error", (error) => {
    console.error(
      "[YT Caster Host] Server failed:",
      error
    );

    serverProcess = null;
    started = false;

    send({
      type: "error",
      ok: false,
      error: error.message
    });
  });

  serverProcess.on("exit", (code, signal) => {
    console.error(
      `[YT Caster Host] Server exited: code=${code}, signal=${signal}`
    );

    serverProcess = null;
    started = false;
  });

  started = true;

  send({
    type: "started",
    ok: true
  });

  console.error(
    "[YT Caster Host] YT Music Caster started"
  );
}

function stopServer() {
  if (!serverProcess) {
    return;
  }

  console.error(
    "[YT Caster Host] Stopping YT Music Caster..."
  );

  serverProcess.kill("SIGTERM");

  serverProcess = null;
  started = false;
}

let inputBuffer = Buffer.alloc(0);

process.stdin.on("data", (chunk) => {
  inputBuffer = Buffer.concat([
    inputBuffer,
    chunk
  ]);

  while (inputBuffer.length >= 4) {
    const messageLength = inputBuffer.readUInt32LE(0);

    if (inputBuffer.length < 4 + messageLength) {
      return;
    }

    const messageBuffer = inputBuffer.subarray(
      4,
      4 + messageLength
    );

    inputBuffer = inputBuffer.subarray(
      4 + messageLength
    );

    try {
      const message = JSON.parse(
        messageBuffer.toString("utf8")
      );

      console.error(
        "[YT Caster Host] Received:",
        message
      );

      if (message.type === "start") {
        startServer();
      }

      if (message.type === "stop") {
        stopServer();

        send({
          type: "stopped",
          ok: true
        });
      }

    } catch (error) {
      console.error(
        "[YT Caster Host] Invalid message:",
        error
      );

      send({
        type: "error",
        ok: false,
        error: error.message
      });
    }
  }
});

process.stdin.on("end", () => {
  console.error(
    "[YT Caster Host] Chrome disconnected"
  );

  stopServer();
  process.exit(0);
});

process.stdin.on("close", () => {
  stopServer();
  process.exit(0);
});

console.error(
  "[YT Caster Host] Native host started",
  {
    pid: process.pid,
    execPath: process.execPath,
    cwd: process.cwd()
  }
);