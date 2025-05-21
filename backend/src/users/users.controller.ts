// src/controllers/users.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Query,
  Body,
  Request,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

interface UserWithVip {
  id: number;
  first_name: string;
  last_name: string;
  avatar: string | null;
  phone: string | null;
  email: string | null;
  balance_rub: number;
  balance_bonus: number;
  role: any;
  vip_active: boolean;
  vip_expires_at: Date | null;
}

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'The user was successfully created',
    type: CreateUserDto,
  })
  @ApiBody({ type: CreateUserDto })
  async register(@Body() body: CreateUserDto): Promise<UserWithVip> {
    const user = await this.usersService.createUser(body);
    return this.mapWithVip(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get the profile of the currently authenticated user' })
  @ApiResponse({ status: 200, description: "The user's profile with VIP info" })
  getProfile(@Request() req): Promise<UserWithVip> {
    return this.usersService.findById(req.user.id).then((u) => {
      if (!u) throw new BadRequestException('User not found');
      return this.mapWithVip(u);
    });
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  @ApiOperation({ summary: 'Update the profile of the currently authenticated user' })
  @ApiResponse({ status: 200, description: 'The updated user profile with VIP info' })
  @ApiBody({ type: UpdateUserDto })
  updateMe(@Request() req, @Body() dto: UpdateUserDto): Promise<UserWithVip> {
    return this.usersService.update(req.user.id, dto).then((u) => {
      if (!u) throw new BadRequestException('User not found');
      return this.mapWithVip(u);
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  @ApiOperation({ summary: "Delete the currently authenticated user's account" })
  @ApiResponse({ status: 204, description: 'No content' })
  deleteMe(@Request() req): Promise<void> {
    return this.usersService.remove(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Retrieve a list of all users' })
  @ApiResponse({ status: 200, description: 'A list of users with VIP info' })
  @ApiQuery({ name: 'query', required: false, description: 'Search by name' })
  async findAll(@Query('query') query?: string): Promise<UserWithVip[]> {
    let users = await this.usersService.findAll();
    if (query) {
      users = users.filter(
        (u) =>
          u.first_name.toLowerCase().includes(query.toLowerCase()) ||
          u.last_name.toLowerCase().includes(query.toLowerCase()),
      );
    }
    return users.map((u) => this.mapWithVip(u));
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @Post('me/avatar')
  @ApiOperation({ summary: 'Upload an avatar for the currently authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'The updated user with new avatar',
    type: CreateUserDto,
  })
  async uploadAvatar(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UserWithVip> {
    const avatarUrl = await this.usersService.uploadAvatarToS3(file);
    const user = await this.usersService.uploadAvatar(req.user.id, avatarUrl);
    return this.mapWithVip(user);
  }

  private mapWithVip(user: any): UserWithVip {
    const now = new Date();
    const vip_active = !!(user.vip_expires_at && user.vip_expires_at > now);
    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar: user.avatar,
      phone: user.phone,
      email: user.email,
      balance_rub: Number(user.balance_rub),
      balance_bonus: Number(user.balance_bonus),
      role: user.role,
      vip_active,
      vip_expires_at: user.vip_expires_at,
    };
  }
}
