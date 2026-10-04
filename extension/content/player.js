export function getVideoElement() {
  return document.querySelector("video");
}

export function getPlayerState() {
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

export async function play(position = null) {
  const video = getVideoElement();

  if (!video) {
    throw new Error("Video element not found");
  }

  if (position !== null) {
    video.currentTime = position;
  }

  await video.play();
}

export function pause() {
  const video = getVideoElement();

  if (!video) {
    throw new Error("Video element not found");
  }

  video.pause();
}

export async function resume() {
  const video = getVideoElement();

  if (!video) {
    throw new Error("Video element not found");
  }

  await video.play();
}

export function seek(position) {
  const video = getVideoElement();

  if (!video) {
    throw new Error("Video element not found");
  }

  video.currentTime = position;
}

export function stop() {
  const video = getVideoElement();

  if (!video) {
    throw new Error("Video element not found");
  }

  video.pause();
  video.currentTime = 0;
}

export function setVolume(level, muted = false) {
  const video = getVideoElement();

  if (!video) {
    throw new Error("Video element not found");
  }

  video.volume = Math.max(
    0,
    Math.min(1, level / 100)
  );

  video.muted = muted;
}