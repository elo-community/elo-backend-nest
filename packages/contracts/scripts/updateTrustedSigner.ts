import * as dotenv from "dotenv";
import { ethers } from "hardhat";

dotenv.config({ path: "/Users/okhaeeun/Desktop/elo-community/elo-community-backend-nest/.env" });

async function main() {
    console.log("🔧 Updating TrustedSigner on TrivusEXP contract...");

    const adminPrivateKey = process.env.ADMIN_PRIV_KEY;
    const trustedSignerKey = process.env.TRUSTED_SIGNER_PRIV_KEY;
    const contractAddress = process.env.TRIVUS_EXP_AMOY;

    if (!adminPrivateKey || !trustedSignerKey) {
        throw new Error("❌ ADMIN_PRIV_KEY or TRUSTED_SIGNER_PRIV_KEY environment variable is not set");
    }

    if (!contractAddress) {
        throw new Error("❌ TRIVUS_EXP_AMOY environment variable is not set");
    }

    // TRUSTED_SIGNER_PRIV_KEY에서 주소 생성
    const trustedSigner = new ethers.Wallet(trustedSignerKey);
    const newTrustedSigner = trustedSigner.address;

    console.log(`📋 Configuration:`);
    console.log(`   Contract Address: ${contractAddress}`);
    console.log(`   TRUSTED_SIGNER_PRIV_KEY address: ${newTrustedSigner}`);
    console.log(`   Admin Address: ${new ethers.Wallet(adminPrivateKey).address}`);

    const admin = new ethers.Wallet(adminPrivateKey);
    const rpcUrl = process.env.RPC_AMOY || "https://rpc-amoy.polygon.technology";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const connectedAdmin = admin.connect(provider);

    // 컨트랙트 인스턴스 생성
    const TrivusEXP = await ethers.getContractFactory("TrivusEXP", connectedAdmin);
    const trivusEXP = TrivusEXP.attach(contractAddress);

    // 현재 TrustedSigner 확인
    console.log("\n📊 Current Contract Status:");
    try {
        const currentTrustedSigner = await trivusEXP.trustedSigner();
        console.log(`   Current TrustedSigner: ${currentTrustedSigner}`);
        console.log(`   New TrustedSigner: ${newTrustedSigner}`);
        console.log(`   Match: ${currentTrustedSigner === newTrustedSigner ? '✅ Yes' : '❌ No'}`);

        if (currentTrustedSigner === newTrustedSigner) {
            console.log("\n✅ TrustedSigner is already set correctly");
            return;
        }
    } catch (error) {
        console.log(`   ❌ Failed to get current TrustedSigner: ${(error as Error).message}`);
        return;
    }

    // TrustedSigner 업데이트
    console.log("\n📝 Updating TrustedSigner...");
    try {
        const tx = await trivusEXP.updateTrustedSigner(newTrustedSigner);
        console.log(`   Transaction hash: ${tx.hash}`);
        console.log("   Waiting for confirmation...");

        await tx.wait();
        console.log("   ✅ Transaction confirmed!");
    } catch (error) {
        console.log(`   ❌ Failed to update TrustedSigner: ${(error as Error).message}`);
        return;
    }

    // 업데이트 확인
    console.log("\n📊 Verification:");
    try {
        const updatedTrustedSigner = await trivusEXP.trustedSigner();
        console.log(`   Updated TrustedSigner: ${updatedTrustedSigner}`);
        console.log(`   Expected: ${newTrustedSigner}`);
        console.log(`   Match: ${updatedTrustedSigner === newTrustedSigner ? '✅ Success' : '❌ Failed'}`);

        if (updatedTrustedSigner === newTrustedSigner) {
            console.log("\n🎉 TrustedSigner updated successfully!");
        } else {
            console.log("\n❌ TrustedSigner update failed!");
        }
    } catch (error) {
        console.log(`   ❌ Failed to verify update: ${(error as Error).message}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Update failed:", error);
        process.exit(1);
    }); 