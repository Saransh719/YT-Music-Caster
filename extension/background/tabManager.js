const YT_MUSIC_URL = "https://music.youtube.com/*";

export async function findYouTubeMusicTab() {
  const tabs = await chrome.tabs.query({
    url: YT_MUSIC_URL
  });

  if (tabs.length === 0) {
    return null;
  }

  return tabs[0];
}

export async function getOrCreateYouTubeMusicTab(videoId) {
  const existingTab = await findYouTubeMusicTab();

  const url = buildVideoUrl(videoId);
  if (existingTab) {
    console.log(
      `[YT Caster] Using existing YT Music tab: ${existingTab.id}`
    );

    await chrome.tabs.update(existingTab.id, {
      active: true,
      url
    });

    return existingTab;
  }

  console.log(
    "[YT Caster] No YT Music tab found. Creating one."
  );

  return await chrome.tabs.create({
    url,
    active: true
  });
}

export async function waitForTabLoaded(tabId, timeout = 15000) {
  const tab = await chrome.tabs.get(tabId);

  if (tab.status === "complete") {
    return;
  }

  return new Promise((resolve) => {
    let finished = false;

    const cleanup = () => {
      chrome.tabs.onUpdated.removeListener(listener);
    };

    const finish = () => {
      if (finished) {
        return;
      }

      finished = true;
      cleanup();
      resolve();
    };

    const listener = (updatedTabId, changeInfo) => {
      if (
        updatedTabId === tabId &&
        changeInfo.status === "complete"
      ) {
        finish();
      }
    };

    chrome.tabs.onUpdated.addListener(listener);

    setTimeout(finish, timeout);
  });
}

function buildVideoUrl(videoId) {
  return `https://music.youtube.com/watch?v=${encodeURIComponent(
    videoId
  )}`;
}
