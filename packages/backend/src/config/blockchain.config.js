"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    blockchain: {
        amoy: {
            rpcUrl: process.env.RPC_AMOY,
            chainId: 80002,
        },
        admin: {
            privateKey: process.env.ADMIN_PRIV_KEY,
        },
        signer: {
            privateKey: process.env.SIGNER_PRIV_KEY,
        },
        contracts: {
            distributor: {
                amoy: process.env.DISTRIBUTOR_AMOY,
            },
            rewardPool: {
                amoy: process.env.REWARD_POOL_AMOY,
            },
        },
    },
});
//# sourceMappingURL=blockchain.config.js.map