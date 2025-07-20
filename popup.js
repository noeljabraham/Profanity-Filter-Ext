// popup.js
const checkbox = document.getElementById("toggle");

chrome.storage.local.get({ enabled: true }, ({ enabled }) => {
  checkbox.checked = enabled;
});

checkbox.addEventListener("change", () => {
  chrome.storage.local.set({ enabled: checkbox.checked });
});
