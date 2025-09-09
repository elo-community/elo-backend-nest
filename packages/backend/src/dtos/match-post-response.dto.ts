import { MatchRequest, MatchRequestStatus } from '../entities/match-request.entity';

export interface MatchInfo {
  matchLocation: string;
  myElo: number;
  preferredElo: string;
  participantCount: number;
  status: string;
  createdAt: Date; // 매치글 작성 날짜 추가
  deadline?: Date;
  matchDate?: Date;
}

export interface MatchParticipant {
  userId: number;
  nickname?: string;
  profileImageUrl?: string;
  elo?: number;
  requestedAt: Date;
  message?: string;
}

export interface MatchParticipants {
  confirmed: MatchParticipant[];
  pending: MatchParticipant[];
  rejected: MatchParticipant[];
}

export interface MatchPostResponse {
  id: number;
  title: string;
  content: string;
  type: string;
  sportCategoryId: number;
  author: {
    id: number;
    nickname?: string;
    profileImageUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  matchInfo: MatchInfo;
  participants: MatchParticipants;
}

export function mapMatchRequestToParticipant(matchRequest: MatchRequest): MatchParticipant {
  return {
    userId: matchRequest.user.id,
    nickname: matchRequest.user.nickname,
    profileImageUrl: matchRequest.user.profileImageUrl,
    elo: matchRequest.userElo,
    requestedAt: matchRequest.createdAt,
    message: matchRequest.message,
  };
}

export function groupMatchRequestsByStatus(matchRequests: MatchRequest[]): MatchParticipants {
  const confirmed: MatchParticipant[] = [];
  const pending: MatchParticipant[] = [];
  const rejected: MatchParticipant[] = [];

  matchRequests.forEach(request => {
    const participant = mapMatchRequestToParticipant(request);

    switch (request.status) {
      case MatchRequestStatus.ACCEPTED:
        confirmed.push(participant);
        break;
      case MatchRequestStatus.PENDING:
        pending.push(participant);
        break;
      case MatchRequestStatus.REJECTED:
        rejected.push(participant);
        break;
    }
  });

  return { confirmed, pending, rejected };
}
