
function onBeforeRequest(details){
    const tabId = details.tabId;
    var ret = {};
    const url = new URL(details.url);
    if(url.hash.slice(0, 11) != "#ffcookies#") return ret;
    browser.tabs.create({
        url: browser.runtime.getURL("import.html" + url.hash),
    });
    if(tabId >= 0){
        browser.tabs.remove(tabId);
    }
    return { "cancel": true };
}

browser.webRequest.onBeforeRequest.addListener(
    onBeforeRequest,
    {
        urls: ["*://example.com/*"],
        types: ["main_frame"],
    },
    ["blocking"]
);

console.log("ffcookies background...");
