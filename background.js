chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "saveTimestamp") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (currentTab.url.includes("youtube.com/watch")) {
        const timestamp = message.timestamp;
        const videoId = new URL(currentTab.url).searchParams.get("v");
        const bookmark = { videoId, timestamp };

        chrome.storage.local.get("bookmarks", (data) => {
          const bookmarks = data.bookmarks || [];
          bookmarks.push(bookmark);
          chrome.storage.local.set({ bookmarks });
        });

        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: "Not a YouTube video page." });
      }
    });
    return true; // Required for asynchronous sendResponse
  }
});