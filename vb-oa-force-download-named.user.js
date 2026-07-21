// ==UserScript==
// @name         Force artwork downloads, and named ZIPs
// @namespace    ian.venturebanners
// @version      1.5
// @description  Force browser download for /zip/ links using their download attribute filename
// @match        https://dev.vb-oa.co.uk/*
// @grant        GM_download
// ==/UserScript==

(function () {
	'use strict';

	// Delegate clicks at document level so dynamically added links are covered
	document.addEventListener('click', function (e) {
		// Find the closest matching anchor inside a li.download from the clicked element
		const link = e.target.closest('li.download a');
		if (!link) return;

		// Only intercept /zip/ links that carry a download attribute; all others behave natively
		if (!link.href.includes('/zip/') || !link.getAttribute('download')) return;

		// Stop the browser navigating/opening the file
		e.preventDefault();
		e.stopPropagation();

		// Encode square brackets, which Tampermonkey's XHR rejects when left raw
		const url = link.href.replace(/\[/g, '%5B').replace(/\]/g, '%5D');

		// Use the link's own download attribute as the filename
		let filename = link.getAttribute('download');

		// Ensure the filename carries a .zip extension for the download whitelist
		if (!/\.zip$/i.test(filename)) {
			filename += '.zip';
		}

		// Trigger the privileged download (bypasses CORS)
		GM_download({
			url: url,
			name: filename,
			onerror: function (err) {
				console.error('GM_download failed:', err);
			}
		});
	}, true);
})();