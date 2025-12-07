export class UserDto {
  id: string;
  email: string;
  name: string;
}

export class AuthResponseDto {
  access_token: string;
  user: UserDto;
}
