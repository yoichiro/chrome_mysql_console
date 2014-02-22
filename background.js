function createWindow() {
    chrome.app.window.create("console.html", {
        bounds: {
            width: 800,
            height: 600
        },
        minWidth: 640,
        minHeight: 480,
        resizable: true
    });
}

chrome.app.runtime.onLaunched.addListener(function() {
    createWindow();
});
