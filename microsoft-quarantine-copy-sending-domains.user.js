// ==UserScript==
// @name         Copy Sender Domains
// @namespace    https://venturebanners.co.uk/
// @version      1.0
// @description  Extracts unique email domains from Sender cells and copies them to the clipboard
// @match        https://security.microsoft.com/quarantine*
// @grant        GM_setClipboard
// @run-at       document-idle
// ==/UserScript==

(function () {
	'use strict';

	// Selector for the sender email text within each grid row
	const SENDER_SELECTOR = 'div[data-automation-key="Sender"] span';

	// Default button label, restored after feedback messages
	const DEFAULT_LABEL = 'Copy Sender Domains';

	// How long feedback text stays on the button (ms)
	const FEEDBACK_MS = 3000;

	// Extracts the domain part from an email address, or returns null if invalid
	// Example usage:
	//   getDomain('kyle.s@htcip.cn');          // 'htcip.cn'
	//   getDomain('support@ashop.com.au');     // 'ashop.com.au'
	//   getDomain('not an email');             // null
	function getDomain(email) {
		// Normalise whitespace and case
		const value = (email || '').trim().toLowerCase();
		// Use the last @ in case of odd local parts
		const at = value.lastIndexOf('@');
		// Reject values with no @ or nothing after it
		if (at === -1 || at === value.length - 1) {
			return null;
		}
		return value.slice(at + 1);
	}

	// Collects unique, sorted domains from all matching Sender elements on the page
	// Example usage:
	//   const domains = collectDomains();  // ['ashop.com.au', 'htcip.cn']
	function collectDomains() {
		// Set removes duplicate domains automatically
		const domains = new Set();
		// Walk every matching span and pull out its domain
		document.querySelectorAll(SENDER_SELECTOR).forEach((el) => {
			const domain = getDomain(el.textContent);
			if (domain) {
				domains.add(domain);
			}
		});
		return [...domains].sort();
	}

	// Shows temporary feedback text on the button, then restores the default label
	// Example usage:
	//   flashButton(btn, 'Copied 5 domains', '#107c10');
	function flashButton(btn, text, colour) {
		btn.textContent = text;
		btn.style.background = colour;
		// Cancel any previous pending reset so rapid clicks behave
		clearTimeout(btn._resetTimer);
		btn._resetTimer = setTimeout(() => {
			btn.textContent = DEFAULT_LABEL;
			btn.style.background = '#0078d4';
		}, FEEDBACK_MS);
	}

	// Handles the button click: gathers domains and copies them to the clipboard
	// Example usage:
	//   btn.addEventListener('click', () => handleClick(btn));
	function handleClick(btn) {
		const domains = collectDomains();
		// Nothing found, so tell the user rather than copying an empty string
		if (domains.length === 0) {
			flashButton(btn, 'No domains found', '#a4262c');
			return;
		}
		// One domain per line
		GM_setClipboard(domains.join('\n'), 'text');
		// Singular/plural wording for the confirmation
		const noun = domains.length === 1 ? 'domain' : 'domains';
		flashButton(btn, `✓ Copied ${domains.length} ${noun}`, '#107c10');
		console.log('[Copy Sender Domains]', domains);
	}

	// Creates the floating button and adds it to the page
	// Example usage:
	//   injectButton();
	function injectButton() {
		// Avoid adding a second button if the script runs again
		if (document.getElementById('tm-copy-sender-domains')) {
			return;
		}
		const btn = document.createElement('button');
		btn.id = 'tm-copy-sender-domains';
		btn.type = 'button';
		btn.textContent = DEFAULT_LABEL;
		// Fixed position keeps it visible as the SPA changes views
		Object.assign(btn.style, {
			position: 'fixed',
			bottom: '20px',
			right: '20px',
			zIndex: '999999',
			padding: '10px 16px',
			background: '#0078d4',
			color: '#fff',
			border: 'none',
			borderRadius: '4px',
			fontSize: '14px',
			fontFamily: 'Segoe UI, sans-serif',
			cursor: 'pointer',
			boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
			transition: 'background 0.2s'
		});
		btn.addEventListener('click', () => handleClick(btn));
		document.body.appendChild(btn);
	}

	injectButton();
})();