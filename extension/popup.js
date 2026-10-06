const connection = document.querySelector("#connection");
const deviceName = document.querySelector("#device-name");
const deviceStatus = document.querySelector("#device-status");
const removeButton = document.querySelector("#remove");
const pairButton = document.querySelector("#pair");
const pairingPanel = document.querySelector("#pairing");
const pairingMessage = document.querySelector("#pairing-message");
const codeElement = document.querySelector("#code");
const feedback = document.querySelector("#feedback");

let connectedDevices = [];

function showPairingCode(code) {
  if (!code) return;
  pairingPanel.hidden = false;
  codeElement.textContent = code;
  codeElement.hidden = false;
  pairingMessage.textContent = "Enter this code in the YouTube app to link your device.";
  pairButton.disabled = false;
  pairButton.innerHTML = "<span aria-hidden=\"true\"></span> Pair another device";
}

function showDeviceState(devices = []) {
  connectedDevices = devices;
  connection.classList.add("online");
  connection.lastElementChild.textContent = "Ready";
  const device = connectedDevices[0];
  deviceName.textContent = device?.name ?? "No device connected";
  deviceStatus.textContent = device ? "Connected to YouTube" : "Your receiver is ready to pair";
  removeButton.hidden = !device;
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "device_state") {
    showDeviceState(message.devices);
    return;
  }

  if (message.type === "pairing_code") {
    showPairingCode(message.code);
  }

  if (message.type === "pairing_error") {
    feedback.textContent = `Could not get a pairing code: ${message.error}`;
    pairButton.disabled = false;
  }

  if (message.type === "control_result") {
    if (!message.ok) feedback.textContent = message.error ?? "The receiver could not complete that action.";
    if (message.action === "pair" && !codeElement.hidden) {
      pairButton.disabled = false;
    }
    if (message.action === "pair" && !message.ok) {
      pairButton.disabled = false;
      pairButton.innerHTML = "<span aria-hidden=\"true\">＋</span> Pair new device";
      pairingMessage.textContent = "Could not start pairing. Try again.";
    }
    if (message.action === "remove") {
      removeButton.disabled = false;
      if (message.ok) {
        pairingPanel.hidden = true;
        feedback.textContent = "Device removed.";
      }
    }
  }

});

chrome.runtime.sendMessage({ type: "get_pairing_code" }, (result) => {
  if (!chrome.runtime.lastError) {
    showPairingCode(result?.code);
    showDeviceState(result?.deviceState?.devices);
  }
});

pairButton.addEventListener("click", () => {
  feedback.textContent = "";
  pairingPanel.hidden = false;
  codeElement.hidden = true;
  pairingMessage.textContent = "Generating a pairing code…";
  pairButton.disabled = true;
  pairButton.textContent = "Generating code…";
  chrome.runtime.sendMessage({ type: "control", action: "pair" });
});

removeButton.addEventListener("click", () => {
  feedback.textContent = "";
  removeButton.disabled = true;
  chrome.runtime.sendMessage({ type: "control", action: "remove" });
});
