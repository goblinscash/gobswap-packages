import retry from 'async-retry';
import Timeout from 'await-timeout';
import axios from 'axios';
import { log } from '../util/log';
/**
 * Gets subgraph pools from a URI. The URI shoudl contain a JSON
 * stringified array of V2SubgraphPool objects or V3SubgraphPool
 * objects.
 *
 * @export
 * @class URISubgraphProvider
 * @template TSubgraphPool
 */
export class URISubgraphProvider {
    constructor(chainId, uri, timeout = 6000, retries = 2) {
        this.chainId = chainId;
        this.uri = uri;
        this.timeout = timeout;
        this.retries = retries;
    }
    async getPools() {
        log.info({ uri: this.uri }, `About to get subgraph pools from URI ${this.uri}`);
        let allPools = [];
        await retry(async () => {
            const timeout = new Timeout();
            const timerPromise = timeout.set(this.timeout).then(() => {
                throw new Error(`Timed out getting pools from subgraph: ${this.timeout}`);
            });
            let response;
            /* eslint-disable no-useless-catch */
            try {
                response = await Promise.race([axios.get(this.uri), timerPromise]);
            }
            catch (err) {
                throw err;
            }
            finally {
                timeout.clear();
            }
            /* eslint-enable no-useless-catch */
            const { data: poolsBuffer, status } = response;
            if (status != 200) {
                log.error({ response }, `Unabled to get pools from ${this.uri}.`);
                throw new Error(`Unable to get pools from ${this.uri}`);
            }
            const pools = poolsBuffer;
            log.info({ uri: this.uri, chain: this.chainId }, `Got subgraph pools from uri. Num: ${pools.length}`);
            allPools = pools;
        }, {
            retries: this.retries,
            onRetry: (err, retry) => {
                log.info({ err }, `Failed to get pools from uri ${this.uri}. Retry attempt: ${retry}`);
            },
        });
        return allPools;
    }
}
