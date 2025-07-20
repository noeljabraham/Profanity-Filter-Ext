// content.js

import { filterBadWords } from "@tekdi/multilingual-profanity-filter";

// 1. Languages to apply
const languages = ["en", "hi", "ml"];

// 2. State flag (defaults to enabled)
let enabled = true;

// 3. Read initial enabled/disabled state from storage
chrome.storage.local.get({ enabled: true }, ({ enabled: val }) => {
  enabled = val;
  // only run initial scan if enabled
  if (enabled) walk(document.body);
});

// 4. Listen for changes to the flag
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) {
    enabled = changes.enabled.newValue;
    if (enabled) {
      // if turning back on, scan the entire page
      walk(document.body);
    }
  }
});

// 5. Walk the DOM tree
function walk(node) {
  let child = node.firstChild;
  while (child) {
    const next = child.nextSibling;
    if (child.nodeType === Node.TEXT_NODE) {
      processTextNode(child);
    } else if (
      child.nodeType === Node.ELEMENT_NODE &&
      !["SCRIPT", "STYLE", "TEXTAREA", "INPUT"].includes(child.tagName)
    ) {
      walk(child);
    }
    child = next;
  }
}

// 6. Process & mask one text node (if enabled)
function processTextNode(textNode) {
  if (!enabled) return;  // skip if disabled

  const text = textNode.textContent;
  const tokens = text.split(/(\s+)/);
  let replaced = false;
  const frag = document.createDocumentFragment();

  tokens.forEach((tok) => {
    // preserve leading/trailing punctuation
    const leading  = (tok.match(/^[^\p{L}\d]+/u) || [""])[0];
    const trailing = (tok.match(/[^\p{L}\d]+$/u) || [""])[0];
    const core     = tok.slice(leading.length, tok.length - trailing.length);

    // run core through each language’s filter
    let cleanedCore = core;
    for (const lang of languages) {
      cleanedCore = filterBadWords(cleanedCore, lang);
    }

    if (cleanedCore !== core) {
      const censored = leading + cleanedCore + trailing;
      frag.appendChild(document.createTextNode(censored));
      replaced = true;
    } else {
      frag.appendChild(document.createTextNode(tok));
    }
  });

  if (replaced) {
    textNode.replaceWith(frag);
  }
}

// 7. Observe dynamic changes
new MutationObserver((mutations) => {
  for (const m of mutations) {
    for (const n of m.addedNodes) {
      if (n.nodeType === Node.TEXT_NODE) {
        processTextNode(n);
      } else if (n.nodeType === Node.ELEMENT_NODE) {
        walk(n);
      }
    }
  }
}).observe(document.body, { childList: true, subtree: true });
