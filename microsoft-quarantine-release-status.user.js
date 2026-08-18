// ==UserScript==
// @name         Quarantine Table Released Status Monitor
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Monitors quarantine list rows, marks them based on "Released" status cells, and flags senders from common email providers
// @author       You
// @match        https://security.microsoft.com/quarantine*
// @grant        none
// ==/UserScript==
(function () {
    'use strict';

    const COMMON_EMAIL_PROVIDERS = [
        '@gmail.com',
        '@outlook.com',
        '@hotmail.com',
        '@btconnect.com',
        '@yahoo.com',
        '@icloud.com',
        '@aol.com',
        '@live.com',
        '@msn.com',
        '@mail.com',
        '@protonmail.com',
        '@proton.me',
        '@gmx.com'
    ];

    function updateRowStatuses() {
        const statusCells = document.querySelectorAll('[data-automation-key="Status"]');
        statusCells.forEach(cell => {
            const row = cell.closest('.ms-List-cell[data-automationid="ListCell"]');
            if (!row) return;
            const cellText = cell.innerText || cell.textContent || '';
            const isReleased = cellText.trim().split(/\s+/).includes('Released');
            row.setAttribute('data-released', isReleased ? 'true' : 'false');
        });
    }

    function updateSenderProviders() {
        const senderSpans = document.querySelectorAll('[data-automation-key="Sender"] span');
        senderSpans.forEach(span => {
            const row = span.closest('.ms-List-cell[data-automationid="ListCell"]');
            if (!row) return;
            const text = (span.innerText || span.textContent || '').trim().toLowerCase();
            const isCommonProvider = COMMON_EMAIL_PROVIDERS.some(domain => text.endsWith(domain));
            row.classList.toggle('common-email-provider', isCommonProvider);
        });
    }

    function initRows() {
        const rows = document.querySelectorAll('.ms-List-cell[data-automationid="ListCell"]');
        rows.forEach(row => {
            if (!row.hasAttribute('data-released')) {
                row.setAttribute('data-released', 'false');
            }
        });
        updateRowStatuses();
        updateSenderProviders();
    }

    function startMonitoring() {
        initRows();
        setInterval(() => {
            initRows();
        }, 1000);
    }

    // Wait for the rows to exist in the DOM before starting
    const domReadyInterval = setInterval(() => {
        if (document.querySelector('.ms-List-cell[data-automationid="ListCell"]')) {
            clearInterval(domReadyInterval);
            startMonitoring();
        }
    }, 500);
})();