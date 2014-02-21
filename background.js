chrome.app.runtime.onLaunched.addListener(function() {
    chrome.app.window.create("console.html", {
        bounds: {
            width: 800,
            height: 600
        },
        resizable: true
    });
});
