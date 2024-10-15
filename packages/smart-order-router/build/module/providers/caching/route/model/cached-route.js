import { Protocol } from '@uniswap/router-sdk';
import { Pool } from '@uniswap/v3-sdk';
/**
 * Class defining the route to cache
 *
 * @export
 * @class CachedRoute
 */
export class CachedRoute {
    /**
     * @param route
     * @param percent
     */
    constructor({ route, percent }) {
        // Hashing function copying the same implementation as Java's `hashCode`
        // Sourced from: https://gist.github.com/hyamamoto/fd435505d29ebfa3d9716fd2be8d42f0?permalink_comment_id=4613539#gistcomment-4613539
        this.hashCode = (str) => [...str].reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0);
        this.route = route;
        this.percent = percent;
    }
    get protocol() {
        return this.route.protocol;
    }
    get tokenIn() {
        return this.route.input;
    }
    get tokenOut() {
        return this.route.output;
    }
    get routePath() {
        if (this.protocol == Protocol.V3) {
            const route = this.route;
            return route.pools.map(pool => `[V3]${pool.token0.address}/${pool.token1.address}/${pool.fee}`).join('->');
        }
        else if (this.protocol == Protocol.V2) {
            const route = this.route;
            return route.pairs.map(pair => `[V2]${pair.token0.address}/${pair.token1.address}`).join('->');
        }
        else {
            const route = this.route;
            return route.pools.map(pool => {
                if (pool instanceof Pool) {
                    return `[V3]${pool.token0.address}/${pool.token1.address}/${pool.fee}`;
                }
                else {
                    return `[V2]${pool.token0.address}/${pool.token1.address}`;
                }
            }).join('->');
        }
    }
    get routeId() {
        return this.hashCode(this.routePath);
    }
}
