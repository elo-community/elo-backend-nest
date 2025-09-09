import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtUser } from '../auth/jwt-user.interface';
import { MatchPostResponse, groupMatchRequestsByStatus } from '../dtos/match-post-response.dto';
import { CreateMatchPostDto, MatchRequestDto, MatchResponseDto } from '../dtos/match-post.dto';
import { MatchRequest, MatchRequestStatus } from '../entities/match-request.entity';
import { Post, PostType } from '../entities/post.entity';
import { SportCategory } from '../entities/sport-category.entity';
import { User } from '../entities/user.entity';
import { TempImageService } from './temp-image.service';

@Injectable()
export class MatchPostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(MatchRequest)
    private readonly matchRequestRepository: Repository<MatchRequest>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(SportCategory)
    private readonly sportCategoryRepository: Repository<SportCategory>,
    private readonly tempImageService: TempImageService,
  ) {}

  /**
   * 매치글 생성
   */
  async createMatchPost(createMatchPostDto: CreateMatchPostDto, user: JwtUser): Promise<Post> {
    const { sportCategoryId, imageUrls, ...rest } = createMatchPostDto;

    // 스포츠 카테고리 조회
    const sportCategory = await this.sportCategoryRepository.findOne({
      where: { id: sportCategoryId },
    });
    if (!sportCategory) {
      throw new NotFoundException('Sport category not found');
    }

    // 작성자 정보 조회
    const author = await this.userRepository.findOne({
      where: { id: user.id },
    });
    if (!author) {
      throw new NotFoundException('Author not found');
    }

    // content에서 실제 사용된 이미지 URL 추출
    const usedImageUrls = this.extractImageUrlsFromContent(rest.content || '');

    // 매치글 생성
    const post = this.postRepository.create({
      ...rest,
      type: PostType.MATCH,
      sportCategory,
      author,
      imageUrls: usedImageUrls,
      matchStatus: '대기중',
      // 기본 데드라인 설정 (2주 후)
      deadline: createMatchPostDto.deadline
        ? new Date(createMatchPostDto.deadline)
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      matchDate: createMatchPostDto.matchDate ? new Date(createMatchPostDto.matchDate) : undefined,
    });

    const savedPost = await this.postRepository.save(post);

    // 사용된 이미지들을 임시 이미지에서 제거
    for (const imageUrl of usedImageUrls) {
      await this.tempImageService.markImageAsUsed(imageUrl, user.id);
    }

    // 사용되지 않은 임시 이미지들 정리
    await this.tempImageService.cleanupUnusedImages(usedImageUrls, user.id);

    return savedPost;
  }

  /**
   * 매치글 상세 조회
   */
  async getMatchPostDetail(postId: number): Promise<MatchPostResponse> {
    const post = await this.postRepository.findOne({
      where: { id: postId, type: PostType.MATCH },
      relations: ['author', 'sportCategory'],
    });

    if (!post) {
      throw new NotFoundException('Match post not found');
    }

    // 매치 신청 목록 조회
    const matchRequests = await this.matchRequestRepository.find({
      where: { post: { id: postId } },
      relations: ['user'],
    });

    // 매치 정보 구성
    const matchInfo = {
      matchLocation: post.matchLocation!,
      myElo: post.myElo!,
      preferredElo: post.preferredElo!,
      status: post.matchStatus!,
      participantCount: post.participantCount!,
      createdAt: post.createdAt, // 매치글 작성 날짜 추가
      deadline: post.deadline,
      matchDate: post.matchDate,
    };

    // 참가자 정보 그룹화
    const participants = groupMatchRequestsByStatus(matchRequests);

    return {
      id: post.id,
      title: post.title!,
      content: post.content!,
      type: post.type,
      sportCategoryId: post.sportCategory!.id,
      author: {
        id: post.author.id,
        nickname: post.author.nickname,
        profileImageUrl: post.author.profileImageUrl,
      },
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      matchInfo,
      participants,
    };
  }

  /**
   * 매치 신청
   */
  async requestMatch(matchRequestDto: MatchRequestDto, user: JwtUser): Promise<MatchRequest> {
    const { postId, message } = matchRequestDto;

    // 매치글 조회
    const post = await this.postRepository.findOne({
      where: { id: postId, type: PostType.MATCH },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException('Match post not found');
    }

    // 자기 자신의 글에는 신청할 수 없음
    if (post.author.id === user.id) {
      throw new ForbiddenException('Cannot request match on your own post');
    }

    // 이미 신청한 경우 확인
    const existingRequest = await this.matchRequestRepository.findOne({
      where: { post: { id: postId }, user: { id: user.id } },
    });

    if (existingRequest) {
      throw new ForbiddenException('Already requested match on this post');
    }

    // 사용자 정보 조회 (Elo 포함)
    const userEntity = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['userElos', 'userElos.sportCategory'],
    });

    if (!userEntity) {
      throw new NotFoundException('User not found');
    }

    // 해당 스포츠의 Elo 조회 (없으면 undefined)
    const userElo = userEntity.userElos?.find(
      elo => elo.sportCategory.id === post.sportCategory?.id,
    )?.eloPoint;

    // 매치 신청 생성
    const matchRequest = this.matchRequestRepository.create({
      post,
      user: userEntity,
      message,
      userElo,
      status: MatchRequestStatus.PENDING,
    });

    return await this.matchRequestRepository.save(matchRequest);
  }

  /**
   * 매치 신청 응답 (수락/거절)
   */
  async respondToMatchRequest(
    matchResponseDto: MatchResponseDto,
    user: JwtUser,
  ): Promise<MatchRequest> {
    const { postId, action, responseMessage } = matchResponseDto;

    // 매치글 조회
    const post = await this.postRepository.findOne({
      where: { id: postId, type: PostType.MATCH },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException('Match post not found');
    }

    // 작성자만 응답할 수 있음
    if (post.author.id !== user.id) {
      throw new ForbiddenException('Only the author can respond to match requests');
    }

    // 매치 신청 조회
    const matchRequest = await this.matchRequestRepository.findOne({
      where: { post: { id: postId } },
      relations: ['user'],
    });

    if (!matchRequest) {
      throw new NotFoundException('Match request not found');
    }

    // 상태 업데이트
    const newStatus =
      action === 'accept' ? MatchRequestStatus.ACCEPTED : MatchRequestStatus.REJECTED;

    matchRequest.status = newStatus;
    matchRequest.respondedAt = new Date();
    matchRequest.responseMessage = responseMessage;

    // 매치글 상태 업데이트 (모집 완료 체크)
    if (action === 'accept') {
      const acceptedCount = await this.matchRequestRepository.count({
        where: { post: { id: postId }, status: MatchRequestStatus.ACCEPTED },
      });

      if (acceptedCount >= post.participantCount! - 1) {
        // 작성자 제외
        post.matchStatus = '모집완료';
        await this.postRepository.save(post);
      }
    }

    return await this.matchRequestRepository.save(matchRequest);
  }

  /**
   * 매치글 목록 조회
   */
  async getMatchPosts(sportCategoryId?: number, page: number = 1, limit: number = 10) {
    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.sportCategory', 'sportCategory')
      .where('post.type = :type', { type: PostType.MATCH })
      .orderBy('post.createdAt', 'DESC');

    if (sportCategoryId) {
      queryBuilder.andWhere('post.sportCategory.id = :sportCategoryId', { sportCategoryId });
    }

    const total = await queryBuilder.getCount();
    const posts = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // 각 매치글의 참가자 정보 조회
    const postsWithParticipants = await Promise.all(
      posts.map(async post => {
        const matchRequests = await this.matchRequestRepository.find({
          where: { post: { id: post.id } },
          relations: ['user'],
        });

        const participants = groupMatchRequestsByStatus(matchRequests);

        return {
          ...post,
          participants,
        };
      }),
    );

    return {
      posts: postsWithParticipants,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * content에서 이미지 URL 추출
   */
  private extractImageUrlsFromContent(content: string): string[] {
    const imageUrlRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
    const matches = content.match(imageUrlRegex);

    if (!matches) return [];

    return matches
      .map(match => {
        const urlMatch = match.match(/\((https?:\/\/[^\s)]+)\)/);
        return urlMatch ? urlMatch[1] : '';
      })
      .filter(url => url);
  }

  /**
   * Elo 기반 추천 매치글 조회 (등록 종목 우선 + 다른 종목도 포함)
   */
  async getRecommendedMatchPosts(userId: number, limit: number = 3): Promise<Post[]> {
    console.log(`🔍 [MatchPostService] 추천 매치글 조회 시작 - userId: ${userId}, limit: ${limit}`);

    // 사용자 정보 조회 (Elo 포함)
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['userElos', 'userElos.sportCategory'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    console.log(
      `👤 [MatchPostService] 사용자 정보: ${user.nickname}, Elo 개수: ${user.userElos?.length || 0}`,
    );

    // 사용자의 모든 스포츠 Elo 정보
    const userElos = user.userElos || [];
    const recommendedPosts: Post[] = [];

    if (userElos.length > 0) {
      // 1단계: 등록한 종목에서 우선 추천 (Elo 기반)
      const registeredCategoryPosts: Post[] = [];
      const postsPerCategory = Math.ceil((limit * 0.7) / userElos.length); // 등록 종목에 70% 할당

      console.log(
        `🎯 [MatchPostService] ${userElos.length}개 등록 종목에서 우선 추천 매치글 조회 시작`,
      );

      for (const userElo of userElos) {
        console.log(
          `🏓 [MatchPostService] ${userElo.sportCategory.name} 카테고리 처리 - Elo: ${userElo.eloPoint}`,
        );

        const categoryPosts = await this.postRepository
          .createQueryBuilder('post')
          .leftJoinAndSelect('post.author', 'author')
          .leftJoinAndSelect('post.sportCategory', 'sportCategory')
          .where('post.type = :type', { type: PostType.MATCH })
          .andWhere('post.matchStatus = :status', { status: '대기중' })
          .andWhere('post.sportCategory.id = :categoryId', { categoryId: userElo.sportCategory.id })
          .andWhere('post.author.id != :userId', { userId: user.id }) // 자기 자신의 글 제외
          .orderBy('post.createdAt', 'DESC') // 최신 순
          .take(postsPerCategory)
          .getMany();

        console.log(
          `📊 [MatchPostService] ${userElo.sportCategory.name}에서 ${categoryPosts.length}개 매치글 조회됨`,
        );
        registeredCategoryPosts.push(...categoryPosts);
      }

      // 등록 종목에서 Elo 차이가 가장 적은 순으로 정렬
      const sortedRegisteredPosts = registeredCategoryPosts.sort((a, b) => {
        const userElo =
          userElos.find(ue => ue.sportCategory.id === a.sportCategory?.id)?.eloPoint || 1400;
        const aDiff = Math.abs((a.myElo || 1400) - userElo);
        const bDiff = Math.abs((b.myElo || 1400) - userElo);
        return aDiff - bDiff;
      });

      recommendedPosts.push(...sortedRegisteredPosts);
      console.log(
        `✅ [MatchPostService] 등록 종목에서 ${sortedRegisteredPosts.length}개 매치글 수집 완료`,
      );
    }

    // 2단계: 다른 종목에서 추가 추천 (최신순)
    const remainingLimit = limit - recommendedPosts.length;
    if (remainingLimit > 0) {
      console.log(`🌍 [MatchPostService] 다른 종목에서 ${remainingLimit}개 추가 매치글 조회 시작`);

      // 사용자가 등록하지 않은 종목들의 ID 목록
      const registeredCategoryIds = userElos.map(ue => ue.sportCategory.id);

      const otherCategoryPosts = await this.postRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .leftJoinAndSelect('post.sportCategory', 'sportCategory')
        .where('post.type = :type', { type: PostType.MATCH })
        .andWhere('post.matchStatus = :status', { status: '대기중' })
        .andWhere('post.author.id != :userId', { userId: user.id }) // 자기 자신의 글 제외
        .orderBy('post.createdAt', 'DESC') // 최신 순
        .take(remainingLimit)
        .getMany();

      // 등록하지 않은 종목만 필터링
      const filteredOtherPosts = otherCategoryPosts.filter(
        post => post.sportCategory && !registeredCategoryIds.includes(post.sportCategory.id),
      );

      console.log(
        `📊 [MatchPostService] 다른 종목에서 ${filteredOtherPosts.length}개 매치글 조회됨`,
      );
      recommendedPosts.push(...filteredOtherPosts);
    }

    // 3단계: 등록 종목이 없거나 부족한 경우 전체에서 최신순으로 보충
    if (recommendedPosts.length < limit) {
      const additionalLimit = limit - recommendedPosts.length;
      console.log(`🔄 [MatchPostService] 전체 종목에서 ${additionalLimit}개 추가 매치글 조회 시작`);

      const additionalPosts = await this.postRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .leftJoinAndSelect('post.sportCategory', 'sportCategory')
        .where('post.type = :type', { type: PostType.MATCH })
        .andWhere('post.matchStatus = :status', { status: '대기중' })
        .andWhere('post.author.id != :userId', { userId: user.id }) // 자기 자신의 글 제외
        .andWhere('post.id NOT IN (:...existingIds)', {
          existingIds:
            recommendedPosts.map(p => p.id).length > 0 ? recommendedPosts.map(p => p.id) : [0],
        })
        .orderBy('post.createdAt', 'DESC') // 최신 순
        .take(additionalLimit)
        .getMany();

      console.log(
        `📊 [MatchPostService] 전체 종목에서 ${additionalPosts.length}개 추가 매치글 조회됨`,
      );
      recommendedPosts.push(...additionalPosts);
    }

    // 최종 결과를 limit만큼만 반환
    const finalPosts = recommendedPosts.slice(0, limit);
    console.log(`🎉 [MatchPostService] 최종 추천 매치글 ${finalPosts.length}개 반환`);

    // 각 매치글의 참가자 정보 조회
    const postsWithParticipants = await Promise.all(
      finalPosts.map(async post => {
        const matchRequests = await this.matchRequestRepository.find({
          where: { post: { id: post.id } },
          relations: ['user'],
        });

        const participants = groupMatchRequestsByStatus(matchRequests);

        return {
          ...post,
          participants,
        };
      }),
    );

    return postsWithParticipants as any; // 타입 에러 해결을 위해 any 사용
  }

  /**
   * 스포츠 카테고리별 추천 매치글 조회
   */
  async getRecommendedMatchPostsByCategory(
    userId: number,
    sportCategoryId: number,
    limit: number = 3,
  ): Promise<Post[]> {
    // 사용자 정보 조회 (특정 스포츠 Elo 포함)
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['userElos', 'userElos.sportCategory'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 해당 스포츠의 Elo 정보
    const userElo = user.userElos?.find(ue => ue.sportCategory.id === sportCategoryId);
    const userEloValue = userElo?.eloPoint || 1400;

    // Elo 기반 추천 매치글 조회 (ABS 함수 제거하고 단순화)
    const recommendedPosts = await this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.sportCategory', 'sportCategory')
      .where('post.type = :type', { type: PostType.MATCH })
      .andWhere('post.matchStatus = :status', { status: '대기중' })
      .andWhere('post.sportCategory.id = :categoryId', { categoryId: sportCategoryId })
      .andWhere('post.author.id != :userId', { userId: user.id }) // 자기 자신의 글 제외
      .orderBy('post.createdAt', 'DESC') // 최신 순
      .take(limit)
      .getMany();

    // JavaScript에서 Elo 차이로 정렬
    const sortedPosts = recommendedPosts.sort((a, b) => {
      const aDiff = Math.abs((a.myElo || 1400) - userEloValue);
      const bDiff = Math.abs((b.myElo || 1400) - userEloValue);
      return aDiff - bDiff;
    });

    // 각 매치글의 참가자 정보 조회
    const postsWithParticipants = await Promise.all(
      sortedPosts.map(async post => {
        const matchRequests = await this.matchRequestRepository.find({
          where: { post: { id: post.id } },
          relations: ['user'],
        });

        const participants = groupMatchRequestsByStatus(matchRequests);

        return {
          ...post,
          participants,
        };
      }),
    );

    return postsWithParticipants as any; // 타입 에러 해결을 위해 any 사용
  }
}
