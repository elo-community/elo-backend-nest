import { ethers } from "hardhat";

async function main() {
    // 네트워크 정보 가져오기
    const network = await ethers.provider.getNetwork();
    const networkName = network.name || 'unknown';
    const chainId = network.chainId;

    // 배포자 정보
    const [deployer] = await ethers.getSigners();
    const deployerAddress = deployer.address;

    // 1. TrivusEXP1363 토큰 컨트랙트 배포
    const TrivusEXP1363 = await ethers.getContractFactory("TrivusEXP1363");

    // 가스 한도와 가스 가격 설정
    const deployOptions = {
        gasLimit: 2000000, // 2M 가스 한도
        gasPrice: 1000000000, // 1 gwei (매우 낮은 가스 가격)
    };

    const trivusExp = await TrivusEXP1363.deploy(deployOptions);
    await trivusExp.waitForDeployment();

    const trivusExpAddress = await trivusExp.getAddress();

    // 2. PostLikeSystem1363 컨트랙트 배포
    const PostLikeSystem1363 = await ethers.getContractFactory("PostLikeSystem1363");

    const postLikeSystem = await PostLikeSystem1363.deploy(
        trivusExpAddress, // 토큰 컨트랙트 주소
        deployOptions // 가스 한도 설정
    );
    await postLikeSystem.waitForDeployment();

    const postLikeSystemAddress = await postLikeSystem.getAddress();

    // PostLikeSystem의 trustedSigner를 배포자로 설정
    const setTrustedSignerTx = await postLikeSystem.setTrustedSigner(deployerAddress);
    await setTrustedSignerTx.wait();

    // 3. 배포자에게 초기 토큰 민팅
    const mintAmount = ethers.parseEther("10000"); // 10,000 EXP

    const mintTx = await trivusExp.mint(deployerAddress, mintAmount);
    await mintTx.wait();

    // 4. PostLikeSystem에 토큰 전송 (좋아요 테스트용)
    const testAmount = ethers.parseEther("1000"); // 1,000 EXP
    const transferTx = await trivusExp.transfer(postLikeSystemAddress, testAmount);
    await transferTx.wait();

    // 5. 컨트랙트 상태 확인

    // TrivusEXP1363 상태
    const totalSupply = await trivusExp.totalSupply();
    const deployerBalance = await trivusExp.balanceOf(deployerAddress);
    const postLikeBalance = await trivusExp.balanceOf(postLikeSystemAddress);

    // PostLikeSystem1363 상태
    const likePrice = await postLikeSystem.likePrice();
    const trustedSigner = await postLikeSystem.trustedSigner();
    const tokenAddress = await postLikeSystem.token();
    // 네트워크 이름을 대문자로 변환 (환경변수명 규칙)
    const networkUpper = networkName.toUpperCase();

    console.log(`# ${networkUpper} 네트워크 설정`);
    console.log(`NETWORK=${networkName}`);
    console.log(`RPC_${networkUpper}=<실제_RPC_URL>`);
    console.log(`CHAIN_${networkUpper}_ID=${chainId}`);
    console.log(`TRIVUS_EXP_1363_${networkUpper}=${trivusExpAddress}`);
    console.log(`POST_LIKE_SYSTEM_${networkUpper}=${postLikeSystemAddress}`);
    console.log(`ADMIN_ADDRESS=${deployerAddress}`);
    console.log(`SIGNER_ADDRESS=${deployerAddress}`);
    console.log(`TRUSTED_SIGNER_ADDRESS=${deployerAddress}`);
    console.log("=".repeat(80));

    return {
        network: networkName,
        chainId: chainId,
        trivusExp: trivusExpAddress,
        postLikeSystem: postLikeSystemAddress,
        deployer: deployerAddress
    };
}

main()
    .then((result) => {
        console.log("\n✅ 배포 성공!");
        console.log("배포된 컨트랙트 주소:", result);
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ 배포 실패:", error);
        process.exit(1);
    });
