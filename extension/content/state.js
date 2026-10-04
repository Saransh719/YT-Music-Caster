let lastState = null;

export function getState(video) {
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

export function hasStateChanged(state) {
  if (!lastState) {
    lastState = state;
    return true;
  }

  const changed =
    state.playing !== lastState.playing ||
    Math.abs(state.position - lastState.position) > 1 ||
    Math.abs(state.duration - lastState.duration) > 1 ||
    state.volume !== lastState.volume ||
    state.muted !== lastState.muted;

  if (changed) {
    lastState = state;
  }

  return changed;
}