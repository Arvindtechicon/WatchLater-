document.addEventListener("DOMContentLoaded", () => {
  const bookmarkButton = document.getElementById("bookmarkButton");
  const bookmarksList = document.getElementById("bookmarksList");

  // Save the current timestamp when the button is clicked
  bookmarkButton.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.url.includes("youtube.com/watch")) {
      alert("Please open a YouTube video to bookmark.");
      return;
    }

    try {
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const video = document.querySelector("video");
          if (!video) throw new Error("Video element not found.");
          return Math.floor(video.currentTime);
        },
      });

      const timestamp = result[0].result;
      chrome.runtime.sendMessage(
        { action: "saveTimestamp", timestamp },
        (response) => {
          if (response.success) {
            alert(`Timestamp ${timestamp}s saved!`);
            loadBookmarks();
          } else {
            alert(response.error);
          }
        }
      );
    } catch (error) {
      alert("Failed to retrieve timestamp. Please try again.");
      console.error(error);
    }
  });

  // Load saved bookmarks
  function loadBookmarks() {
    chrome.storage.local.get("bookmarks", (data) => {
      const bookmarks = data.bookmarks || [];
      bookmarksList.innerHTML = "";

      bookmarks.forEach((bookmark, index) => {
        const listItem = document.createElement("li");

        // Display bookmark details
        const bookmarkDetails = document.createElement("span");
        bookmarkDetails.innerHTML = `
          <span class="timestamp">[${bookmark.timestamp}s]</span>
          <span class="video-id">${bookmark.videoId}</span>
        `;
        bookmarkDetails.style.cursor = "pointer"; // Make it clickable
        bookmarkDetails.addEventListener("click", () => {
          // Navigate to the bookmarked video
          const url = `https://www.youtube.com/watch?v=${bookmark.videoId}&t=${bookmark.timestamp}`;
          chrome.tabs.create({ url });
        });

        listItem.appendChild(bookmarkDetails);

        // Add a delete button
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.classList.add("delete-button");
        deleteButton.addEventListener("click", (event) => {
          event.stopPropagation(); // Prevent triggering the parent click event
          // Remove the bookmark from storage
          const updatedBookmarks = bookmarks.filter((_, i) => i !== index);
          chrome.storage.local.set({ bookmarks: updatedBookmarks }, () => {
            loadBookmarks(); // Reload the bookmarks list
          });
        });

        listItem.appendChild(deleteButton);
        bookmarksList.appendChild(listItem);
      });
    });
  }

  loadBookmarks();
});