export class NodeJSCache {
    constructor(nodeCache) {
        this.nodeCache = nodeCache;
    }
    async get(key) {
        return this.nodeCache.get(key);
    }
    async batchGet(keys) {
        const keysArr = Array.from(keys);
        const values = await Promise.all(keysArr.map((key) => this.get(key)));
        const result = {};
        keysArr.forEach((key, index) => {
            result[key] = values[index];
        });
        return result;
    }
    async set(key, value, ttl) {
        if (ttl) {
            return this.nodeCache.set(key, value, ttl);
        }
        else {
            return this.nodeCache.set(key, value);
        }
    }
    async has(key) {
        return this.nodeCache.has(key);
    }
}
