// src/lotteries/lotteries.service.ts
import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLotteryDto } from './dto/create-lottery.dto';
import { UpdateLotteryDto } from './dto/update-lottery.dto';
import { Lottery } from 'src/entities/lottery.entity';
import { LotteryType } from 'src/entities/lottery-type.entity';
import axios from 'axios';
import * as FormData from 'form-data';
import { FilterLotteryDto } from './dto/filter-lottery.dto';

@Injectable()
export class LotteriesService implements OnModuleInit {
  constructor(
    @InjectRepository(Lottery)
    private readonly lottoRepo: Repository<Lottery>,
    @InjectRepository(LotteryType)
    private readonly typeRepo: Repository<LotteryType>,
  ) {}

  // Сидинг базовых лотерей
  async onModuleInit() {
    const count = await this.lottoRepo.count();
    if (!count) {
      const types = await this.typeRepo.find();
      const seeds: Partial<Lottery>[] = [];

      const type6 = types.find((t) => t.name.includes('6 из 45'));
      if (type6) {
        seeds.push({
          name: 'Loto 6/45',
          description: 'Классическая 6 из 45',
          numbersTotal: 45,
          numbersDrawn: 6,
          basePrice: 2.0,
          type: type6,
        });
      }
      const type5 = types.find((t) => t.name.includes('5 из 36'));
      if (type5) {
        seeds.push({
          name: 'Loto 5/36',
          description: 'Популярная 5 из 36',
          numbersTotal: 36,
          numbersDrawn: 5,
          basePrice: 1.5,
          type: type5,
        });
      }
      const type4 = types.find((t) => t.name.includes('4 из 20'));
      if (type4) {
        seeds.push({
          name: 'Loto 4/20',
          description: 'Быстрая 4 из 20',
          numbersTotal: 20,
          numbersDrawn: 4,
          basePrice: 1.0,
          type: type4,
        });
      }

      if (seeds.length) {
        await this.lottoRepo.save(seeds as Lottery[]);
      }
    }
  }

  create(dto: CreateLotteryDto): Promise<Lottery> {
    const lottery = this.lottoRepo.create({
      name: dto.name,
      description: dto.description,
      numbersTotal: dto.numbersTotal,
      numbersDrawn: dto.numbersDrawn,
      basePrice: dto.basePrice,
      type: { id: dto.lotteryTypeId } as LotteryType,
    });
    return this.lottoRepo.save(lottery);
  }

  // findAll(): Promise<Lottery[]> {
  //   return this.lottoRepo.find({ relations: ['type'] });
  // }
  async findAll(filter?: FilterLotteryDto): Promise<Lottery[]> {
    const qb = this.lottoRepo
      .createQueryBuilder('lottery')
      .leftJoinAndSelect('lottery.type', 'type');

    if (filter) {
      if (filter.isSouvenir !== undefined) {
        // строка "true"/"false"
        const flag = filter.isSouvenir === 'true';
        qb.andWhere('lottery.isSouvenir = :flag', { flag });
      }
      if (filter.souvenirCityCode) {
        qb.andWhere('lottery.souvenirCityCode = :code', { code: filter.souvenirCityCode });
      }
      if (filter.lotteryTypeId) {
        qb.andWhere('type.id = :typeId', { typeId: filter.lotteryTypeId });
      }
      if (filter.name) {
        qb.andWhere('lottery.name ILIKE :name', { name: `%${filter.name}%` });
      }
    }

    return qb.getMany();
  }

  async findOne(id: number): Promise<Lottery> {
    const lottery = await this.lottoRepo.findOne({ where: { id }, relations: ['type'] });
    if (!lottery) throw new NotFoundException(`Lottery #${id} not found`);
    return lottery;
  }

  async update(id: number, dto: UpdateLotteryDto): Promise<Lottery> {
    const lottery = await this.findOne(id);
    Object.assign(lottery, dto);
    // если меняется тип, нужно установить связь
    if (dto.lotteryTypeId) {
      lottery.type = (await this.typeRepo.findOne({ where: { id: dto.lotteryTypeId } }))!;
    }
    return this.lottoRepo.save(lottery);
  }

  async remove(id: number): Promise<void> {
    const result = await this.lottoRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Lottery #${id} not found`);
    }
  }
  async uploadCityImageToS3(file: Express.Multer.File): Promise<string> {
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
      // Предполагаем, что сервис возвращает публичный URL
      return response.data;
    } catch (error) {
      const msg = error.response?.data || error.message;
      console.error('S3 upload failed:', msg);
      throw new BadRequestException('Upload failed: ' + msg);
    }
  }

  createSouvenir(dto: CreateLotteryDto): Promise<Lottery> {
    if (dto.isSouvenir && !dto.souvenirCityCode) {
      throw new BadRequestException('Для сувенирной лотереи нужен souvenirCityCode');
    }
    const lottery = this.lottoRepo.create({
      ...dto,
      isSouvenir: dto.isSouvenir,
      souvenirCityCode: dto.souvenirCityCode,
      imageUrl: dto.imageUrl,
    });
    return this.lottoRepo.save(lottery);
  }
}
