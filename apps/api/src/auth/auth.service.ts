import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { teacher: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      teacherId: user.teacherId,
    };

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName || user.teacher?.fullName,
        teacherId: user.teacherId,
      },
    };
  }

  async register(dto: {
    email: string;
    password: string;
    role: string;
    fullName?: string;
    teacherId?: string;
  }) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        role: dto.role as any,
        fullName: dto.fullName,
        teacherId: dto.teacherId,
      },
      include: { teacher: true },
    });

    const { password: _, ...result } = user;
    return result;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        teacherId: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        teacher: {
          select: {
            id: true,
            fullName: true,
            position: true,
            school: {
              select: {
                id: true,
                schoolName: true,
                province: true,
                region: true,
              },
            },
          },
        },
      },
    });

    return user;
  }
}
