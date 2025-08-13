declare const _default: () => {
    blockchain: {
        amoy: {
            rpcUrl: string;
            chainId: number;
        };
        admin: {
            privateKey: string;
        };
        signer: {
            privateKey: string;
        };
        contracts: {
            distributor: {
                amoy: string;
            };
            rewardPool: {
                amoy: string;
            };
        };
    };
};
export default _default;
