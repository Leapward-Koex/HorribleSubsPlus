class ChromeStorage {
    static setCache = (cacheName, json) => {
        return new Promise(
            (resolve, reject) => {
                chrome.storage.local.set({[cacheName]:{json}}, () => {
                    resolve()
                });
            }
        );
    }

    static getCache(key) {
        return new Promise<any>(
            (resolve, reject) => {
                chrome.storage.local.get([key], (result) => {
                    resolve(result)
                });
            }
        );
    }
}