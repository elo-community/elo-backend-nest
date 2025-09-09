import { UserEloResponseDto } from './user-elo-response.dto';
import { UserResponseDto } from './user-response.dto';

export class UserProfileResponseDto {
  user: UserResponseDto;
  userElos: UserEloResponseDto[];

  constructor(user: any, userElos: any[]) {
    this.user = new UserResponseDto(user);
    this.userElos = userElos.map(elo => new UserEloResponseDto(elo));
  }
}
