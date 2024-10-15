"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeJSCache = void 0;
class NodeJSCache {
    constructor(nodeCache) {
        this.nodeCache = nodeCache;
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.nodeCache.get(key);
        });
    }
    batchGet(keys) {
        return __awaiter(this, void 0, void 0, function* () {
            const keysArr = Array.from(keys);
            const values = yield Promise.all(keysArr.map((key) => this.get(key)));
            const result = {};
            keysArr.forEach((key, index) => {
                result[key] = values[index];
            });
            return result;
        });
    }
    set(key, value, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            if (ttl) {
                return this.nodeCache.set(key, value, ttl);
            }
            else {
                return this.nodeCache.set(key, value);
            }
        });
    }
    has(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.nodeCache.has(key);
        });
    }
}
exports.NodeJSCache = NodeJSCache;
