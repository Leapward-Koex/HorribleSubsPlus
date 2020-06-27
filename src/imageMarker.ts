
interface ImageCacheItem {
    key: string; // Typically showname
    url: string;
}

class ImagePreviewService {
    private imageCache: ImageCacheItem[] = []
    constructor() {
    }

    private getUnCachedElements(listItems: HTMLLIElement[], imageKeysCache: string[]) {
        return listItems.filter((e) => {
            return imageKeysCache.indexOf(getKeyFromElement(e)) === -1;
        });
    }

    private getCachedElements(listItems: HTMLLIElement[], imageKeysCache: string[]) {
        return listItems.filter((e) => {
            return imageKeysCache.indexOf(getKeyFromElement(e)) !== -1;
        });
    }

    public async refreshImagePreviews() {
        const imageCache = await ChromeStorage.getCache('imageCache');
        const listItems = await DOMHelper.getShowListItems();
        this.imageCache = imageCache.imageCache ? <ImageCacheItem[]>imageCache.imageCache.json : new Array<ImageCacheItem>();
        const imageKeysCache = this.imageCache.map((item) => item.key); // Array of chached element keys, i.e. the show name

        const unCachedItems = this.getUnCachedElements(listItems, imageKeysCache);
        const cachedElements = this.getCachedElements(listItems, imageKeysCache);

        if (unCachedItems.length !== 0) {
            this.getUncachedItems(unCachedItems);
        }

        this.addImagePreviewToElements(cachedElements);
        this.addMouseEvents(cachedElements);
    }

    getUncachedItems(unCachedItems: HTMLLIElement[]) {
        const loadBar = new LoadBar();
        let index = 0;
        let percent = 0;
        const perItemPercent = 1 / unCachedItems.length;
        const failedImages = [];

        var DOMGrabInterval = setInterval(async () => {
            var element = unCachedItems[index];
            if (element) {
                this.getSourceAsDOM(element).then(async (targetDom) => {
                    // Successful dom retrieval with series image
                    const targetImageURL = (<HTMLImageElement>targetDom.querySelector("div.series-image img")).src;
                    if (element.querySelectorAll(".hover-preview").length === 0) {
                        element.appendChild(this.createHoverPreviewFromSrc(targetImageURL));
                        this.addMouseEvents([element]);
                        this.imageCache = this.imageCache.concat([{ "key": getKeyFromElement(element), "url": targetImageURL }]);
                        percent = percent += perItemPercent;
                        loadBar.setText(getKeyFromElement(element) + " DONE!");
                        loadBar.animate(percent);
                        if (index === unCachedItems.length) {
                            // All items have been attempted, store the results and restart until all items are cached
                            await ChromeStorage.setCache("imageCache", this.imageCache)
                            setTimeout(() => {
                                loadBar.destroy();
                                if (failedImages.length !== 0) {
                                    // If failed to create hover preview for all images, try again with the failed images
                                    this.refreshImagePreviews();
                                }
                            }, 3000);
                        }
                    }
                }, (url) => {
                    // Failed dom retrieval with series image
                    console.log("Failed to retrieve", url);
                    failedImages.concat([url])
                });
            }
            if (++index === unCachedItems.length) {
                clearInterval(DOMGrabInterval);
            }
        }, 1000);
    }

    private addImagePreviewToElements(cachedElements: HTMLLIElement[]) {
        cachedElements.forEach((element) => {
            var imageCacheItem = this.imageCache.filter((item) => item.key === getKeyFromElement(element))[0];
            if (element.querySelectorAll(".hover-preview").length === 0) {
                element.appendChild(this.createHoverPreviewFromSrc(imageCacheItem.url));
            }
        });
    }

    private addMouseEvents(items: HTMLLIElement[]) {
        items.forEach((element) => {
            element.addEventListener('mouseenter', (e) => {
                mouseOver(e);
            }, false);
            element.addEventListener('mouseleave', (e) => {
                mouseLeave(e);
            }, false);
        });
    }

    private getSourceAsDOM(element: HTMLLIElement) {
        return new Promise<Document>((resolve, reject) => {
            const xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = () => {
                if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
                    const parser = new DOMParser();
                    if (parser.parseFromString(xmlhttp.responseText, "text/html").querySelector("div.series-image img")) {
                        resolve(parser.parseFromString(xmlhttp.responseText, "text/html"))
                    }
                    else {
                        reject(lastURL);
                    }
                }
            }
            const lastURL = (<HTMLAnchorElement>element.firstChild).href;
            xmlhttp.open("GET", (<HTMLAnchorElement>element.firstChild).href, true);
            xmlhttp.send();
        });
    }

    private createHoverPreviewFromSrc(src) {
        var containerDiv = document.createElement('div');
        var img = document.createElement('img');
        img.src = src;
        img.classList.add("hover-preview");
        containerDiv.appendChild(img)
        containerDiv.classList.add("hover-preview-div");
        return containerDiv;
    }
}

class DOMHelper {
    static waitForNewListItems(currentlistElementCount: number) {
        return new Promise<HTMLLIElement[]>((resolve, reject) => {
            const interval = setInterval(() => {
                const newListItemsCount = document.querySelectorAll<HTMLLIElement>("div.latest-releases li").length;
                const showMoreText = document.querySelector<HTMLDivElement>(".latest-show-more").innerText;
                if (newListItemsCount > currentlistElementCount || showMoreText === "Please use search instead") {
                    clearInterval(interval)
                    resolve();
                }
            });
        });
    }

    static getWatchListItems() {
        return new Promise<HTMLLIElement[]>((resolve, reject) => {
            const interval = setInterval(() => {
                const unwatchedListItems = document.querySelectorAll<HTMLLIElement>("div.latest-releases li:not(.watch-list-item)");
                const listItems = document.querySelectorAll<HTMLLIElement>("div.latest-releases li");
                if (unwatchedListItems.length > 0 || listItems.length > 0) {
                    clearInterval(interval)
                    resolve(Array.from(unwatchedListItems));
                }
            });
        });
        
    }

    public static getShowMoreButton() {
        return new Promise<HTMLAnchorElement>((resolve, reject) => {
            const interval = setInterval(() => {
                const readMoreElement = document.querySelector<HTMLAnchorElement>(".more-button") || document.querySelector<HTMLAnchorElement>(".latest-more-button");
                if (readMoreElement !== null) {
                    clearInterval(interval)
                    resolve(readMoreElement);
                }
            }, 10)
        })
    }

    public static getShowListItems(previousCount = 0) {
        return new Promise<HTMLLIElement[]>((resolve, reject) => {
            const interval = setInterval(() => {
                const listItems = document.querySelectorAll<HTMLLIElement>("div.latest-releases li")
                if (listItems.length > previousCount) {
                    clearInterval(interval)
                    resolve(Array.from(listItems));
                }
            }, 10)
        });
    }
}

var mouseOver = (e) => {
    var hoverPreview = e.srcElement.querySelector(".hover-preview");
    hoverPreview.classList.add("fade-in");
}

var mouseLeave = (e: MouseEvent) => {
    (<Element>e.target).querySelectorAll<HTMLImageElement>(".hover-preview").forEach((element) => {
        element.classList.remove("fade-in");
    });
    document.querySelectorAll<HTMLImageElement>(".hover-preview").forEach((element) => {
        element.classList.remove("fade-in");
    });
}

const bindReadMore = (readMoreElement: HTMLAnchorElement, imagePreviewService: ImagePreviewService, watchList: WatchList) => {
    if (readMoreElement) {
        let listElementCount = 0;
        readMoreElement.addEventListener('mousedown', async () => {
            listElementCount = (await DOMHelper.getShowListItems()).length;
        });
        readMoreElement.addEventListener('mouseup', async () => {
            await DOMHelper.waitForNewListItems(listElementCount);
            const newReadMoreElement = await DOMHelper.getShowMoreButton();
            bindReadMore(newReadMoreElement, imagePreviewService, watchList);
            imagePreviewService.refreshImagePreviews();
            watchList.rePaint();
        });
    }
}

const createWatchlist = async () => {
    const watchListService = new WatchList();
    await watchListService.intialize();
    return watchListService;
}

var getKeyFromElement = (element) => {
    var link = element.querySelector("a").href;
    return link.split("#")[0];
}

const main = async () => {
    // Main
    const imagePreviewService = new ImagePreviewService();
    imagePreviewService.refreshImagePreviews();  // Bind image hover preview to list elements

    const watchList = await createWatchlist()
    DOMHelper.getShowMoreButton().then(showMoreButton => {
        bindReadMore(showMoreButton, imagePreviewService, watchList);
    })
}

main();