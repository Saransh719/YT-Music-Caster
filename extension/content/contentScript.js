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

async function handleCommand(message) {
  let video;

  switch (message.command) {
    case "play":
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

  if (!video) {
    return;
  }

  chrome.runtime.sendMessage({
    type: "player_state",
    state: {
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

function watchVideo() {
  const video = getVideoElement();

  if (!video || video === observedVideo) {
    return;
  }

  observedVideo = video;

  console.log("[YT Caster] Watching video element");

  video.addEventListener("play", sendPlayerState);
  video.addEventListener("pause", sendPlayerState);
  video.addEventListener("volumechange", sendPlayerState);
  video.addEventListener("ended", sendPlayerState);

  sendPlayerState();
}

setInterval(watchVideo, 1000);