setTimeout(function(){
    var cacheDeleteAndRefresh = document.getElementById('delete-cache');

    var WatchListcacheDeleteAndRefresh = document.getElementById('delete-watch-cache');

    cacheDeleteAndRefresh.onclick = function(element) {
        // Remove image cache
        chrome.storage.local.set({"imageCache":null}, function(result) {
        });
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            // Refresh page
            chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
        });
    };
    WatchListcacheDeleteAndRefresh.onclick = function(element) {
        // Remove image cache
        chrome.storage.local.set({"watchListCache":null}, function(result) {
        });
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            // Refresh page
            chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
        });
    }
}, 100);
