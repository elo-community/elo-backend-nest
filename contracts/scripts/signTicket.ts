import { ethers } from "hardhat";

async function main() {
    // Get command line arguments
    const args = process.argv.slice(2);

    if (args.length < 5) {
        console.log("Usage: npx hardhat run scripts/signTicket.ts -- <distributionId> <postId> <account> <amount> <deadline> [chainId]");
        console.log("Example: npx hardhat run scripts/signTicket.ts -- 1 0x1234... 0xabcd... 1000000000000000000 1704067200 80002");
        process.exit(1);
    }

    const [distributionId, postId, account, amount, deadline, chainId] = args;

    // Validate inputs
    if (!ethers.isHexString(postId, 32)) {
        throw new Error("Invalid postId: must be 32-byte hex string");
    }

    if (!ethers.isAddress(account)) {
        throw new Error("Invalid account address");
    }

    if (isNaN(Number(amount)) || Number(amount) <= 0) {
        throw new Error("Invalid amount: must be positive number");
    }

    if (isNaN(Number(deadline)) || Number(deadline) <= Math.floor(Date.now() / 1000)) {
        throw new Error("Invalid deadline: must be future timestamp");
    }

    // Get signer wallet
    const [signer] = await ethers.getSigners();
    if (!signer) {
        throw new Error("No signer account found");
    }

    console.log("Signing ticket with account:", signer.address);
    console.log("Distribution ID:", distributionId);
    console.log("Post ID:", postId);
    console.log("Account:", account);
    console.log("Amount:", amount);
    console.log("Deadline:", deadline);

    // Build EIP-712 domain
    const domain = {
        name: "SignedRewardDistributor",
        version: "1",
        chainId: chainId ? parseInt(chainId) : (await ethers.provider.getNetwork()).chainId,
        verifyingContract: "0x0000000000000000000000000000000000000000" // Placeholder, will be filled by client
    };

    // Build claim message
    const types = {
        Claim: [
            { name: "distributionId", type: "uint256" },
            { name: "postId", type: "bytes32" },
            { name: "account", type: "address" },
            { name: "authorizedAmount", type: "uint256" },
            { name: "deadline", type: "uint256" }
        ]
    };

    const message = {
        distributionId: parseInt(distributionId),
        postId: postId as `0x${string}`,
        account: account as `0x${string}`,
        authorizedAmount: amount,
        deadline: parseInt(deadline)
    };

    // Sign the message
    const signature = await signer.signTypedData(domain, types, message);

    // Output the signed ticket
    console.log("\n=== Signed Claim Ticket ===");
    console.log(JSON.stringify({
        domain,
        types,
        message,
        signature,
        signer: signer.address
    }, null, 2));

    console.log("\n=== For Client Use ===");
    console.log("Replace 'verifyingContract' in domain with actual distributor address");
    console.log("Submit claim with: distributor.claim(distributionId, postId, account, authorizedAmount, deadline, signature)");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 