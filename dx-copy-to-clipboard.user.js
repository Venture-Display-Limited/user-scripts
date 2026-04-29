// ==UserScript==
// @name         DX - Click to Copy Consignment Number and No. of Items
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Copies element text to clipboard on click and adds 'clicked' class
// @match        https://dxfreight.co.uk/dm6lite/*
// @match        https://dm6.dxfreight.co.uk/dm6lite/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
	'use strict';

	// Array of element IDs we want to make clickable-to-copy
	const targetIds = ['lbl_consno', 'lbl_totalitems'];

	// Click handler attached to each target element
	function handleClick(event) {
		// Reference the actual element that was clicked
		const el = event.currentTarget;
		// Grab the element's text content, trimmed of surrounding whitespace
		const text = (el.textContent || '').trim();

		// Write the text to the clipboard using the async Clipboard API
		navigator.clipboard.writeText(text);

		// Add the 'clicked' class to the element for any styling/state tracking
		el.classList.add('clicked');
	}

	// Loop through each target ID and wire up the click handler if the element exists
	targetIds.forEach(function(id) {
		// Look up the element by ID
		const el = document.getElementById(id);
		// Only attach the listener if the element is actually present on the page
		if (el) {
			// Give the user a visual cue that the element is interactive
			el.style.cursor = 'pointer';
			// Attach the click listener
			el.addEventListener('click', handleClick);
		}
	});
})();