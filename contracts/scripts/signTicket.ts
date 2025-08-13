import { TypedDataDomain, TypedDataField } from "ethers";
import { ethers } from "hardhat";

interface Claim {
    distributionId: number;
    postId: string;
    account: string;
    authorizedAmount: number;
    deadline: number;
}

async function main() {
    // Hardhat ethers v6 호환성을 위해 hre.ethers 사용
    const { ethers: hreEthers } = require("hardhat");
    const [signer] = await hreEthers.getSigners();

    if (!signer) {
        throw new Error("No signer account found");
    }

    console.log("Signing ticket with account:", signer.address);

    // EIP-712 도메인 정의
    const domain: TypedDataDomain = {
        name: "SignedRewardDistributor",
        version: "1",
        chainId: process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : (await hreEthers.provider.getNetwork()).chainId,
        verifyingContract: process.env.DISTRIBUTOR_ADDRESS || "0x0000000000000000000000000000000000000000"
    };

    // EIP-712 타입 정의
    const types: Record<string, TypedDataField[]> = {
        Claim: [
            { name: "distributionId", type: "uint256" },
            { name: "postId", type: "bytes32" },
            { name: "account", type: "address" },
            { name: "authorizedAmount", type: "uint256" },
            { name: "deadline", type: "uint256" }
        ]
    };

    // 클레임 메시지
    const message: Claim = {
        distributionId: parseInt(process.env.DISTRIBUTION_ID || "1"),
        postId: process.env.POST_ID || "0x0000000000000000000000000000000000000000000000000000000000000000",
        account: process.env.ACCOUNT_ADDRESS || signer.address,
        authorizedAmount: parseInt(process.env.AUTHORIZED_AMOUNT || "1000000000000000000"), // 1 token
        deadline: Math.floor(Date.now() / 1000) + 86400 // 24 hours from now
    };

    try {
        // EIP-712 서명 생성
        const signature = await signer.signTypedData(domain, types, message);

        console.log("✅ Ticket signed successfully!");
        console.log("Signature:", signature);
        console.log("Message:", message);

        // 서명 검증
        const recoveredAddress = ethers.verifyTypedData(domain, types, message, signature);
        console.log("Recovered address:", recoveredAddress);
        console.log("Signer address:", signer.address);

        if (recoveredAddress.toLowerCase() === signer.address.toLowerCase()) {
            console.log("✅ Signature verification successful!");
        } else {
            console.log("❌ Signature verification failed!");
        }

    } catch (error) {
        console.error("❌ Error signing ticket:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 