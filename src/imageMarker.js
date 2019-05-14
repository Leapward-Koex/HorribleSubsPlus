
var imageCache = [];

var bar1 = null;

var head = document.querySelector("head")
// injectScripts(head)
// injectStyles(head)

var makeLoadBar

window.setTimeout(function() {
    //createLoadBar();
    
    refreshList();
    var moreButton = document.querySelector(".more-button") || document.querySelector(".latest-more-button");
    bindReadMore(moreButton);
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

function injectScripts(head){
    var script = document.createElement("script");
    script.setAttribute("src", "scripts/loading-bar.js");
    script.setAttribute("type", "text/javascript");
    head.appendChild(script);
}

function injectStyles(head){
    var style = document.createElement("link");
    style.setAttribute("href", "styles/loading-bar.css");
    style.setAttribute("type", "text/css");
    style.setAttribute("rel", "stylesheet");
    head.appendChild(style);
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

function bindReadMore(readMoreElement){
    if (readMoreElement){
        readMoreElement.addEventListener('mousedown', function(){
            window.setTimeout(function() {
                var readMoreElement = document.querySelector(".more-button") || document.querySelector(".latest-more-button");
                bindReadMore(readMoreElement);
                refreshList();
            }, 1000);
        });
    }
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

    getCache('imageCache').then(function(results){
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
        var percent = 0;
        var perItemPercent = 1 / unCachedItems.length;
        var failedImages = [];
        if(unCachedItems.length != 0){
            createLoadBar();
        }
        var DOMGrabInterval = setInterval(function(){
            var element = unCachedItems[index];
            if(element){
                getSourceAsDOM(element).then(
                    function (targetDom) {
                        // Successful dom retrieval with series image
                        targetImageURL = targetDom.querySelector("div.series-image img").src;
                        if (element.querySelectorAll(".hover-preview").length == 0){
                            element.appendChild(img_create(targetImageURL));
                            addMouseEvents([element]);
                            imageCache = imageCache.concat([{"key": getKeyFromElement(element), "url": targetImageURL}]);
                            percent = percent += perItemPercent;
                            bar1.setText(getKeyFromElement(element) + " DONE!");
                            bar1.animate(percent);
                            if (index === unCachedItems.length){
                                setCache(imageCache);
                                setTimeout(() => {
                                    //move this
                                    removeLoadBar()
                                }, 3000);
                            }
                        }
                    }, 
                    function(url){
                        console.log("Failed to retrieve", url);
                        failedImages.append(url);
                    }, element, index, unCachedItems, DOMGrabInterval, bar1);
            }
            if (++index === unCachedItems.length){
                clearInterval(DOMGrabInterval);
            }
        }, 1000);

        cachedElements.forEach(function(element){
            var imageCacheObject = imageCache.filter(function(item){return item.key == getKeyFromElement(element)})[0];
            if (element.querySelectorAll(".hover-preview").length == 0){
                element.appendChild(img_create(imageCacheObject.url));
            }
        });
        
        addMouseEvents(cachedElements);
        if(failedImages.length != 0){
            refreshList();
        }
    });
}

function createLoadBar(){
    var loadBarContainer  = document.createElement('div');
    var loadBar = document.createElement('div');
    loadBarContainer.classList= ['loadBarContainer'];
    loadBar.id = "ldbarid"
    loadBarContainer.appendChild(loadBar);
    document.querySelector("body").appendChild(loadBarContainer);
    bar1 = new ProgressBar.Line('#ldbarid', {
        strokeWidth: 2,
        easing: 'easeInOut',
        duration: 1400,
        color: '#FFEA82',
        trailColor: '#636467',
        trailWidth: 0.1,
        svgStyle: {width: '100%', height: '100%'},
        from: {color: '#FFEA82'},
        to: {color: '#ED6A5A'},
        step: (state, bar) => {
          bar.path.setAttribute('stroke', state.color);
        },
        text: {
            value: 'Starting cache fill',
            style: {
                // Text color.
                // Default: same as stroke color (options.color)
                color: '#636467',
                position: 'absolute',
                left: '50%',
                top: '-110%',
                padding: 0,
                margin: 0,
                // You can specify styles which will be browser prefixed
                transform: {
                    prefix: true,
                    value: 'translate(-50%, -50%)'
                }
            },
            autoStyleContainer: true,
        },
        warnings: true
    });
}

function removeLoadBar(){
    bar1.destroy();
    querySelector(".loadBarContainer").destroy();
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

var getCache = function (key) {
    return new Promise(
        (resolve, reject) => {
            chrome.storage.local.get([key], function(result) {
                resolve(result)
            });
        }
    );
}