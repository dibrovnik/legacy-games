import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Логин пользователя (email или username)',
  })
  @IsString()
  login: string;

  @ApiProperty({ example: 'securePassword123', description: 'Пароль пользователя' })
  @IsString()
  password: string;
}

class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access токен',
  })
  accessToken: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Авторизация пользователя' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 201, description: 'Успешный вход', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Неверный логин или пароль' })
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.login, body.password);
    return this.authService.login(user);
  }
}
