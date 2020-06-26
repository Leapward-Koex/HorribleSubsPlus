class ChromeStorage {
    static setCache = (cacheName, cacheData) => {
        return new Promise(
            (resolve, reject) => {
                chrome.storage.local.set({[cacheName]:{cacheData}}, () => {
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