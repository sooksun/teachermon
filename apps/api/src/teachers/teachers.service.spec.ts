import { Test, TestingModule } from '@nestjs/testing';
import { TeachersService } from './teachers.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TeachersService', () => {
  let service: TeachersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    teacher: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    mentoringVisit: {
      count: jest.fn(),
    },
    reflectiveJournal: {
      count: jest.fn(),
    },
    pLCActivity: {
      count: jest.fn(),
    },
    competencyAssessment: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeachersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TeachersService>(TeachersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated teachers', async () => {
      const mockTeachers = [
        {
          id: '1',
          fullName: 'Test Teacher',
          citizenId: '1234567890123',
          school: { schoolName: 'Test School' },
        },
      ];

      mockPrismaService.teacher.findMany.mockResolvedValue(mockTeachers);
      mockPrismaService.teacher.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockTeachers);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a teacher by id', async () => {
      const mockTeacher = {
        id: '1',
        fullName: 'Test Teacher',
        school: {},
      };

      mockPrismaService.teacher.findUnique.mockResolvedValue(mockTeacher);

      const result = await service.findOne('1');

      expect(result).toEqual(mockTeacher);
    });

    it('should throw NotFoundException if teacher not found', async () => {
      mockPrismaService.teacher.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow('Teacher with ID invalid-id not found');
    });
  });
});
