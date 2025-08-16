# 🚀 PostLikeSystem 실제 네트워크 배포 가이드

## 📋 필요한 환경 변수

### **1. 루트 디렉토리 `.env` 파일에 추가**

```bash
# 프로젝트 루트 디렉토리 (.env)
NETWORK=amoy

# 블록체인 설정
RPC_AMOY=https://rpc-amoy.polygon.technology
CHAIN_AMOY_ID=80002

# 관리자 개인키 (실제 배포용)
ADMIN_PRIV_KEY=your_actual_admin_private_key_here

# 기존 컨트랙트 주소
TRIVUS_EXP_AMOY=your_existing_trivus_exp_contract_address_here

# 배포 후 추가할 주소 (배포 후 업데이트)
POST_LIKE_SYSTEM_AMOY=deployed_contract_address_here
```

### **2. 환경 변수 설명**

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `NETWORK` | 배포할 네트워크 | `amoy`, `very`, `mainnet` |
| `RPC_AMOY` | Amoy 테스트넷 RPC URL | `https://rpc-amoy.polygon.technology` |
| `CHAIN_AMOY_ID` | Amoy 체인 ID | `80002` |
| `ADMIN_PRIV_KEY` | 관리자 개인키 (0x 제외) | `1234...abcd` |
| `TRIVUS_EXP_AMOY` | 기존 TrivusEXP 토큰 컨트랙트 주소 | `0x1234...abcd` |

## 🚀 배포 실행

### **1단계: 환경 변수 설정**

```bash
# 프로젝트 루트 디렉토리에서
export NETWORK=amoy
export ADMIN_PRIV_KEY=your_private_key_here
export RPC_AMOY=https://rpc-amoy.polygon.technology
export TRIVUS_EXP_AMOY=your_trivus_exp_address_here
```

### **2단계: 배포 스크립트 실행**

```bash
cd packages/contracts
npx hardhat run scripts/deployToNetwork.ts --network amoy
```

### **3단계: 배포 후 환경 변수 업데이트**

배포가 성공하면 출력된 `POST_LIKE_SYSTEM_AMOY` 주소를 `.env` 파일에 추가:

```bash
POST_LIKE_SYSTEM_AMOY=0xdeployed_contract_address_here
```

## 🧪 Remix에서 테스트

### **1단계: Remix IDE 접속**
- https://remix.ethereum.org 접속

### **2단계: 컨트랙트 로드**
1. **Deploy & Run Transactions** 탭 선택
2. **Environment**: `Injected Provider - MetaMask` 선택
3. **MetaMask에서 Amoy 네트워크 연결**
4. **Contract**: `PostLikeSystem` 선택
5. **At Address**: 배포된 컨트랙트 주소 입력
6. **Load** 버튼 클릭

### **3단계: 함수 테스트**

#### **좋아요 기능 테스트**
```solidity
// likePost(uint256 postId, address postAuthor)
likePost(1, "0xyour_post_author_address")
```

#### **좋아요 취소 테스트**
```solidity
// unlikePost(uint256 postId)
unlikePost(1)
```

#### **토큰 회수 테스트**
```solidity
// withdrawTokens(uint256 postId)
withdrawTokens(1)
```

#### **정보 조회 테스트**
```solidity
// getPostLikeInfo(uint256 postId)
getPostLikeInfo(1)

// hasLiked(uint256 postId, address user)
hasLiked(1, "0xuser_address")
```

## ⚠️ 주의사항

1. **개인키 보안**: `ADMIN_PRIV_KEY`는 절대 공개하지 마세요
2. **네트워크 확인**: MetaMask에서 올바른 네트워크(Amoy)에 연결되었는지 확인
3. **가스비**: 배포 및 테스트 시 충분한 가스비 확보
4. **컨트랙트 주소**: 배포된 컨트랙트 주소를 안전하게 보관

## 🔧 문제 해결

### **배포 실패 시**
1. 환경 변수가 올바르게 설정되었는지 확인
2. RPC URL이 유효한지 확인
3. 개인키가 올바른지 확인
4. 네트워크 연결 상태 확인

### **Remix에서 로드 실패 시**
1. MetaMask 네트워크 연결 상태 확인
2. 컨트랙트 주소가 올바른지 확인
3. ABI가 올바른지 확인

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. 환경 변수 설정
2. 네트워크 연결 상태
3. 컨트랙트 컴파일 상태
4. Hardhat 설정
