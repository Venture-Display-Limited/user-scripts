// ==UserScript==
// @name         Bitbucket Commit Message Autofocus
// @namespace    https://bitbucket.org/
// @version      1.0.0
// @description  Autofocuses and clears the commit message textarea when pushing changes via the Bitbucket web UI
// @author       You
// @match        https://bitbucket.org/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const DIALOG_SELECTOR = '[role="dialog"][data-testid="modal-dialog"]';
    const TEXTAREA_SELECTOR = 'textarea';

    function handleDialog(dialog) {
        const textarea = dialog.querySelector(TEXTAREA_SELECTOR);
        if (!textarea) return;

        textarea.value = '';
        textarea.focus();
    }

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (!(node instanceof HTMLElement)) continue;

                if (node.matches(DIALOG_SELECTOR)) {
                    handleDialog(node);
                } else {
                    const dialog = node.querySelector(DIALOG_SELECTOR);
                    if (dialog) handleDialog(dialog);
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
