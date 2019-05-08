
var imageCache = [];

window.setTimeout(function() {
    refreshList();
    var moreButton = document.querySelector(".more-button") || document.querySelector(".latest-more-button");
    console.log(moreButton);
    if (moreButton){
        moreButton.addEventListener('mousedown', function(){
            window.setTimeout(function() {
                refreshList();
            }, 1000);
        });
    }
}, 1000);

var getSourceAsDOM = function (element){
    return new Promise(
        function (resolve, reject) {
            xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    parser = new DOMParser();
                    if(parser.parseFromString(xmlhttp.responseText,"text/html").querySelector("div.series-image img")){
                        resolve(parser.parseFromString(xmlhttp.responseText,"text/html"))
                    }
                    else{
                        reject(lastURL);
                    }
                }
            }
            var lastURL = element.firstChild.href;
            xmlhttp.open("GET", element.firstChild.href, true);
            xmlhttp.send();    
        }
    );
}

function mouseOver(e) {
    var hoverPreview = e.srcElement.querySelector(".hover-preview");
    hoverPreview.style.display = "block";
}

function mouseLeave(e) {
    e.srcElement.querySelectorAll(".hover-preview").forEach(
        function(element){
            element.style.display = "none";
        }
    );
    document.querySelectorAll(".hover-preview").forEach(
        function(element){
            element.style.display = "none";
        }
    );
}

function addMouseEvents(items){
    items.forEach(function(element){
        element.addEventListener('mouseenter', function (e) {
            mouseOver(e);
        }, false);
        element.addEventListener('mouseleave', function (e) {
            mouseLeave(e);
        }, false);
    });
}

function refreshList() {
    

    chrome.storage.local.get(['imageCache'], function(results) {
        var listItems = document.querySelectorAll("div.latest-releases li");
        imageCache = results.imageCache ? results.imageCache.json : [];
        imageKeyCache = imageCache.map(function(item){return item.key});
        var unCachedItems = Array.from(listItems).filter(function(e){
            return imageKeyCache.indexOf(getKeyFromElement(e)) == -1;
        });
        var cachedElements = Array.from(listItems).filter(function(element){
            return imageKeyCache.indexOf(getKeyFromElement(element)) != -1;
        });
        var index = 0;
        var failedImages = [];
        var DOMGrabInterval = setInterval(function(){
            var element = unCachedItems[index];
            if(element){
                getSourceAsDOM(element).then(
                    function (targetDom) {
                        targetImageURL = targetDom.querySelector("div.series-image img").src;
                        console.log(element, targetDom, targetImageURL);
                        if (element.querySelectorAll(".hover-preview").length == 0){
                            element.appendChild(img_create(targetImageURL));
                            addMouseEvents([element]);
                            imageCache = imageCache.concat([{"key": getKeyFromElement(element), "url": targetImageURL}]);
                        }
                    }, function(url){
                        console.log("Failed to retrieve", url);
                        failedImages.append(url);

                    }, element, index, unCachedItems, DOMGrabInterval);
            }
            if (++index === unCachedItems.length){
                setCache(imageCache).then(function(){
                    clearInterval(DOMGrabInterval);
                });
            }
        }, 1000);
        cachedElements.forEach(function(element){
            var imageCacheObject = imageCache.filter(function(item){return item.key == getKeyFromElement(element)})[0];
            if (element.querySelectorAll(".hover-preview").length == 0){
                element.appendChild(img_create(imageCacheObject.url));
            }
        })
        
        addMouseEvents(cachedElements);
        if(failedImages.length != 0){
            refreshList();
        }
    });

}

function img_create(src, alt, title) {
    var containerDiv = document.createElement('div');
    var img = document.createElement('img');
    img.src = src;
    img.style.display = "none";
    img.classList.add(["hover-preview"]);
    if ( alt != null ) img.alt = alt;
    if ( title != null ) img.title = title;
    containerDiv.appendChild(img)
    containerDiv.classList.add(["hover-preview-div"]);
    return containerDiv;
}

function getKeyFromElement(element){
    var link = element.querySelector("a").href;
    return link.split("#")[0];
}

var setCache = function (json) {
    return new Promise(
        (resolve, reject) => {
            chrome.storage.local.set({"imageCache":{json}}, function(result) {
                resolve(result)
            });
        }
    );
}

var getCache = function () {
    return new Promise(
        (resolve, reject) => {
            chrome.storage.local.get(['key'], function(result) {
                resolve(result)
            });
        }
    );
}