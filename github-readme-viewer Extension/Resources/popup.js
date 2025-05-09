document.addEventListener('DOMContentLoaded', () => {
    const repoNameEl = document.getElementById('repo-name');
    const readmeContentEl = document.getElementById('readme-content');
    const copyContentBtn = document.getElementById('copyContentBtn');
    const copyFileBtn = document.getElementById('copyFileBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const statusEl = document.getElementById('status');

    let readmeData = null; // To store fetched README data (name, content, etc.)
    let decodedContent = ''; // To store decoded README text content

    function setStatus(message, isError = false) {
        statusEl.textContent = message;
        statusEl.style.color = isError ? '#cb2431' : '#28a745'; // Red for error, green for success
    }

    function enableButtons() {
        copyContentBtn.disabled = false;
        copyFileBtn.disabled = false;
        downloadBtn.disabled = false;
    }

    async function fetchReadme(owner, repo) {
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`README not found for ${owner}/${repo}. Status: ${response.status}`);
                }
                throw new Error(`Failed to fetch README. Status: ${response.status}`);
            }
            readmeData = await response.json();
            decodedContent = atob(readmeData.content); // Decode base64 content
            
            readmeContentEl.textContent = decodedContent;
            repoNameEl.textContent = `${owner}/${repo} (${readmeData.name})`;
            setStatus('');
            enableButtons();
        } catch (error) {
            console.error('Error fetching README:', error);
            readmeContentEl.textContent = 'Could not load README.';
            repoNameEl.textContent = 'Error';
            setStatus(error.message, true);
        }
    }

    // Get current tab URL and parse repo info
    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        if (currentTab && currentTab.url) {
            const url = new URL(currentTab.url);
            if (url.hostname === 'github.com') {
                const pathParts = url.pathname.split('/').filter(part => part.length > 0);
                if (pathParts.length >= 2) {
                    const owner = pathParts[0];
                    const repo = pathParts[1];
                    repoNameEl.textContent = `${owner}/${repo}`;
                    fetchReadme(owner, repo);
                } else {
                    readmeContentEl.textContent = 'Not a repository page.';
                    setStatus('Please navigate to a GitHub repository page.', true);
                }
            } else {
                readmeContentEl.textContent = 'Not a GitHub page.';
                setStatus('This extension works on GitHub pages.', true);
            }
        } else {
            readmeContentEl.textContent = 'Could not identify current tab.';
            setStatus('Error accessing tab information.', true);
        }
    });

    copyContentBtn.addEventListener('click', async () => {
        if (!decodedContent) {
            setStatus('No content to copy.', true);
            return;
        }
        try {
            await navigator.clipboard.writeText(decodedContent);
            setStatus('README content copied to clipboard!', false);
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
            // Create a blob with the content
            // GitHub API usually returns READMEs as text/plain or text/markdown
            // We'll assume text/plain or derive from filename if possible.
            // For simplicity, using text/plain. For markdown, 'text/markdown'
            let mimeType = 'text/plain';
            if (readmeData.name && readmeData.name.toLowerCase().endsWith('.md')) {
                mimeType = 'text/markdown';
            }
            
            const blob = new Blob([decodedContent], { type: mimeType });
            
            // The ClipboardItem API is the modern way to copy rich content.
            // It's not guaranteed that pasting this will create a "file" in Finder/Explorer,
            // but it's the closest we can get with web APIs.
            // Some applications might interpret this as pasting file content,
            // others might offer to save it.
            const clipboardItem = new ClipboardItem({ [blob.type]: blob });
            await navigator.clipboard.write([clipboardItem]);
            setStatus(`File content (${readmeData.name}) prepared for clipboard. Behavior depends on where you paste.`, false);
        } catch (err) {
            console.error('Failed to copy file to clipboard: ', err);
            // Fallback for simpler text copy if ClipboardItem fails or is not supported as expected
            try {
                await navigator.clipboard.writeText(decodedContent);
                setStatus('File content copied as text (advanced file copy failed).', false);
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
            const blob = new Blob([decodedContent], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = readmeData.name || 'README.txt'; // Use actual name or fallback
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setStatus(`${readmeData.name} downloaded!`, false);
        } catch (err) {
            console.error('Failed to download file: ', err);
            setStatus('Failed to download file.', true);
        }
    });
});
