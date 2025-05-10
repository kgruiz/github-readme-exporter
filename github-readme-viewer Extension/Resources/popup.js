document.addEventListener('DOMContentLoaded', () => {
    const containerEl = document.getElementById('container');
    const repoNameEl = document.getElementById('repo-name');
    const readmeContentEl = document.getElementById('readme-content');
    const mainContentEl = document.getElementById('main-content');
    const copyContentBtn = document.getElementById('copyContentBtn');
    const copyFileBtn = document.getElementById('copyFileBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const statusEl = document.getElementById('status');

    let readmeData = null;
    let decodedContent = '';

    function setStatus(message, isError = false) {
        statusEl.textContent = message;
        statusEl.classList.remove('success', 'error', 'prominent-error');

        if (message) {
            const statusClass = isError ? 'error' : 'success';
            statusEl.classList.add(statusClass);

            if (isError && mainContentEl.style.display === 'none') {
                statusEl.classList.add('prominent-error');
            }
        }
    }

    function enableButtons(enable = true) {
        copyContentBtn.disabled = !enable;
        copyFileBtn.disabled = !enable;
        downloadBtn.disabled = !enable;
    }

    function showReadmeArea(show) {
        if (show) {
            mainContentEl.style.display = 'flex';
            readmeContentEl.textContent = 'Loading README...';
            containerEl.style.justifyContent = 'flex-start';
            statusEl.classList.remove('prominent-error');
        } else {
            mainContentEl.style.display = 'none';
            readmeContentEl.textContent = '';
            containerEl.style.justifyContent = 'center';

            if (statusEl.textContent && statusEl.classList.contains('error')) {
                statusEl.classList.add('prominent-error');
            }
        }
    }

    async function fetchReadme(owner, repo) {
        showReadmeArea(true);
        setStatus('Fetching README...', false);
        enableButtons(false);

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

            readmeContentEl.textContent = decodedContent;
            repoNameEl.textContent = `${owner}/${repo} (${readmeData.name})`;
            setStatus('');
            enableButtons(true);
        } catch (error) {
            console.error('Error fetching README:', error);
            if (owner && repo) {
                repoNameEl.textContent = `${owner}/${repo}`;
            } else {
                repoNameEl.textContent = 'Error';
            }
            showReadmeArea(false);
            setStatus(error.message, true);
            enableButtons(false);
        }
    }

    showReadmeArea(false);
    enableButtons(false);

    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        if (currentTab && currentTab.url) {
            try {
                const url = new URL(currentTab.url);
                if (url.hostname === 'github.com') {
                    const pathParts = url.pathname
                        .split('/')
                        .filter((part) => part.length > 0);
                    if (pathParts.length >= 2) {
                        const owner = pathParts[0];
                        const repo = pathParts[1];
                        repoNameEl.textContent = `${owner}/${repo}`;
                        fetchReadme(owner, repo);
                    } else {
                        repoNameEl.textContent = 'N/A';
                        setStatus(
                            'Not a repository page. Navigate to a GitHub repo.',
                            true
                        );
                        showReadmeArea(false);
                    }
                } else {
                    repoNameEl.textContent = 'N/A';
                    setStatus(
                        'This extension only works on GitHub.com repos.',
                        true
                    );
                    showReadmeArea(false);
                }
            } catch (e) {
                console.error('Invalid URL:', currentTab.url, e);
                repoNameEl.textContent = 'N/A';
                setStatus('Could not process the current page URL.', true);
                showReadmeArea(false);
            }
        } else {
            repoNameEl.textContent = 'N/A';
            setStatus('Error accessing tab information.', true);
            showReadmeArea(false);
        }
    });

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

    copyFileBtn.addEventListener('click', async () => {
        if (!readmeData || !decodedContent) {
            setStatus('No file data to copy.', true);
            return;
        }
        try {
            let mimeType = 'text/plain';
            if (
                readmeData.name &&
                readmeData.name.toLowerCase().endsWith('.md')
            ) {
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
                setStatus(
                    'File content copied as text (advanced copy failed).',
                    false
                );
            } catch (fallbackErr) {
                console.error('Fallback text copy failed: ', fallbackErr);
                setStatus('Failed to copy file content.', true);
            }
        }
    });

    downloadBtn.addEventListener('click', () => {
        if (!readmeData || !decodedContent) {
            setStatus('No file to download.', true);
            return;
        }
        try {
            const blob = new Blob([decodedContent], {
                type: 'text/plain;charset=utf-8',
            });
            const objectUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = readmeData.name || 'README.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(objectUrl);
            setStatus(`${readmeData.name} downloaded!`, false);
        } catch (err) {
            console.error('Failed to download file: ', err);
            setStatus('Failed to download file.', true);
        }
    });
});
