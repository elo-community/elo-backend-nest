import { TypedDataField } from 'ethers';

export const EIP712_DOMAIN_NAME = 'SignedRewardDistributor';
export const EIP712_DOMAIN_VERSION = '1';

export const claimTypes: Record<string, TypedDataField[]> = {
    Claim: [
        { name: 'distributionId', type: 'uint256' },
        { name: 'postId', type: 'bytes32' },
        { name: 'account', type: 'address' },
        { name: 'authorizedAmount', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
    ],
};

export interface ClaimMessage {
    distributionId: number;
    postId: `0x${string}`;
    account: `0x${string}`;
    authorizedAmount: string;
    deadline: number;
}

export interface EIP712Domain {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
}

export function domainFor(chainId: number, verifyingContract: string): EIP712Domain {
    return {
        name: EIP712_DOMAIN_NAME,
        version: EIP712_DOMAIN_VERSION,
        chainId,
        verifyingContract
    };
}

export interface SignedClaimTicket {
    domain: EIP712Domain;
    types: typeof claimTypes;
    message: ClaimMessage;
    signature: string;
} 