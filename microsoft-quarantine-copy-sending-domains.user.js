// ==UserScript==
// @name         Copy Sender Domains
// @namespace    https://venturebanners.co.uk/
// @version      1.2
// @description  Adds a clickable Sender domain column to the quarantine grid, plus a button to copy all 'Needs review' domains
// @match        https://security.microsoft.com/quarantine*
// @grant        GM_setClipboard
// @run-at       document-idle
// ==/UserScript==

(function () {
	'use strict';

	// Selector for each row of the quarantine grid
	const ROW_SELECTOR = 'div[data-automationid="DetailsRow"]';

	// Selectors for the cells read within a row
	const SENDER_SELECTOR = 'div[data-automation-key="Sender"] span';
	const STATUS_SELECTOR = 'div[data-automation-key="Status"] span';

	// Selector for the Sender gridcell itself, used as the clone source
	const SENDER_CELL_SELECTOR = 'div[data-automation-key="Sender"]';

	// Selector for the Sender column header, used as the clone source for the new header
	const SENDER_HEADER_SELECTOR = 'div[data-automationid="ColumnsHeaderColumn"][data-item-key="Sender"]';

	// Key identifying the injected column, kept distinct from Microsoft's own keys
	const DOMAIN_KEY = 'VBSenderDomain';

	// Selectors for the injected cells and headers
	const DOMAIN_CELL_SELECTOR = `div[data-automation-key="${DOMAIN_KEY}"]`;
	const DOMAIN_HEADER_SELECTOR = `div[data-item-key="${DOMAIN_KEY}"]`;

	// Width of the injected column, matching the style attribute Fluent uses
	const DOMAIN_COLUMN_WIDTH = '200px';

	// Heading text for the injected column
	const DOMAIN_COLUMN_LABEL = 'Sender domain';

	// Only rows whose Status matches this are included by the copy-all button
	const WANTED_STATUS = 'needs review';

	// Default button label, restored after feedback messages
	const DEFAULT_LABEL = 'Copy Sender Domains';

	// How long feedback text stays on the copy-all button (ms)
	const FEEDBACK_MS = 3000;

	// How long a clicked domain cell shows its copied confirmation (ms)
	const CELL_FEEDBACK_MS = 1200;

	// How long to wait for DOM changes to settle before re-injecting (ms)
	const DEBOUNCE_MS = 100;

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

	// Reads the trimmed, lowercased text of a cell within a row, or '' if absent
	// Example usage:
	//   cellText(row, STATUS_SELECTOR);  // 'needs review'
	function cellText(row, selector) {
		const el = row.querySelector(selector);
		return el ? el.textContent.trim().toLowerCase() : '';
	}

	// Collects unique, sorted domains from rows whose Status is 'Needs review'
	// Example usage:
	//   const domains = collectDomains();  // ['brandlnkmedia.net', 'copyexpressyes.com']
	function collectDomains() {
		// Set removes duplicate domains automatically
		const domains = new Set();
		// Walk every row so the Sender is only read when the Status matches
		document.querySelectorAll(ROW_SELECTOR).forEach((row) => {
			// Skip Released, Denied, and any other status
			if (cellText(row, STATUS_SELECTOR) !== WANTED_STATUS) {
				return;
			}
			const domain = getDomain(cellText(row, SENDER_SELECTOR));
			if (domain) {
				domains.add(domain);
			}
		});
		return [...domains].sort();
	}

	// Copies a single value to the clipboard and briefly confirms it on the clicked cell
	// Example usage:
	//   copyFromCell(domainSpan, 'htcip.cn');
	function copyFromCell(span, domain) {
		GM_setClipboard(domain, 'text');
		// Flag the cell so the refresh pass leaves the confirmation text alone
		span.dataset.vbFlashing = '1';
		span.textContent = '✓ Copied';
		span.style.color = '#107c10';
		// Cancel any previous pending reset so rapid clicks behave
		clearTimeout(span._resetTimer);
		span._resetTimer = setTimeout(() => {
			delete span.dataset.vbFlashing;
			// Read the value back, in case the row was recycled while the confirmation showed
			span.textContent = span.dataset.vbDomain || '';
			span.style.color = '';
		}, CELL_FEEDBACK_MS);
	}

	// Builds the injected domain cell for a row by cloning its Sender cell
	// Example usage:
	//   const cell = buildDomainCell(senderCell);
	function buildDomainCell(senderCell) {
		// Cloning inherits Fluent's hashed classes, so the cell stays styled correctly
		const cell = senderCell.cloneNode(true);
		// Re-key the clone so it is never mistaken for a real Sender cell
		cell.setAttribute('data-automation-key', DOMAIN_KEY);
		cell.style.width = DOMAIN_COLUMN_WIDTH;
		const span = cell.querySelector('span');
		// Without an inner span there is nothing to populate, so discard the clone
		if (!span) {
			return null;
		}
		// Present the value as a clickable control
		span.setAttribute('role', 'button');
		span.style.cursor = 'pointer';
		span.style.textDecoration = 'underline dotted';
		// Swallow the event so Fluent does not select the row or open the detail panel
		['mousedown', 'mouseup', 'click'].forEach((type) => {
			span.addEventListener(type, (e) => {
				e.stopPropagation();
				e.preventDefault();
				// Only the click itself should copy
				if (type === 'click' && span.dataset.vbDomain) {
					copyFromCell(span, span.dataset.vbDomain);
				}
			});
		});
		return cell;
	}

	// Adds or refreshes the domain cell in every row, keeping it next to the Sender cell
	// Example usage:
	//   injectRowCells();
	function injectRowCells() {
		document.querySelectorAll(ROW_SELECTOR).forEach((row) => {
			const senderCell = row.querySelector(SENDER_CELL_SELECTOR);
			// Rows still rendering may have no Sender cell yet
			if (!senderCell) {
				return;
			}
			let cell = row.querySelector(DOMAIN_CELL_SELECTOR);
			// Build the cell on first pass, or when Fluent has re-rendered the row
			if (!cell) {
				cell = buildDomainCell(senderCell);
				if (!cell) {
					return;
				}
				senderCell.insertAdjacentElement('afterend', cell);
			}
			const span = cell.querySelector('span');
			const domain = getDomain(senderCell.textContent) || '';
			// Fluent recycles row elements while scrolling, so the value is refreshed every pass
			span.dataset.vbDomain = domain;
			cell.title = senderCell.textContent.trim();
			// Leave a copied confirmation on screen for its full duration
			if (!span.dataset.vbFlashing && span.textContent !== domain) {
				span.textContent = domain;
			}
		});
	}

	// Adds the column header after the Sender header, for both the fixed and sticky copies
	// Example usage:
	//   injectHeaderCells();
	function injectHeaderCells() {
		document.querySelectorAll(SENDER_HEADER_SELECTOR).forEach((senderHeader) => {
			const headerRow = senderHeader.parentElement;
			// Nothing to attach to if the header is detached mid-render
			if (!headerRow || headerRow.querySelector(DOMAIN_HEADER_SELECTOR)) {
				return;
			}
			// Cloning inherits Fluent's hashed classes, so the header stays styled correctly
			const header = senderHeader.cloneNode(true);
			header.setAttribute('data-item-key', DOMAIN_KEY);
			header.removeAttribute('aria-sort');
			header.removeAttribute('data-automationid');
			header.style.width = DOMAIN_COLUMN_WIDTH;
			// Strip ids and ARIA references that would otherwise duplicate the Sender header's
			header.querySelectorAll('[id], [aria-labelledby], [aria-describedby]').forEach((el) => {
				el.removeAttribute('id');
				el.removeAttribute('aria-labelledby');
				el.removeAttribute('aria-describedby');
			});
			// The sort chevron does nothing on an injected column
			const chevron = header.querySelector('i[data-icon-name="ChevronDown"]');
			if (chevron) {
				chevron.remove();
			}
			// The deepest span holds the visible heading text
			const title = header.querySelector('span span span') || header.querySelector('span');
			if (title) {
				title.textContent = DOMAIN_COLUMN_LABEL;
			}
			// The resize handle after the Sender header belongs to that boundary, so insert past it
			const sizer = senderHeader.nextElementSibling;
			const anchor = sizer && sizer.className.includes('cellSizer') ? sizer : senderHeader;
			anchor.insertAdjacentElement('afterend', header);
		});
	}

	// Shows temporary feedback text on the copy-all button, then restores the default label
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

	// Handles the copy-all click: gathers domains and copies them to the clipboard
	// Example usage:
	//   btn.addEventListener('click', () => handleClick(btn));
	function handleClick(btn) {
		const domains = collectDomains();
		// Nothing found, so tell the user rather than copying an empty string
		if (domains.length === 0) {
			flashButton(btn, 'No "Needs review" rows', '#a4262c');
			return;
		}
		// One domain per line
		GM_setClipboard(domains.join('\n'), 'text');
		// Singular/plural wording for the confirmation
		const noun = domains.length === 1 ? 'domain' : 'domains';
		flashButton(btn, `✓ Copied ${domains.length} ${noun}`, '#107c10');
		console.log('[Copy Sender Domains]', domains);
	}

	// Creates the floating copy-all button and adds it to the page
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

	// Watches the grid so the column survives scrolling, sorting, and view changes
	const observer = new MutationObserver(() => schedule());

	// Pending debounce timer for the injection pass
	let timer = null;

	// Runs the injection pass with the observer paused, so our own edits do not retrigger it
	// Example usage:
	//   run();
	function run() {
		observer.disconnect();
		try {
			injectHeaderCells();
			injectRowCells();
			injectButton();
		} finally {
			observer.observe(document.body, { childList: true, subtree: true });
		}
	}

	// Coalesces bursts of DOM changes into a single injection pass
	// Example usage:
	//   schedule();
	function schedule() {
		clearTimeout(timer);
		timer = setTimeout(run, DEBOUNCE_MS);
	}

	run();
})();