function downloadFile(filename, uri) {
    try {
        const element = document.createElement('a');
        element.setAttribute('href', uri);
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    } catch (e) {
        console.error('iframe download error:', e);
    }
}

window.addEventListener(
    'message',
    (event) => {
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
