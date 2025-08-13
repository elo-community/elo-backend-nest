"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimTypes = exports.EIP712_DOMAIN_VERSION = exports.EIP712_DOMAIN_NAME = void 0;
exports.domainFor = domainFor;
exports.EIP712_DOMAIN_NAME = 'SignedRewardDistributor';
exports.EIP712_DOMAIN_VERSION = '1';
exports.claimTypes = {
    Claim: [
        { name: 'distributionId', type: 'uint256' },
        { name: 'postId', type: 'bytes32' },
        { name: 'account', type: 'address' },
        { name: 'authorizedAmount', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
    ],
};
function domainFor(chainId, verifyingContract) {
    return {
        name: exports.EIP712_DOMAIN_NAME,
        version: exports.EIP712_DOMAIN_VERSION,
        chainId,
        verifyingContract
    };
}
//# sourceMappingURL=eip712.js.map