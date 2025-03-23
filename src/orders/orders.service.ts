import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from 'src/config';
import { ChangeOrderStatusDto, OrderPaginationDto } from './dto';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('OrdersServices');

  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
  ) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  async create(createOrderDto: CreateOrderDto) {
    try {
      //1 Confirmar los ids de los productos
      const productIds = createOrderDto.items.map((item) => item.productId);
      //* llama al microservicio products
      const products: any[] = await firstValueFrom(
        this.client.send({ cmd: 'validate_products' }, productIds),
      );

      //2. Cálculos de los valores
      const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {
        const price = products.find(
          (product) => product.id === orderItem.productId,
        ).price;
        return price * orderItem.quantity;
      }, 0);

      const totalItems = createOrderDto.items.reduce((acc, orderItem) => {
        return acc + orderItem.quantity;
      }, 0);

      //3. Crear una transacción de base de datos
      const order = await this.order.create({
        data: {
          totalAmount: totalAmount,
          totalItems: totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map((orderItem) => ({
                price: products.find(
                  (product) => product.id === orderItem.productId,
                ).price,
                productId: orderItem.productId,
                quantity: orderItem.quantity,
              })),
            },
          },
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            },
          },
        },
      });

      return {
        ...order,
        OrderItem: order.OrderItem.map((orderItem) => ({
          ...orderItem,
          name: products.find((product) => product.id === orderItem.productId)
            .name,
        })),
      };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Check logs',
      });
    }
  }

  async findAll(orderPaginationDto: OrderPaginationDto) {
    // $transaction para mejorar el rendimiento
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
      include: {
        OrderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true,
          },
        },
      },
    });
    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order by id ${id} not found`,
      });
    }

    const productsIds = order.OrderItem.map((orderItem) => orderItem.productId);
    const products: any[] = await firstValueFrom(
      this.client.send({ cmd: 'validate_products' }, productsIds),
    );

    return {
      ...order,
      OrderItem: order.OrderItem.map((orderItem) => ({
        ...orderItem,
        name: products.find((product) => product.id === orderItem.productId)
          .name,
      })),
    };
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
