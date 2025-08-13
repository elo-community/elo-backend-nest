export default () => ({
    blockchain: {
        amoy: {
            rpcUrl: process.env.RPC_AMOY,
            chainId: 80002,
        },
        // very: {
        //   rpcUrl: process.env.RPC_VERY,
        //   chainId: parseInt(process.env.CHAIN_VERY_ID || '80002', 10),
        // },
        admin: {
            privateKey: process.env.ADMIN_PRIV_KEY,
        },
        signer: {
            privateKey: process.env.SIGNER_PRIV_KEY,
        },
        contracts: {
            distributor: {
                amoy: process.env.DISTRIBUTOR_AMOY,
                // very: process.env.DISTRIBUTOR_VERY,
            },
            rewardPool: {
                amoy: process.env.REWARD_POOL_AMOY,
                // very: process.env.REWARD_POOL_VERY,
            },
        },
    },
}); 