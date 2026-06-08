// ==UserScript==
// @name         Quarantine Table Released Status Monitor
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Monitors quarantine list rows and marks them based on "Released" status cells
// @author       You
// @match        https://security.microsoft.com/quarantine*
// @grant        none
// ==/UserScript==
(function () {
    'use strict';

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

    function initRows() {
        const rows = document.querySelectorAll('.ms-List-cell[data-automationid="ListCell"]');
        rows.forEach(row => {
            if (!row.hasAttribute('data-released')) {
                row.setAttribute('data-released', 'false');
            }
        });
        updateRowStatuses();
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