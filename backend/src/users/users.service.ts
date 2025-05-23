import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { Role } from 'src/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as FormData from 'form-data';
import axios from 'axios';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
  ) {}

  async createUser(userDto: CreateUserDto): Promise<User> {
    Object.keys(userDto).forEach((key) => {
      if (userDto[key] === undefined || userDto[key] === null || userDto[key] === '') {
        delete userDto[key];
      }
    });

    if (!userDto.first_name || !userDto.last_name) {
      throw new BadRequestException('First name and last name are required');
    }

    if (!userDto.email && !userDto.phone) {
      throw new BadRequestException('Either email or phone must be provided');
    }

    if (userDto.email && (await this.findByEmail(userDto.email))) {
      throw new BadRequestException('Email already registered');
    }

    if (userDto.phone && (await this.findByPhone(userDto.phone))) {
      throw new BadRequestException('Phone already registered');
    }

    if (!userDto?.password) {
      throw new BadRequestException('Password is required');
    }

    if (userDto.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }

    const user = this.userRepo.create({
      ...userDto,
      password_hash: userDto.password,
    });

    return this.userRepo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { phone } });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { id }, relations: ['role'] });
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find({ relations: ['role'] });
  }

  async update(id: number, updateUserDto: Partial<User>): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return await this.userRepo.save({ ...user, ...updateUserDto });
  }

  async remove(id: number): Promise<void> {
    await this.userRepo.delete(id);
  }

  async assignRole(userId: number, roleId: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) {
      throw new BadRequestException('Role not found');
    }

    user.role = role;
    return this.userRepo.save(user);
  }

  async uploadAvatar(userId: number, imgUrl: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!imgUrl) {
      throw new BadRequestException('Image URL is required');
    }

    user.avatar = imgUrl;
    return this.userRepo.save(user);
  }

  async uploadAvatarToS3(file: Express.Multer.File): Promise<string> {
    const S3_URL = process.env.S3_URL;
    const TOKEN = process.env.S3_UPLOAD_TOKEN;

    if (!S3_URL || !TOKEN) {
      throw new BadRequestException('S3_URL or token not set');
    }

    if (!file || !file.buffer) {
      throw new BadRequestException('Файл не получен');
    }

    const form = new FormData();
    form.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    try {
      const response = await axios.post(S3_URL, form, {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          ...form.getHeaders(),
        },
        responseType: 'text',
      });

      return response.data;
    } catch (error) {
      const message = error.response?.data || error.message;
      console.error('S3 upload failed:', message);
      throw new BadRequestException('Upload failed: ' + message);
    }
  }

  async searchUsersByName(query: string) {
    console.log('searchUsersByName called with query:', query);
    if (!query?.trim()) {
      console.log('Empty or invalid query, returning empty array');
      return [];
    }

    const users = await this.userRepo.find({
      where: [{ first_name: ILike(`%${query}%`) }, { last_name: ILike(`%${query}%`) }],
    });
    console.log('Users found:', users);

    const result = users.map((u) => ({
      id: u.id,
      name: `${u.first_name} ${u.last_name}`.trim(),
      avatar: u?.avatar,
    }));
    console.log('Mapped result:', result);

    return result;
  }

  /**
   * Списать указанную сумму в рублях с баланса пользователя.
   * Бросает BadRequestException, если пользователя нет или недостаточно средств.
   */
  async debitRub(userId: number, amount: number): Promise<void> {
    if (amount <= 0) {
      throw new BadRequestException('Сумма списания должна быть положительной');
    }
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }
    if ((user.balance_rub ?? 0) < amount) {
      throw new BadRequestException('Недостаточно средств на балансе');
    }
    user.balance_rub = (user.balance_rub ?? 0) - amount;
    await this.userRepo.save(user);
  }

  /**
   * Пополнить баланс пользователя на указанную сумму в рублях.
   * Бросает BadRequestException, если пользователя нет или сумма некорректна.
   */
  async creditRub(userId: number, amount: number): Promise<User> {
    if (amount <= 0) {
      throw new BadRequestException('Сумма пополнения должна быть положительной');
    }
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }
    user.balance_rub = (user.balance_rub ?? 0) + amount;
    return this.userRepo.save(user);
  }
}
