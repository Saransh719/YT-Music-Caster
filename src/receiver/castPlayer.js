import { Player, Constants } from "yt-cast-receiver";
import { sendToExtension } from "../bridge/websocketServer.js";

export class CastPlayer extends Player {

  constructor() {
    super();

    this.currentVideo = null;
    this.currentPosition = 0;
    this.currentDuration = 0;
    this.currentPlaying = false;
  }

  async doPlay(video, position) {
  console.log("▶️ PLAY", video.id, position);

  this.currentVideo = video;
  this.currentPosition = position ?? 0;
  this.currentPlaying = true;

  const result = await sendToExtension("play", {
    videoId: video.id,
    position: this.currentPosition
  });

  return result;
}

  async doPause() {
    console.log("⏸️ PAUSE");

    return await sendToExtension("pause");
  }

  async doResume() {
    console.log("▶️ RESUME");

    return await sendToExtension("resume");
  }

  async doStop() {
    console.log("⏹️ STOP");

    return await sendToExtension("stop");
  }

  async doSeek(position) {
    console.log("⏩ SEEK", position);

    return await sendToExtension("seek", {
      position
    });
  }

  async doSetVolume(volume) {
    console.log("🔊 VOLUME", volume);

    return await sendToExtension("volume", {
      level: volume.level,
      muted: volume.muted
    });
  }

  async doGetVolume() {
    return {
      level: 100,
      muted: false
    };
  }

  async doGetPosition() {
    return this.currentPosition;
  }
  
  async doGetDuration() {
    return this.currentDuration;
  }

  async updateExternalState(state) {
    if (!state) {
      return;
    }
  
    if (state.playing) {
      await this.notifyExternalStateChange(
        Constants.PLAYER_STATUSES.PLAYING
      );
    } else {
      await this.notifyExternalStateChange(
        Constants.PLAYER_STATUSES.PAUSED
      );
    }
  }
}