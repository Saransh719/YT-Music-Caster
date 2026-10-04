function getVideoElement() {
  return document.querySelector("video");
}

function getPlayerState() {
  const video = getVideoElement();

  if (!video) {
    return null;
  }

  return {
    playing: !video.paused && !video.ended,
    position: video.currentTime,
    duration: Number.isFinite(video.duration)
      ? video.duration
      : 0,
    volume: video.volume * 100,
    muted: video.muted
  };
}

function getCurrentMediaInfo() {
  const url = new URL(window.location.href);
  const videoId = url.searchParams.get("v");

  if (!videoId) {
    return null;
  }

  const playlistId = url.searchParams.get("list");
  const indexValue = url.searchParams.get("index");
  const index = indexValue != null ? Number.parseInt(indexValue, 10) : null;

  return {
    videoId,
    title: document.title,
    playlistId,
    index: Number.isFinite(index) ? index : null,
    params: url.searchParams.get("params"),
    ctt: url.searchParams.get("ctt")
  };
}

async function waitForVideo(timeout = 15000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const video = getVideoElement();

    if (video) {
      return video;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 250)
    );
  }

  throw new Error(
    "YouTube Music video element not found"
  );
}

async function switchToVideo(videoId, position = 0) {
  console.log(
    `[YT Caster] Switching to video: ${videoId}`
  );

  const currentMedia = getCurrentMediaInfo();

  if (currentMedia?.videoId === videoId) {
    const video = await waitForVideo();

    video.currentTime = position;
    await video.play();

    return video;
  }

  console.log(
    `[YT Caster] Current video: ${currentMedia?.videoId ?? "none"}`
  );

  console.log(
    `[YT Caster] Navigating to: ${videoId}`
  );

  const targetUrl =
    `https://music.youtube.com/watch?v=${encodeURIComponent(videoId)}`;

  window.location.href = targetUrl;

  const start = Date.now();
  const timeout = 15000;

  while (Date.now() - start < timeout) {
    await new Promise((resolve) =>
      setTimeout(resolve, 250)
    );

    const media = getCurrentMediaInfo();

    if (media?.videoId !== videoId) {
      continue;
    }

    const video = getVideoElement();

    if (!video) {
      continue;
    }

    // Make sure metadata has loaded.
    if (video.readyState < 1) {
      continue;
    }

    console.log(
      `[YT Caster] New track loaded: ${videoId}`
    );

    video.currentTime = position;

    await video.play();

    console.log(
      `[YT Caster] Playing new track: ${videoId}`
    );

    return video;
  }

  throw new Error(
    `Timed out waiting for video ${videoId}`
  );
}

async function handleCommand(message) {
  let video;

  switch (message.command) {
    case "play":
      console.log(
        "[YT Caster] PLAY command received:",
        message
      );

      video = await waitForVideo();

      if (message.position != null) {
        video.currentTime = message.position;
      }

      await video.play();

      return {
        state: getPlayerState()
      };

    case "pause":
      video = await waitForVideo();

      video.pause();

      return {
        state: getPlayerState()
      };

    case "resume":
      video = await waitForVideo();

      await video.play();

      return {
        state: getPlayerState()
      };

    case "seek":
      video = await waitForVideo();

      video.currentTime = message.position;

      return {
        state: getPlayerState()
      };

    case "stop":
      video = await waitForVideo();

      video.pause();
      video.currentTime = 0;

      return {
        state: getPlayerState()
      };

    case "volume":
      video = await waitForVideo();

      video.volume = Math.max(
        0,
        Math.min(1, message.level / 100)
      );

      video.muted = Boolean(message.muted);

      return {
        state: getPlayerState()
      };

    case "get_state":
      return {
        state: getPlayerState()
      };

    default:
      throw new Error(
        `Unknown command: ${message.command}`
      );
  }
}


chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    handleCommand(message)
      .then((result) => {
        sendResponse({
          ok: true,
          ...result
        });
      })
      .catch((error) => {
        console.error(
          "[YT Caster] Player error:",
          error
        );

        sendResponse({
          ok: false,
          error: error.message
        });
      });

    return true;
  }
);

console.log(
  "[YT Caster] Content script loaded"
);

function sendPlayerState() {
  const video = getVideoElement();
  const media = getCurrentMediaInfo();

  if (!video) {
    return;
  }

  if (!media) {
    return;
  }

  if (media.videoId !== lastReportedVideoId) {
    lastReportedVideoId = media.videoId;

    console.log("[YT Caster] Current media detected:", media);
  }

  chrome.runtime.sendMessage({
    type: "player_state",
    state: {
      videoId: media.videoId,
      title: media.title,
      playlistId: media.playlistId,
      index: media.index,
      params: media.params,
      ctt: media.ctt,
      playing: !video.paused && !video.ended,
      position: video.currentTime,
      duration: Number.isFinite(video.duration)
        ? video.duration
        : 0,
      volume: video.volume * 100,
      muted: video.muted
    }
  });
}

let observedVideo = null;
let lastReportedVideoId = null;

function watchVideo() {
  const video = getVideoElement();
  const media = getCurrentMediaInfo();

  if (!video || video === observedVideo) {
    return;
  }

  observedVideo = video;

  console.log("[YT Caster] Watching video element");

  if (media) {
    lastReportedVideoId = media.videoId;

    console.log("[YT Caster] Current media detected:", media);
  }

  video.addEventListener("play", sendPlayerState);
  video.addEventListener("pause", sendPlayerState);
  video.addEventListener("timeupdate", sendPlayerState);
  video.addEventListener("seeking", sendPlayerState);
  video.addEventListener("seeked", sendPlayerState);
  video.addEventListener("loadedmetadata", sendPlayerState);
  video.addEventListener("volumechange", sendPlayerState);
  video.addEventListener("ended", sendPlayerState);

  sendPlayerState();
}

setInterval(watchVideo, 1000);
