// ==UserScript==
// @name         PiKVM - Disable "Leave site?" prompt
// @namespace    venture
// @match        https://kvm-caldera-a.venturebanners.network/*
// @match        https://kvm-backup-server.venturebanners.network/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
	"use strict";

	// Keep a reference to the original so all other event types still work
	const realAdd = EventTarget.prototype.addEventListener;

	// Swallow any beforeunload listener the page tries to register
	EventTarget.prototype.addEventListener = function (type, listener, options) {
		// Drop beforeunload registrations; pass everything else through unchanged
		if (type === "beforeunload") {
			return;
		}
		return realAdd.call(this, type, listener, options);
	};

	// Block direct window.onbeforeunload = fn assignments and force it to stay null
	Object.defineProperty(window, "onbeforeunload", {
		configurable: false,
		get() {
			return null;
		},
		set() {
			// Ignore whatever the page tries to assign
		},
	});
})();