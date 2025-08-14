import { TypedDataField } from 'ethers';
export declare const EIP712_DOMAIN_NAME = "SignedRewardDistributor";
export declare const EIP712_DOMAIN_VERSION = "1";
export declare const claimTypes: Record<string, TypedDataField[]>;
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
export declare function domainFor(chainId: number, verifyingContract: string): EIP712Domain;
export interface SignedClaimTicket {
    domain: EIP712Domain;
    types: typeof claimTypes;
    message: ClaimMessage;
    signature: string;
}
