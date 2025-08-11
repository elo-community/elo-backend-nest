export class CreateMatchResultDto {
    partnerNickname: string;
    sportCategoryId: number;
    myResult: 'win' | 'lose' | 'draw';
    isHandicap?: boolean;
    playedAt: string | Date;
}

export class UpdateMatchResultDto {
    action: 'accept' | 'reject';
}

// 보낸 요청용 DTO
export class SentMatchResultResponseDto {
    id: number;
    partnerId: number;
    partnerNickname: string;
    sportCategoryId: number;
    sportCategoryName: string;
    myResult?: 'win' | 'lose' | 'draw';
    isHandicap: boolean;
    status: 'pending' | 'confirmed' | 'rejected' | 'expired' | 'cancelled';
    expiredTime: Date;
    createdAt: Date;
    playedAt: Date;
    playedDate: Date;
    confirmedAt?: Date;
    partnerResult?: 'win' | 'lose' | 'draw';

    constructor(matchResult: any) {
        this.id = matchResult.id;
        this.partnerId = matchResult.partner?.id;
        this.partnerNickname = matchResult.partner?.nickname;
        this.sportCategoryId = matchResult.sportCategory.id;
        this.sportCategoryName = matchResult.sportCategory.name;
        this.myResult = matchResult.myResult;
        this.isHandicap = matchResult.isHandicap;
        this.status = matchResult.status;
        this.expiredTime = matchResult.expiredTime;
        this.createdAt = matchResult.createdAt;
        this.playedAt = matchResult.playedAt;
        this.playedDate = matchResult.playedDate;
        this.confirmedAt = matchResult.confirmedAt;
        this.partnerResult = matchResult.partnerResult;
    }
}

// 받은 요청용 DTO
export class ReceivedMatchResultResponseDto {
    id: number;
    senderId: number;
    senderNickname: string;
    sportCategoryId: number;
    sportCategoryName: string;
    myResult?: 'win' | 'lose' | 'draw';
    isHandicap: boolean;
    status: 'pending' | 'confirmed' | 'rejected' | 'expired' | 'cancelled';
    expiredTime: Date;
    createdAt: Date;
    playedAt: Date;
    playedDate: Date;
    confirmedAt?: Date;
    partnerResult?: 'win' | 'lose' | 'draw';

    constructor(matchResult: any) {
        this.id = matchResult.id;
        this.senderId = matchResult.user?.id;
        this.senderNickname = matchResult.user?.nickname;
        this.sportCategoryId = matchResult.sportCategory.id;
        this.sportCategoryName = matchResult.sportCategory.name;
        // 받은 사람 입장에서는 보낸 사람의 결과를 반대로 보여줌
        this.myResult = matchResult.myResult === 'win' ? 'lose' :
            matchResult.myResult === 'lose' ? 'win' : 'draw';
        this.isHandicap = matchResult.isHandicap;
        this.status = matchResult.status;
        this.expiredTime = matchResult.expiredTime;
        this.createdAt = matchResult.createdAt;
        this.playedAt = matchResult.playedAt;
        this.playedDate = matchResult.playedDate;
        this.confirmedAt = matchResult.confirmedAt;
        this.partnerResult = matchResult.partnerResult;
    }
}

// 기존 DTO (하위 호환성을 위해 유지)
export class MatchResultResponseDto {
    id: number;
    partnerId?: number;
    partnerNickname?: string;
    senderId?: number;
    senderNickname?: string;
    sportCategoryId: number;
    sportCategoryName: string;
    myResult?: 'win' | 'lose' | 'draw';
    isHandicap: boolean;
    status: 'pending' | 'confirmed' | 'rejected' | 'expired' | 'cancelled';
    expiredTime: Date;
    createdAt: Date;
    playedAt: Date;
    playedDate: Date;
    confirmedAt?: Date;
    partnerResult?: 'win' | 'lose' | 'draw';

    constructor(matchResult: any, currentUserId?: number) {
        this.id = matchResult.id;
        this.sportCategoryId = matchResult.sportCategory.id;
        this.sportCategoryName = matchResult.sportCategory.name;

        // 현재 사용자가 매치의 주체인지 파트너인지 확인하여 결과 결정
        if (currentUserId) {
            const isUserCreator = matchResult.user?.id === currentUserId;
            if (isUserCreator) {
                // 보낸 사람: 파트너 정보 표시
                this.partnerId = matchResult.partner?.id;
                this.partnerNickname = matchResult.partner?.nickname;
                this.senderId = matchResult.user?.id;
                this.senderNickname = matchResult.user?.nickname;
                // 원래 결과 그대로
                this.myResult = matchResult.myResult;
            } else {
                // 받은 사람: 보낸 사람 정보 표시
                this.senderId = matchResult.user?.id;
                this.senderNickname = matchResult.user?.nickname;
                this.partnerId = matchResult.partner?.id;
                this.partnerNickname = matchResult.partner?.nickname;
                // 받은 사람 입장에서는 결과를 반대로 표시
                this.myResult = matchResult.myResult === 'win' ? 'lose' :
                    matchResult.myResult === 'lose' ? 'win' : 'draw';
            }
        }

        this.isHandicap = matchResult.isHandicap;
        this.status = matchResult.status;
        this.expiredTime = matchResult.expiredTime;
        this.createdAt = matchResult.createdAt;
        this.playedAt = matchResult.playedAt;
        this.playedDate = matchResult.playedDate;
        this.confirmedAt = matchResult.confirmedAt;
        this.partnerResult = matchResult.partnerResult;
    }
} 