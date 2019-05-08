setTimeout(function(){
    let cacheDeleteAndRefresh = document.getElementById('delete-cache');

    cacheDeleteAndRefresh.onclick = function(element) {
        chrome.storage.local.set({"imageCache":null}, function(result) {
        });
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
        });
    };
}, 100);
