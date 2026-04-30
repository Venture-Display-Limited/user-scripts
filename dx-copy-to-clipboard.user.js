// ==UserScript==
// @name         Auto-Clipboard/Click to Copy - lbl_consno & lbl_totalitems
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Copies element text to clipboard on click, plus auto-copies #lbl_consno when it appears
// @match        https://dxfreight.co.uk/dm6lite/*
// @match        https://dm6.dxfreight.co.uk/dm6lite/*
// @grant        GM_setClipboard
// @run-at       document-end
// ==/UserScript==

(function() {
	'use strict';

	// Array of element IDs we want to make clickable-to-copy
	const targetIds = ['lbl_consno', 'lbl_totalitems'];

	// Track whether we've already auto-copied #lbl_consno so we don't repeat on DOM mutations
	let autoCopied = false;

	// Inject a stylesheet that appends a tick emoji after any element with the 'auto-copied' class
	function injectStyles() {
		// Create a <style> element to hold our CSS rule
		const style = document.createElement('style');
		// Define the ::after rule that adds the tick with a small left margin for spacing
		style.textContent = '#lbl_consno.auto-copied::after { content: " ✅"; }';
		// Append the style element to the document head
		document.head.appendChild(style);
	}

	// Click handler attached to each target element
	function handleClick(event) {
		// Reference the actual element that was clicked
		const el = event.currentTarget;
		// Grab the element's text content, trimmed of surrounding whitespace
		const text = (el.textContent || '').trim();

		// Write the text to the clipboard via Tampermonkey's API (no user-gesture requirement)
		GM_setClipboard(text);

		// Add the 'clicked' class to the element for any styling/state tracking
		el.classList.add('clicked');
	}

	// Wire up the click handler on a given element if it hasn't been wired up already
	function attachClickHandler(el) {
		// Use a data attribute as a flag to avoid attaching the listener more than once
		if (el.dataset.copyHandlerAttached === 'true') return;
		// Mark the element as wired up
		el.dataset.copyHandlerAttached = 'true';
		// Give the user a visual cue that the element is interactive
		el.style.cursor = 'pointer';
		// Attach the click listener
		el.addEventListener('click', handleClick);
	}

	// Check the DOM for our target elements and act on them as needed
	function checkForTargets() {
		// Loop through each target ID
		targetIds.forEach(function(id) {
			// Look up the element by ID
			const el = document.getElementById(id);
			// Skip if the element isn't present yet
			if (!el) return;
			// Always attach the click handler (idempotent)
			attachClickHandler(el);
		});

		// Handle the auto-copy behaviour for #lbl_consno on first detection only
		if (!autoCopied) {
			// Look up the consignment number element specifically
			const consEl = document.getElementById('lbl_consno');
			// Only proceed if it exists and has non-empty text
			if (consEl) {
				// Get its trimmed text content
				const text = (consEl.textContent || '').trim();
				// Only copy if there's actually something to copy
				if (text) {
					// Write the text to the clipboard automatically
					GM_setClipboard(text);
					// Add the 'clicked' class to mirror the manual click behaviour
					consEl.classList.add('clicked');
					// Add the 'auto-copied' class so the CSS ::after rule appends the tick emoji
					consEl.classList.add('auto-copied');
					// Flip the flag so we don't auto-copy again later in the session
					autoCopied = true;
				}
			}
		}
	}

	// Inject the tick emoji stylesheet up front so it's ready before any auto-copy happens
	injectStyles();

	// Run an initial check in case the elements are already present at script start
	checkForTargets();

	// Set up a MutationObserver to watch for the elements being added/changed later
	const observer = new MutationObserver(function() {
		// Re-run the check on any DOM mutation
		checkForTargets();
	});

	// Observe the entire document for child additions/removals at any depth
	observer.observe(document.body, {
		childList: true,
		subtree: true
	});
})();