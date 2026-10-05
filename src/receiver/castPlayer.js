import { Player, Constants } from "yt-cast-receiver";
import { sendToExtension } from "../bridge/websocketServer.js";

export class CastPlayer extends Player {

  constructor() {
    super();

    this.currentVideo = null;
    this.currentPosition = 0;
    this.currentDuration = 0;
    this.currentPlaying = false;
    this.pendingPhoneVideoId = null;
    this.pendingPhoneVideoTimer = null;



    // The receiver's public queue emits this after processing YouTube Music's
    // setPlaylist/VIDEO_SELECTED request and before YouTubeApp calls play().
    this.queue.on("videoSelected", (event) => {
      const requestedVideoId = event.videoId ?? this.queue.current?.id;
      if (!requestedVideoId) {
        return;
      }

      this.pendingPhoneVideoId = requestedVideoId;
      clearTimeout(this.pendingPhoneVideoTimer);
      this.pendingPhoneVideoTimer = setTimeout(() => {
        if (this.pendingPhoneVideoId === requestedVideoId) {
          this.pendingPhoneVideoId = null;
          this.pendingPhoneVideoTimer = null;
        }
      }, 15000);
    });

  }

  async play(video, position, AID) {
  const selectedId = this.pendingPhoneVideoId;

  if (selectedId && selectedId !== video?.id) {
    const queueState = this.queue.getState();

    let selectedVideo = null;

    if (queueState.previous?.id === selectedId) {
      selectedVideo = queueState.previous;
    } else if (queueState.current?.id === selectedId) {
      selectedVideo = queueState.current;
    } else if (queueState.next?.id === selectedId) {
      selectedVideo = queueState.next;
    }

    if (selectedVideo) {
      video = selectedVideo;
    } else {
      video = {
        id: selectedId,
        client: Constants.CLIENTS.YTMUSIC,
      };
    }

    console.log("📱 Playing phone-selected video:", video.id);

    clearTimeout(this.pendingPhoneVideoTimer);
    this.pendingPhoneVideoTimer = null;
    this.pendingPhoneVideoId = null;
  }

  return super.play(video, position, AID);
}

  buildVideoFromState(state) {
    if (!state?.videoId) {
      return null;
    }

    const video = {
      id: state.videoId,
      client: Constants.CLIENTS.YTMUSIC
    };

    const context = {};

    if (state.playlistId) {
      context.playlistId = state.playlistId;
    }

    if (state.index !== undefined && state.index !== null) {
      context.index = Number(state.index);
    }

    if (state.params) {
      context.params = state.params;
    }

    if (state.ctt) {
      context.ctt = state.ctt;
    }

    if (Object.keys(context).length > 0) {
      video.context = context;
    }

    return video;
  }

  syncCurrentMediaItem(state) {
    const video = this.buildVideoFromState(state);

    if (!video) {
      return false;
    }

    const currentId = this.queue.current?.id ?? null;

    if (currentId === video.id) {
      this.currentVideo = video;
      return false;
    }

    console.log(
      "📺 Current PC media detected:",
      video.id,
      state.title ? `(${state.title})` : ""
    );

    this.currentVideo = video;

    // yt-cast-receiver does not expose a public API for externally setting the
    // current queue item. The installed source uses `queue.setAsCurrent(video)`
    // internally, so we mirror that here through the public `queue` getter.
    this.queue.setAsCurrent(video);

    return true;
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

    this.currentPlaying = false;

    return await sendToExtension("pause");
  }

  async doResume() {
    console.log("▶️ RESUME");

    this.currentPlaying = true;

    return await sendToExtension("resume");
  }

  async doStop() {
    console.log("⏹️ STOP");

    this.currentPlaying = false;
    this.currentPosition = 0;

    return await sendToExtension("stop");
  }

  async doSeek(position) {
    console.log("⏩ SEEK", position);

    this.currentPosition = position;

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

    const requestedQueueVideoId = this.queue.isUpdating
      ? this.queue.current?.id
      : null;
    if (requestedQueueVideoId && state.videoId !== requestedQueueVideoId) {
      return;
    }

    if (this.pendingPhoneVideoId) {
      if (state.videoId !== this.pendingPhoneVideoId) {
        return;
      }

      this.pendingPhoneVideoId = null;
      clearTimeout(this.pendingPhoneVideoTimer);
      this.pendingPhoneVideoTimer = null;
    }

    // Update the queue before emitting the state event. YouTubeApp compares
    // queue.current in successive player states to decide whether to send
    // NowPlaying to the sender.
    this.syncCurrentMediaItem(state);
    
    if (state.playing) {
      this.currentPlaying = true;
    } else {
      this.currentPlaying = false;
    }

    this.currentPosition = state.position ?? 0;
    this.currentDuration = state.duration ?? 0;

    await this.notifyExternalStateChange(
      state.playing
        ? Constants.PLAYER_STATUSES.PLAYING
        : Constants.PLAYER_STATUSES.PAUSED
    );
  }
}
