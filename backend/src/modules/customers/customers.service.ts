import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { CustomerStatus, CustomerType } from '@prisma/client';

export interface CustomerQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: CustomerStatus;
  customerType?: CustomerType;
}

export class CustomersService {
  static async getAll(options: CustomerQueryOptions) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.status) {
      where.status = options.status;
    }

    if (options.customerType) {
      where.customerType = options.customerType;
    }

    if (options.search && options.search.trim() !== '') {
      const query = options.search.trim();
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { mobile: { contains: query, mode: 'insensitive' } },
        { businessName: { contains: query, mode: 'insensitive' } },
        { gstNumber: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { followups: true, challans: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  static async getById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followups: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
        challans: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            challanNumber: true,
            totalQuantity: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundError(`Customer with ID '${id}' not found`);
    }

    return customer;
  }

  static async create(data: any) {
    const { name, mobile, email, businessName, gstNumber, customerType, address, status, followUpDate, notes } = data;

    if (!name || !mobile || !email || !businessName || !address) {
      throw new BadRequestError('Required fields missing: name, mobile, email, businessName, address are mandatory');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestError('Invalid email format');
    }

    // Enum validation
    if (customerType && !Object.values(CustomerType).includes(customerType)) {
      throw new BadRequestError(`Invalid customerType. Allowed values: ${Object.values(CustomerType).join(', ')}`);
    }

    if (status && !Object.values(CustomerStatus).includes(status)) {
      throw new BadRequestError(`Invalid status. Allowed values: ${Object.values(CustomerStatus).join(', ')}`);
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        mobile,
        email: email.toLowerCase().trim(),
        businessName,
        gstNumber: gstNumber || null,
        customerType: customerType || CustomerType.RETAIL,
        address,
        status: status || CustomerStatus.LEAD,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes: notes || null,
      },
    });

    return customer;
  }

  static async update(id: string, data: any) {
    await this.getById(id);

    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new BadRequestError('Invalid email format');
      }
      data.email = data.email.toLowerCase().trim();
    }

    if (data.customerType && !Object.values(CustomerType).includes(data.customerType)) {
      throw new BadRequestError(`Invalid customerType. Allowed values: ${Object.values(CustomerType).join(', ')}`);
    }

    if (data.status && !Object.values(CustomerStatus).includes(data.status)) {
      throw new BadRequestError(`Invalid status. Allowed values: ${Object.values(CustomerStatus).join(', ')}`);
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        ...data,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
      },
    });

    return updatedCustomer;
  }

  static async delete(id: string) {
    await this.getById(id);

    // Check if customer has challans before deleting
    const challanCount = await prisma.challan.count({
      where: { customerId: id },
    });

    if (challanCount > 0) {
      throw new BadRequestError('Cannot delete customer with existing sales challans. Consider setting status to INACTIVE instead.');
    }

    await prisma.customer.delete({
      where: { id },
    });

    return { id };
  }

  static async addFollowUp(customerId: string, createdById: string, notes: string, followUpDate?: string) {
    await this.getById(customerId);

    if (!notes || notes.trim() === '') {
      throw new BadRequestError('Follow-up notes cannot be empty');
    }

    const dateToSet = followUpDate ? new Date(followUpDate) : new Date(Date.now() + 86400000 * 3);

    const [followUp] = await prisma.$transaction([
      prisma.followUp.create({
        data: {
          customerId,
          notes,
          followUpDate: dateToSet,
          createdById,
        },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      // Automatically update the customer's latest followUpDate
      prisma.customer.update({
        where: { id: customerId },
        data: { followUpDate: dateToSet },
      }),
    ]);

    return followUp;
  }
}
