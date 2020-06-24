class ChromeStorage{
    static setCache = (key, json) => {
        return new Promise(
            (resolve, reject) => {
                chrome.storage.local.set({[key]:{json}}, (result) => {
                    resolve(result)
                });
            }
        );
    }

    static getCache = (key) => {
        return new Promise(
            (resolve, reject) => {
                chrome.storage.local.get([key], (result) => {
                    resolve(result)
                });
            }
        );
    }
}