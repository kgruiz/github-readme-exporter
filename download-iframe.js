// download-iframe.js

function downloadFile(filename, uri) {
    try {
        const element = document.createElement('a');
        element.setAttribute('href', uri);
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        // The object URL will be revoked by the parent (popup.js)
    } catch (e) {
        console.error('iframe download error:', e);
        // Optionally, post a message back to the parent if it failed
        // window.parent.postMessage({ type: 'download_error', error: e.message }, '*');
    }
}

window.addEventListener(
    'message',
    (event) => {
        // IMPORTANT: Add origin check for security if the iframe could be embedded elsewhere,
        // but for an extension's internal iframe, '*' might be acceptable if the source is trusted.
        // For a Safari Web Extension, the origin will be something like 'safari-web-extension://<extension-id>'
        // A more specific check would be:
        // if (event.origin !== window.location.origin) { // Or a hardcoded extension origin
        //     console.warn('Message from untrusted origin:', event.origin);
        //     return;
        // }

        const data = event.data;
        if (
            data &&
            data.type === 'initiateDownload' &&
            data.filename &&
            data.uri
        ) {
            downloadFile(data.filename, data.uri);
        }
    },
    false
);
