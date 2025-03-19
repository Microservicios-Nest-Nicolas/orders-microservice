import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { ChangeOrderStatusDto, OrderPaginationDto } from './dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('OrdersServices');
  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  create(createOrderDto: CreateOrderDto) {
    const newOrder = this.order.create({
      data: createOrderDto,
    });
    return newOrder;
  }

  async findAll(orderPaginationDto: OrderPaginationDto) {
    // $trsansaction para mejorar el rendimiento
    const [orders, totalPages] = await this.$transaction([
      this.order.findMany({
        skip: (orderPaginationDto.page - 1) * orderPaginationDto.limit,
        take: orderPaginationDto.limit,
        where: {
          status: orderPaginationDto.status,
        },
      }),
      this.order.count({
        where: {
          status: orderPaginationDto.status,
        },
      }),
    ]);

    return {
      data: orders,
      meta: {
        totalPages: totalPages,
        page: orderPaginationDto.page,
        lastPage: Math.ceil(totalPages / orderPaginationDto.limit),
      },
    };
  }

  async findOne(id: string) {
    const order = await this.order.findFirst({
      where: { id: id },
    });
    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order by id ${id} not found`,
      });
    }
    return order;
  }

  async changeOrderStatus(changeOrderStatusDto: ChangeOrderStatusDto) {
    const { id, status } = changeOrderStatusDto;

    const order = await this.findOne(id);
    if (order.status === status) {
      return order;
    }
    return this.order.update({
      where: { id },
      data: { status },
    });
  }
}
