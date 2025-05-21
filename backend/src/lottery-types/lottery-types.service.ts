import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLotteryTypeDto } from './dto/create-lottery-type.dto';
import { UpdateLotteryTypeDto } from './dto/update-lottery-type.dto';
import { LotteryType } from 'src/entities/lottery-type.entity';

@Injectable()
export class LotteryTypesService implements OnModuleInit {
  constructor(
    @InjectRepository(LotteryType)
    private readonly repo: Repository<LotteryType>,
  ) {}

  async onModuleInit() {
    const count = await this.repo.count();
    if (!count) {
      await this.repo.save([
        { name: '6 из 45', description: 'Шаг: выбрать 6 чисел из 45' },
        { name: '5 из 36', description: 'Шаг: выбрать 5 чисел из 36' },
        { name: '4 из 20', description: 'Шаг: выбрать 4 числа из 20' },
      ]);
    }
  }

  create(dto: CreateLotteryTypeDto): Promise<LotteryType> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  findAll(): Promise<LotteryType[]> {
    return this.repo.find();
  }

  async findOne(id: number): Promise<LotteryType> {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) throw new NotFoundException(`LotteryType #${id} not found`);
    return found;
  }

  async update(id: number, dto: UpdateLotteryTypeDto): Promise<LotteryType> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async remove(id: number): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`LotteryType #${id} not found`);
    }
  }
}
