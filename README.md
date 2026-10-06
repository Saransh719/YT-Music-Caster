# YT Music Caster

**Control YouTube Music on your PC from your phone.**

YT Music Caster connects the YouTube Music app on your phone to YouTube Music running in a browser on your PC.

It allows you to control playback on your PC directly from your phone while keeping the browser player as the actual music player.

The project is inspired by the seamless device-control experience of Spotify Connect, but is built specifically for YouTube Music.

## Features

- Control YouTube Music running on your PC from your phone
- Play and pause music remotely
- Change tracks
- Seek through the current track
- Control volume
- Synchronize playback state
- Use the existing YouTube Music web player
- Connect using the existing YouTube Music Cast functionality
- Automatic communication between the Cast receiver and browser extension

<p align="center">
  <img width="200px" alt="popup" src="https://github.com/user-attachments/assets/b5a973ab-2803-4dd2-a68f-5c2d9b277cca" />
  <img width="200px" alt="phone" src="https://github.com/user-attachments/assets/200d0418-6af2-4469-9dd6-e27943a4d616" />

</p>
  


---

# Installation

Currently, YT Music Caster provides an official prebuilt installation for **Linux x64**.

Windows and macOS users can also run the project manually if they are familiar with Chrome Native Messaging.

## Linux

### Requirements

- 64-bit Linux
- Google Chrome
- YouTube Music
- YouTube Music app on your phone

The prebuilt release includes Node.js and all required dependencies, so you do not need to install Node.js or npm.

### 1. Download

Download the latest:

```text
YT-Music-Caster-linux-x64.zip
```

from the GitHub Releases page.

Extract the archive:

```bash
unzip YT-Music-Caster-linux-x64.zip
cd YT-Music-Caster
```

### 2. Load the Chrome Extension

Open:

```text
chrome://extensions
```

Enable **Developer mode**.

Click **Load unpacked** and select the project's:

```text
extension/
```

directory.

Chrome will display the extension ID. Copy it.

It will look similar to:

```text
egodglfmcbdeffkidabhbnfeomcoegjk
```

### 3. Install the Native Host

Make the installer executable:

```bash
chmod +x install.sh
```

Run it with your extension ID:

```bash
./install.sh <EXTENSION_ID>
```

For example:

```bash
./install.sh egodglfmcbdeffkidabhbnfeomcoegjk
```

The installer will install YT Music Caster and configure Chrome Native Messaging for the extension.

### 4. Reload Chrome

Go back to:

```text
chrome://extensions
```

and click **Reload** on YT Music Caster.

Then open:

```text
https://music.youtube.com
```

and start playing music.

Open YouTube Music on your phone and select your PC from the Cast/device selection interface.

---

# Uninstalling

Run:

```bash
./uninstall.sh
```

This removes the installed YT Music Caster application and its Chrome Native Messaging configuration.

The Chrome extension can be removed separately from:

```text
chrome://extensions
```

---

# Windows

Windows is not currently provided with a prebuilt installer.

However, the project can be run on Windows if you are familiar with **Chrome Native Messaging**.

You will need:

- Google Chrome
- Node.js
- The YT Music Caster source
- The Chrome extension
- A Native Messaging host

The Native Messaging host manifest should contain:

```json
{
  "name": "com.ytmusiccaster.host",
  "description": "YT Music Caster native host",
  "path": "C:\\Path\\To\\host-launcher.cmd",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://YOUR_EXTENSION_ID/"
  ]
}
```

The host must then be registered through the Windows Registry under Chrome's Native Messaging host configuration.

---

# macOS

macOS is not currently provided with a prebuilt installer.

The project can be run manually using Node.js and Chrome Native Messaging.

The Native Messaging manifest follows the same general structure:

```json
{
  "name": "com.ytmusiccaster.host",
  "description": "YT Music Caster native host",
  "path": "/path/to/host-launcher.sh",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://YOUR_EXTENSION_ID/"
  ]
}
```

The host launcher must be executable and start the YT Music Caster Node.js application.

The manifest must be placed in the appropriate Chrome Native Messaging host directory for your Chrome installation.

---

# Development

Clone the repository:

```bash
git clone https://github.com/Saransh719/YT-Music-Caster.git
cd YT-Music-Caster
```

Install dependencies:

```bash
npm install
```

Start the application:

```bash
npm start
```

For development, load the `extension/` directory as an unpacked Chrome extension.

---

# Building the Linux Release

The repository includes a Linux build script:

```bash
chmod +x build-linux.sh
./build-linux.sh
```

This creates a self-contained release containing the Node.js runtime, application files, dependencies, and Native Messaging host.

The resulting release is located at:

```text
release/yt-music-caster/
```

You can then package the project into a ZIP and upload it to GitHub Releases.

---

# Contributing

Contributions are welcome.

If you would like to contribute, you can help with:

- Windows support
- macOS support
- Native Messaging installers
- Queue handling
- Connection reliability
- Chrome extension improvements

To contribute:

1. Fork the repository.
2. Create a new branch.
3. Make your changes.
4. Test your changes.
5. Open a pull request.

For bug reports and feature requests, please open an issue with as much relevant information as possible.
