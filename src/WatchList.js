class WatchList{
    constructor(list){
        this.currentlyWatchingItemsArray = list;
        this.createListElement();
        this.populateAddToListButtons(this.currentlyWatchingItemsArray);
        this.currentlyWatchingItemsArray.forEach(item => {
            this.addShow(item.title, item.key);
        });
    }

    static populateList = () => {
        return new Promise((resolve, reject) => {
                ChromeStorage.getCache('watchListCache').then((results) => {
                    var watchingList = results.watchListCache ? results.watchListCache.json : [];
                    resolve(watchingList);
                });
            }
        );
    }

    static reorderElements = (parentElement) => {
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
        var listContainer = document.createElement('div');

        var listTitle = document.createElement("h2");
        listTitle.textContent = "Currently Watching";
        listContainer.appendChild(listTitle);

        this.listBox = document.createElement("div");
        this.listBox.id = "watchListBox";
        listContainer.appendChild(this.listBox);

        listContainer.classList.add("watchListContainer", "well", "homepage-well");
        var rightColumn = document.querySelector("#secondary");
        rightColumn.insertBefore(listContainer, rightColumn.children[0]);
    }

    addShowFromSourceList = (event) => {
        // Add from source list + button

        var sourceAnchorElement = event.srcElement.parentElement;
        var sourceLink = this.getShowKeyFromURL(sourceAnchorElement.href);
        var sourceTitle = sourceAnchorElement.childNodes[1].textContent.slice(0, sourceAnchorElement.childNodes[1].textContent.length - 3);
        event.srcElement.onclick = this.removeShowFromSourceList; 

        this.addShow(sourceTitle, sourceLink, sourceAnchorElement)

        // Store in cache here
        this.currentlyWatchingItemsArray = this.currentlyWatchingItemsArray.concat([{"key": sourceLink, "title": sourceTitle}]);
        ChromeStorage.setCache("watchListCache", this.currentlyWatchingItemsArray).then(()=>{
            console.log("Updated watching list cache with item:", {"key": sourceLink, "title": sourceTitle})
        });

    }

    addShow = (showName, href, sourceAnchorElement) => {
        // When you add from cache?
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

        //colour element here

        sourceAnchorElement = sourceAnchorElement ? sourceAnchorElement : this.getSourceListItemsFromKey(this.getShowKeyFromURL(href))[0].querySelector('.source-show-anchor');
        sourceAnchorElement.parentElement.classList.add("watching");
        sourceAnchorElement.classList.add("watching-anchor");
        sourceAnchorElement.querySelector('a').classList.add("watching-add-button");

    }

    removeShow = (event) => {
        // Pressing the x button on the currently watching list
        var listItem = event.srcElement.parentElement;
        var showLink = listItem.querySelector(".show-label").href;
        var sourceListAnchorItems = document.querySelectorAll("div.latest-releases li .source-show-anchor");
        var removedShows = [...sourceListAnchorItems].filter((sourceListItem) => {
            return this.getShowKeyFromURL(sourceListItem.href) == this.getShowKeyFromURL(showLink);
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
            return this.getShowKeyFromURL(listItem.querySelector('.show-label').href) == this.getShowKeyFromURL(showLink);
        })
        currentlyWatchingRemovedItems.forEach(x=> {x.remove()});
        
        //Remove from cache 
        this.currentlyWatchingItemsArray = this.currentlyWatchingItemsArray.filter(item => {
            return item.key != this.getShowKeyFromURL(showLink);
        });
        ChromeStorage.setCache("watchListCache", this.currentlyWatchingItemsArray).then(()=>{
            console.log("Removed item from cache:", {"key": this.getShowKeyFromURL(showLink)})
        });


    }

    rePaint = () => {

    }

    populateAddToListButtons = (watchList) => {
        var listItems = document.querySelectorAll("div.latest-releases li:not(.watch-list-item)");
        listItems.forEach((element) => {
            element = WatchList.reorderElements(element);
            element.classList.add('watch-list-item');
    
            var addButton = document.createElement('a');
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

    getShowKeyFromURL = (url) => {
        if (url.indexOf('.info/') != -1){
            return url.split(".info")[1].split('#')[0];
        }
        else{
            return url.split('#')[0];
        }
    }

    getSourceListItemsFromKey = (key) => {
        var sourceListAnchorItems = document.querySelectorAll("div.latest-releases li");
        return [...sourceListAnchorItems].filter((sourceListItem) => {
            return this.getShowKeyFromURL(sourceListItem.querySelector('.source-show-anchor').href) == this.getShowKeyFromURL(key);
        });
    }
}