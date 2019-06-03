
var imageCache = [];

var head = document.querySelector("head");

window.setTimeout(() => {
    refreshList();
    var moreButton = document.querySelector(".more-button") || document.querySelector(".latest-more-button");
    bindReadMore(moreButton);
}, 1000);

var getSourceAsDOM = function (element){
    return new Promise((resolve, reject) => {
            xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = () => {
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

var injectScripts = (head) => {
    var script = document.createElement("script");
    script.setAttribute("src", "scripts/loading-bar.js");
    script.setAttribute("type", "text/javascript");
    head.appendChild(script);
}

var injectStyles = (head) => {
    var style = document.createElement("link");
    style.setAttribute("href", "styles/loading-bar.css");
    style.setAttribute("type", "text/css");
    style.setAttribute("rel", "stylesheet");
    head.appendChild(style);
}

var mouseOver = (e) => {
    var hoverPreview = e.srcElement.querySelector(".hover-preview");
    hoverPreview.style.display = "block";
}

var mouseLeave = (e) => {
    e.srcElement.querySelectorAll(".hover-preview").forEach((element) => {
            element.style.display = "none";
        }
    );
    document.querySelectorAll(".hover-preview").forEach((element) => {
            element.style.display = "none";
        }
    );
}

var bindReadMore = (readMoreElement) => {
    if (readMoreElement){
        readMoreElement.addEventListener('mousedown', () => {
            window.setTimeout(() => {
                var readMoreElement = document.querySelector(".more-button") || document.querySelector(".latest-more-button");
                bindReadMore(readMoreElement);
                refreshList();
            }, 1000);
        });
    }
}

var addMouseEvents = (items) => {
    items.forEach(function(element){
        element.addEventListener('mouseenter', (e) => {
            mouseOver(e);
        }, false);
        element.addEventListener('mouseleave', (e) => {
            mouseLeave(e);
        }, false);
    });
}

var refreshList = () => {

    getCache('imageCache').then((results) => {
        var listItems = document.querySelectorAll("div.latest-releases li");
        imageCache = results.imageCache ? results.imageCache.json : [];
        imageKeyCache = imageCache.map((item) => item.key);
        var unCachedItems = Array.from(listItems).filter((e) => {
            return imageKeyCache.indexOf(getKeyFromElement(e)) == -1;
        });
        var cachedElements = Array.from(listItems).filter((element) => {
            return imageKeyCache.indexOf(getKeyFromElement(element)) != -1;
        });
        var index = 0;
        var percent = 0;
        var perItemPercent = 1 / unCachedItems.length;
        var failedImages = [];
        if(unCachedItems.length != 0){
            var loadBar = new LoadBar();
        }
        var DOMGrabInterval = setInterval(() => {
            var element = unCachedItems[index];
            if(element){
                getSourceAsDOM(element).then((targetDom) => {
                        // Successful dom retrieval with series image
                        targetImageURL = targetDom.querySelector("div.series-image img").src;
                        if (element.querySelectorAll(".hover-preview").length == 0){
                            element.appendChild(imgCreate(targetImageURL));
                            addMouseEvents([element]);
                            imageCache = imageCache.concat([{"key": getKeyFromElement(element), "url": targetImageURL}]);
                            percent = percent += perItemPercent;
                            loadBar.setText(getKeyFromElement(element) + " DONE!");
                            loadBar.animate(percent);
                            if (index === unCachedItems.length){
                                setCache(imageCache);
                                setTimeout(() => {
                                    loadBar.destroy();
                                }, 3000);
                            }
                        }
                    }, 
                    (url) => {
                        // Successful dom retrieval with series image
                        console.log("Failed to retrieve", url);
                        failedImages.concat([url]);
                    }, element, index, unCachedItems, DOMGrabInterval, loadBar);
            }
            if (++index === unCachedItems.length){
                clearInterval(DOMGrabInterval);
            }
        }, 1000);

        cachedElements.forEach((element) => {
            var imageCacheObject = imageCache.filter((item) => item.key == getKeyFromElement(element))[0];
            if (element.querySelectorAll(".hover-preview").length == 0){
                element.appendChild(imgCreate(imageCacheObject.url));
            }
        });
        
        addMouseEvents(cachedElements);
        if(failedImages.length != 0){
            // If failed to create hover preview for all images, try again with the failed images
            refreshList();
        }
    });
}

var imgCreate = (src, alt, title) => {
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

var getKeyFromElement = (element) => {
    var link = element.querySelector("a").href;
    return link.split("#")[0];
}

var setCache = (json) => {
    return new Promise(
        (resolve, reject) => {
            chrome.storage.local.set({"imageCache":{json}}, function(result) {
                resolve(result)
            });
        }
    );
}

var getCache = (key) => {
    return new Promise(
        (resolve, reject) => {
            chrome.storage.local.get([key], function(result) {
                resolve(result)
            });
        }
    );
}