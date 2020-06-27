interface WatchingCacheItem {
    key: string; // Typically showname
    title: string;
}

class WatchList {
    private currentlyWatchingItemsArray: WatchingCacheItem[];
    listBox: HTMLDivElement;

    constructor(){
    }

    public intialize() {
        return new Promise(async (resolve, reject) => {
            const watchlistData = await ChromeStorage.getCache('watchListCache')
            const watchlist = watchlistData.watchListCache ? watchlistData.watchListCache.json : [];
            this.currentlyWatchingItemsArray = watchlist;
            this.createListElement();
            this.populateAddToListButtons();
            this.currentlyWatchingItemsArray.forEach(item => {
                this.addShow(item.title, item.key);
            });
            resolve();
        });
    }

    private reorderElements(parentElement: HTMLLIElement) {
        // For some reason, the date is first then floated right? This reorders them correctly
        var ordering = [1, 2, 3, 0];
        var wrapper = parentElement.children[0];
        var items = wrapper.childNodes;
        var elements = document.createDocumentFragment();

        ordering.forEach(function(idx) {
            elements.append(items[idx].cloneNode(true));
        });

        wrapper.innerHTML = null;
        wrapper.appendChild(elements);
        return parentElement;
    }

    createListElement = () => {
        // Creates the watching list in the top right of the page
        const listContainer = document.createElement('div');
        const listTitle = document.createElement("h2");
        listTitle.textContent = "Currently Watching";
        listContainer.appendChild(listTitle);

        this.listBox = document.createElement("div");
        this.listBox.id = "watchListBox";
        listContainer.appendChild(this.listBox);

        listContainer.classList.add("watchListContainer", "well", "homepage-well");
        const rightColumn = document.querySelector("#secondary");
        rightColumn.insertBefore(listContainer, rightColumn.children[0]);
    }

    addShowFromSourceList = async (event: Event) => {
        // Add from source list + button
        event.preventDefault();
        const sourceAnchorElement = <HTMLAnchorElement>(<HTMLAnchorElement>event.target).parentElement;
        const sourceLink = this.getShowKeyFromURL(sourceAnchorElement.href);
        var sourceTitle = sourceAnchorElement.childNodes[1].textContent.slice(0, sourceAnchorElement.childNodes[1].textContent.length - 3);

        this.addShow(sourceTitle, sourceLink, sourceAnchorElement)

        // Store in cache here
        this.currentlyWatchingItemsArray = this.currentlyWatchingItemsArray.concat([{"key": sourceLink, "title": sourceTitle}]);
        await ChromeStorage.setCache("watchListCache", this.currentlyWatchingItemsArray);
        console.log("Updated watching list cache with item:", {"key": sourceLink, "title": sourceTitle})
    }

    private addShow(showName: string, href: string, sourceAnchorElement?: HTMLAnchorElement) {
        var itemCountInList = [...this.listBox.children].filter(item => {
            return item.querySelector('a.show-label').innerHTML == showName;
        }).length;

        if (itemCountInList === 0){
            // Dont show duplicate entries in the watching list (caused by readmore rePaint)
            var listItem = document.createElement('div');
            listItem.classList.add("list-item")
            listItem.style.display = "flex";

            var removeButton = document.createElement('a');
            removeButton.href = "#";
            removeButton.classList.add("close-button");
            removeButton.onclick = this.removeShow;

            var showLabel = document.createElement('a');
            showLabel.classList.add("show-label");
            showLabel.href = href;
            showLabel.textContent = showName;

            listItem.appendChild(removeButton);
            listItem.appendChild(showLabel);

            this.listBox.appendChild(listItem);
        }
        
        if(this.getSourceListItemsFromKey(this.getShowKeyFromURL(href))[0]){
            sourceAnchorElement = sourceAnchorElement ? sourceAnchorElement : this.getSourceListItemsFromKey(this.getShowKeyFromURL(href))[0].querySelector('.source-show-anchor');
            sourceAnchorElement.parentElement.classList.add("watching");
            sourceAnchorElement.classList.add("watching-anchor");
            sourceAnchorElement.querySelector('a').classList.add("watching-add-button");
            sourceAnchorElement.querySelector('a').onclick = this.removeShowFromSourceList;
        }
    }

    removeShow (event: Event) {
        // Pressing the x button on the currently watching list
        var listItem = (<HTMLAnchorElement>event.target).parentElement;
        var showLink = listItem.querySelector<HTMLAnchorElement>(".show-label").href;
        var sourceListAnchorItems = document.querySelectorAll<HTMLAnchorElement>("div.latest-releases li .source-show-anchor");
        var removedShows = [...sourceListAnchorItems].filter((sourceListItem) => {
            return this.getShowKeyFromURL(sourceListItem.href) === this.getShowKeyFromURL(showLink);
        });

        removedShows.forEach((show) => {
            var listItem = show.parentElement;
            this.removeStylingFromListItem(listItem);
        })

        //Remove from cache         
        this.currentlyWatchingItemsArray = this.currentlyWatchingItemsArray.filter(item => {
            return item.key != this.getShowKeyFromURL(showLink);
        });

        ChromeStorage.setCache("watchListCache", this.currentlyWatchingItemsArray).then(()=>{
            console.log("Removed item from cache:", {"key": this.getShowKeyFromURL(showLink)})
        });

        listItem.remove();
    }

    removeShowFromSourceList = (event) => {

        var sourceAnchorElement = event.srcElement.parentElement;
        var showLink = sourceAnchorElement.href;

        var removedShows = this.getSourceListItemsFromKey(showLink);

        removedShows.forEach((show) => {
            this.removeStylingFromListItem(show);
        })

        var currentlyWatchingRemovedItems = [...document.querySelector("#watchListBox").children].filter((listItem) => {
            return this.getShowKeyFromURL(listItem.querySelector<HTMLAnchorElement>('.show-label').href) === this.getShowKeyFromURL(showLink);
        })
        currentlyWatchingRemovedItems.forEach(x=> {x.remove()});
        
        //Remove from cache 
        this.currentlyWatchingItemsArray = this.currentlyWatchingItemsArray.filter(item => {
            return item.key != this.getShowKeyFromURL(showLink);
        });
        ChromeStorage.setCache("watchListCache", this.currentlyWatchingItemsArray).then(()=>{
            console.log("Removed item from cache:", {"key": this.getShowKeyFromURL(showLink)})
        });
        event.preventDefault();

    }

    public rePaint = () => {
        this.populateAddToListButtons();
        this.currentlyWatchingItemsArray.forEach(item => {
            this.addShow(item.title, item.key);
        });
    }

    private populateAddToListButtons() {
        const listItems = document.querySelectorAll<HTMLLIElement>("div.latest-releases li:not(.watch-list-item)");
        listItems.forEach((element) => {
            element = this.reorderElements(element);
            element.classList.add('watch-list-item');
    
            const addButton = <HTMLAnchorElement>document.createElement('a');
            addButton.href = "#";
            addButton.classList.add("add-button");
            addButton.onclick = this.addShowFromSourceList;
    
            element.children[0].classList.add("source-show-anchor");
            element.children[0].insertBefore(addButton, element.children[0].childNodes[0]);
        });
    }

    removeStylingFromListItem = (listItem) => {
        listItem.classList.remove('watching');
        listItem.querySelector('.source-show-anchor').classList.remove('watching-anchor');
        var listItemAddButton = listItem.querySelector('.add-button');
        listItemAddButton.classList.remove('watching-add-button');
        listItemAddButton.onclick = this.addShowFromSourceList;
    }

    addStylingToListItem = (listItem) => {
        listItem.classList.remove('watching');
        listItem.querySelector('source-show-anchor').classList.remove('watching-anchor');
        var listItemAddButton = listItem.querySelector('.watching-add-button');
        listItemAddButton.classList.remove('watching-add-button');
        listItemAddButton.onclick = this.addShowFromSourceList;
    }

    private getShowKeyFromURL(url: string) {
        if (url.indexOf('.info/') != -1){
            return url.split(".info")[1].split('#')[0];
        }
        else{
            return url.split('#')[0];
        }
    }

    getSourceListItemsFromKey = (key) => {
        var sourceListAnchorItems = document.querySelectorAll<HTMLLIElement>("div.latest-releases li");
        return [...sourceListAnchorItems].filter((sourceListItem) => {
            return this.getShowKeyFromURL(sourceListItem.querySelector<HTMLAnchorElement>('.source-show-anchor').href) === this.getShowKeyFromURL(key);
        });
    }
}