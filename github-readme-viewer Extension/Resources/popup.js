document.addEventListener('DOMContentLoaded', () => {
    const containerEl = document.getElementById('container');
    const repoNameEl = document.getElementById('repo-name');
    const readmeContentEl = document.getElementById('readme-content');
    const mainContentEl = document.getElementById('main-content');
    const copyContentBtn = document.getElementById('copyContentBtn');
    const copyFileBtn = document.getElementById('copyFileBtn'); // Still get ref for disabling
    const downloadBtn = document.getElementById('downloadBtn'); // Still get ref for disabling
    const statusEl = document.getElementById('status');

    let readmeData = null;
    let decodedContent = '';

    // --- Make download-related buttons permanently disabled ---
    if (copyFileBtn) {
        copyFileBtn.disabled = true;
    }
    if (downloadBtn) {
        downloadBtn.disabled = true;
    }
    // --- End of permanent disable ---

    function setStatus(message, isError = false) {
        if (!statusEl) {
            console.error('[popup] setStatus: statusEl not found!');
            return;
        }
        statusEl.textContent = message;
        statusEl.classList.remove('success', 'error', 'prominent-error');

        if (message) {
            const statusClass = isError ? 'error' : 'success';
            statusEl.classList.add(statusClass);

            if (mainContentEl) {
                if (isError && mainContentEl.style.display === 'none') {
                    statusEl.classList.add('prominent-error');
                }
            } else if (isError) {
                console.warn(
                    '[popup] setStatus: mainContentEl not found when checking for prominent error.'
                );
                statusEl.classList.add('prominent-error');
            }
        }
    }

    function enableRelevantButtons(contentAvailable = false) {
        if (copyContentBtn) {
            copyContentBtn.disabled = !contentAvailable;
        }
        // copyFileBtn and downloadBtn are permanently disabled
    }

    function showReadmeArea(show) {
        if (!mainContentEl || !readmeContentEl || !containerEl) {
            console.error(
                '[popup] showReadmeArea: Crucial DOM elements missing.'
            );
            if (statusEl)
                setStatus('UI Error: Page structure is broken.', true);
            return;
        }

        if (show) {
            mainContentEl.style.display = 'flex';
            readmeContentEl.textContent = 'Loading README...';
            containerEl.style.justifyContent = 'flex-start';
            if (statusEl) statusEl.classList.remove('prominent-error');
        } else {
            mainContentEl.style.display = 'none';
            readmeContentEl.textContent = '';
            containerEl.style.justifyContent = 'center';

            if (
                statusEl &&
                statusEl.textContent &&
                statusEl.classList.contains('error')
            ) {
                statusEl.classList.add('prominent-error');
            }
        }
    }

    async function fetchReadme(owner, repo) {
        console.log('[popup] fetchReadme called for', owner, repo);
        showReadmeArea(true);
        setStatus('Fetching README...', false);
        enableRelevantButtons(false);

        try {
            const response = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/readme`
            );

            if (!response.ok) {
                let errorMsg = `Failed to fetch README. Status: ${response.status}`;
                if (response.status === 404) {
                    errorMsg = `README not found. This might be a private repository or the README doesn't exist.`;
                } else if (response.status === 403) {
                    errorMsg = `Access denied (Error ${response.status}). This could be due to API rate limits or a private repository.`;
                }
                throw new Error(errorMsg);
            }
            readmeData = await response.json();
            decodedContent = atob(readmeData.content);

            if (readmeContentEl) readmeContentEl.textContent = decodedContent;
            if (repoNameEl)
                repoNameEl.textContent = `${owner}/${repo} (${readmeData.name})`;

            setStatus('');
            enableRelevantButtons(true);
        } catch (error) {
            console.error('[popup] Error fetching README:', error.message);
            if (repoNameEl) {
                if (owner && repo) {
                    repoNameEl.textContent = `${owner}/${repo}`;
                } else {
                    repoNameEl.textContent = 'Error';
                }
            }
            showReadmeArea(false);
            setStatus(error.message, true);
            enableRelevantButtons(false);
        }
    }

    // Initial setup
    console.log('[popup] DOMContentLoaded: Initializing popup.');
    if (
        !mainContentEl ||
        !copyContentBtn ||
        !statusEl ||
        !containerEl ||
        !repoNameEl ||
        !readmeContentEl
    ) {
        console.error(
            '[popup] CRITICAL: One or more essential DOM elements not found on init. Popup may not function correctly.'
        );
        if (statusEl)
            statusEl.textContent = 'Error: Popup UI failed to load correctly.';
        return;
    }

    showReadmeArea(false);
    enableRelevantButtons(false);

    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        console.log('[popup] browser.tabs.query callback executed.');
        const currentTab = tabs[0];

        if (!repoNameEl) {
            setStatus('UI Error: Repo name element missing.', true);
            showReadmeArea(false);
            return;
        }

        if (currentTab && currentTab.url) {
            console.log('[popup] Current tab URL:', currentTab.url);
            try {
                const url = new URL(currentTab.url);
                if (url.hostname === 'github.com') {
                    const pathParts = url.pathname
                        .split('/')
                        .filter((part) => part.length > 0);
                    if (pathParts.length >= 2) {
                        const owner = pathParts[0];
                        const repo = pathParts[1];
                        console.log(
                            '[popup] GitHub repo identified:',
                            owner,
                            repo
                        );
                        repoNameEl.textContent = `${owner}/${repo}`;
                        fetchReadme(owner, repo);
                    } else {
                        console.log(
                            '[popup] Not a repository page (pathParts < 2).'
                        );
                        repoNameEl.textContent = 'N/A';
                        setStatus(
                            'Not a repository page. Navigate to a GitHub repo.',
                            true
                        );
                        showReadmeArea(false);
                    }
                } else {
                    console.log('[popup] Not a GitHub.com page.');
                    repoNameEl.textContent = 'N/A';
                    setStatus(
                        'This extension only works on GitHub.com repos.',
                        true
                    );
                    showReadmeArea(false);
                }
            } catch (e) {
                console.error(
                    '[popup] Invalid URL:',
                    currentTab.url,
                    e.message
                );
                repoNameEl.textContent = 'N/A';
                setStatus('Could not process the current page URL.', true);
                showReadmeArea(false);
            }
        } else {
            console.warn('[popup] Could not get current tab or URL.');
            repoNameEl.textContent = 'N/A';
            setStatus('Error accessing tab information.', true);
            showReadmeArea(false);
        }
    });

    if (copyContentBtn) {
        copyContentBtn.addEventListener('click', async () => {
            if (!decodedContent) {
                setStatus('No content to copy.', true);
                return;
            }
            try {
                await navigator.clipboard.writeText(decodedContent);
                setStatus('README content copied!', false);
            } catch (err) {
                console.error('Failed to copy content: ', err);
                setStatus('Failed to copy content.', true);
            }
        });
    }

    // --- copyFileBtn event listener commented out ---
    /*
    if(copyFileBtn) {
        copyFileBtn.addEventListener('click', async () => {
            if (!readmeData || !decodedContent) {
                setStatus('No file data to copy.', true);
                return;
            }
            try {
                let mimeType = 'text/plain';
                if (readmeData.name && readmeData.name.toLowerCase().endsWith('.md')) {
                    mimeType = 'text/markdown';
                }
                const blob = new Blob([decodedContent], { type: mimeType });
                const clipboardItem = new ClipboardItem({ [blob.type]: blob });
                await navigator.clipboard.write([clipboardItem]);
                setStatus(`File content (${readmeData.name}) copied.`, false);
            } catch (err) {
                console.error('Failed to copy file: ', err);
                try {
                    await navigator.clipboard.writeText(decodedContent);
                    setStatus('File content copied as text (advanced copy failed).', false);
                } catch (fallbackErr) {
                    console.error('Fallback text copy failed: ', fallbackErr);
                    setStatus('Failed to copy file content.', true);
                }
            }
        });
    }
    */

    // --- downloadBtn event listener commented out ---
    /*
    if(downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            console.log('[popup] Download button clicked.');
            if (!readmeData || !decodedContent) {
                setStatus('No file to download.', true);
                console.warn('[popup] Download attempt with no readmeData or decodedContent.');
                return;
            }

            let objectUrl = null;

            try {
                const blob = new Blob([decodedContent], { type: 'text/plain;charset=utf-8' });
                objectUrl = URL.createObjectURL(blob);
                console.log('[popup] Blob created, objectUrl:', objectUrl);

                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = 'download-iframe.html';
                console.log('[popup] Iframe created, src set to download-iframe.html');

                let iframeProcessed = false;

                const cleanup = () => {
                    console.log('[popup] Cleanup called for objectUrl:', objectUrl);
                    if (iframe && iframe.parentNode === document.body) {
                        console.log('[popup] Removing iframe from document.body.');
                        document.body.removeChild(iframe);
                    } else if (iframe) {
                        console.warn('[popup] Iframe was not found in document.body during cleanup or already removed.');
                    }
                    if (objectUrl) {
                        console.log('[popup] Revoking objectUrl:', objectUrl);
                        URL.revokeObjectURL(objectUrl);
                        objectUrl = null;
                    } else {
                        console.warn("[popup] objectUrl was already null during cleanup for iframe related to:", iframe ? iframe.src : "unknown iframe");
                    }
                };

                iframe.onload = () => {
                    if (iframeProcessed) {
                        console.warn('[popup] Iframe onload called more than once for this download instance. Ignoring.');
                        return;
                    }
                    iframeProcessed = true;
                    console.log('[popup] Iframe loaded for objectUrl:', objectUrl);

                    const targetOrigin = iframe.contentWindow.location.origin;
                    console.log('[popup] Target origin for postMessage:', targetOrigin);

                    try {
                        iframe.contentWindow.postMessage({
                            type: 'initiateDownload',
                            filename: readmeData.name || 'README.txt',
                            uri: objectUrl
                        }, targetOrigin);
                        console.log('[popup] postMessage sent to iframe with filename:', readmeData.name || 'README.txt', 'and objectUrl:', objectUrl);
                        setStatus(`${readmeData.name} download initiated.`, false);
                    } catch (postMessageError) {
                        console.error('[popup] Error during postMessage to iframe:', postMessageError);
                        setStatus('Error communicating with download helper.', true);
                    } finally {
                        setTimeout(cleanup, 1000);
                    }
                };

                iframe.onerror = () => {
                    if (iframeProcessed) {
                        console.warn('[popup] Iframe onerror called after processing. Ignoring.');
                        return;
                    }
                    iframeProcessed = true;
                    console.error("[popup] Failed to load download iframe. Iframe src:", iframe.src, "for objectUrl:", objectUrl);
                    setStatus("Download helper failed to load.", true);
                    cleanup();
                };

                console.log('[popup] Appending iframe to document.body.');
                document.body.appendChild(iframe);

            } catch (err) {
                console.error('[popup] Error in downloadBtn click handler (outer try-catch):', err);
                setStatus('Error setting up download.', true);
                if (objectUrl) {
                    console.log("[popup] Revoking objectUrl from outer catch:", objectUrl);
                    URL.revokeObjectURL(objectUrl);
                }
            }
        });
    }
    */

    console.log('[popup] DOMContentLoaded: Initialization complete.');
});
