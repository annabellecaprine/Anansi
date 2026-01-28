/*
 * Anansi Panel: Validator
 * File: js/panels/validator.js
 */

(function (A) {
  'use strict';

  function render(container) {
    const state = A.State.get();
    const issues = A.Validator ? A.Validator.run(state) : [];

    // Standard layout
    container.className = 'panel-container flex-col h-full overflow-hidden';

    const issueCount = issues.length;
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warnCount = issues.filter(i => i.severity === 'warn').length;
    const infoCount = issues.filter(i => i.severity === 'info').length;

    const card = document.createElement('div');
    card.className = 'card flex-col h-full min-h-0';

    let listHtml = '<div class="flex-col">';

    if (issueCount === 0) {
      listHtml += `
        <div class="p-xl text-center text-muted flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--status-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-sm"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <div>All checks passed. Web Integrity is 100%.</div>
        </div>`;
    } else {
      issues.forEach(issue => {
        let color = 'var(--text-secondary)';
        let bg = 'transparent';
        let icon = '';

        switch (issue.severity) {
          case 'error':
            color = 'var(--status-error)';
            bg = 'rgba(211, 47, 47, 0.1)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
            break;
          case 'warn':
            color = 'var(--status-warning)';
            bg = 'rgba(237, 108, 2, 0.1)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
            break;
          case 'info':
            color = 'var(--accent-primary)';
            bg = 'rgba(124, 77, 255, 0.1)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
            break;
        }

        listHtml += `
          <div class="p-sm border-b border-subtle flex-row gap-sm items-start">
            <div class="flex-shrink-0 mt-xs" style="color:${color};">${icon}</div>
            <div class="flex-1">
              <div class="font-medium text-sm text-primary">${issue.message}</div>
              <div class="text-xs text-muted mt-xs flex-row gap-sm items-center">
                ${issue.location ? `<span class="bg-surface px-sm py-xs rounded text-tiny">${issue.location}</span>` : ''}
                <code>${issue.id}</code>
              </div>
            </div>
          </div>
        `;
      });
    }

    listHtml += '</div>';

    card.innerHTML = `
      <div class="card-header">
        <strong>Validation Report</strong>
        <div class="flex-row gap-sm">
          ${errorCount > 0 ? `<span class="text-error font-bold text-xs">${errorCount} Errors</span>` : ''}
          ${warnCount > 0 ? `<span class="text-warning font-bold text-xs">${warnCount} Warnings</span>` : ''}
          ${infoCount > 0 ? `<span class="text-accent font-bold text-xs">${infoCount} Info</span>` : ''}
        </div>
      </div>
      <div class="card-body scroll-y p-0 flex-1">
        ${listHtml}
      </div>
    `;

    container.appendChild(card);
  }

  A.registerPanel('validator', {
    label: 'Validator',
    subtitle: 'Web Integrity',
    category: 'Deep',
    hidden: true,
    render: render
  });

})(window.Anansi);
