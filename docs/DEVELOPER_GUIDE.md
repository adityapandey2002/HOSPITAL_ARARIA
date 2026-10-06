# DH Araria Hospital Portal - Developer Guide

## Overview

This guide provides comprehensive information for developers working on the DH Araria Hospital Portal monorepo.

## Project Structure

```
dh-araria/
├── apps/
│   ├── frontend/          # Next.js 14 + React 18 + TypeScript
│   └── backend/           # NestJS 10 + TypeScript + Prisma
├── packages/
│   ├── shared/            # Shared types, constants, utilities
│   └── ui/                # Reusable UI components (Tailwind + Radix)
├── docs/                  # Documentation
├── docker-compose.yml     # Local development
├── package.json           # Root workspace config
└── turbo.json             # Turborepo config (if using)
```

## Getting Started

### Prerequisites

- Node.js 20.0.0+
- npm 10+ (or pnpm/yarn)
- PostgreSQL 15+ (local or Docker)
- Redis 7+ (local or Docker)
- Git

### IDE Setup

#### VS Code Extensions (Recommended)

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "usernamehw.errorlens",
    "streetsidesoftware.code-spell-checker",
    "ms-azuretools.vscode-docker"
  ]
}
```

#### Settings (`.vscode/settings.json`)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local

# 3. Start databases
docker-compose up -d postgres redis

# 4. Initialize backend
cd apps/backend
npm run db:generate
npm run db:push
npm run db:seed

# 5. Start development servers
cd ../..
npm run dev
```

---

## Development Workflow

### Branch Strategy

```
main (protected)
  ├── develop (integration branch)
  │   ├── feature/JIRA-123-appointment-booking
  │   ├── feature/JIRA-124-doctor-search
  │   └── fix/JIRA-125-login-error
  ├── release/v1.1.0
  └── hotfix/JIRA-126-security-patch
```

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `docs` - Documentation
- `test` - Tests
- `chore` - Maintenance
- `style` - Formatting
- `perf` - Performance
- `ci` - CI/CD

**Examples:**
```
feat(appointments): add teleconsultation booking option
fix(auth): resolve token refresh race condition
docs(api): update Swagger documentation for blood bank endpoints
refactor(doctors): extract time slot logic to service
```

### Pull Request Process

1. **Create feature branch** from `develop`
2. **Implement changes** with tests
3. **Run quality checks** locally:
   ```bash
   npm run lint
   npm run type-check  # frontend only
   npm run test
   ```
4. **Push and create PR** to `develop`
5. **PR Requirements:**
   - ✅ All CI checks pass
   - ✅ At least 1 approval
   - ✅ No merge conflicts
   - ✅ Tests added/updated
   - ✅ Documentation updated
5. **Squash and merge** to `develop`

### Code Review Guidelines

- **Focus on:** Logic, security, accessibility, performance
- **Check:** Tests, types, error handling, edge cases
- **Suggest:** Improvements, not just issues
- **Approve:** When confident in correctness

---

## Frontend Development (Next.js)

### Project Structure

```
apps/frontend/
├── src/
│   ├── app/                    # App Router pages
│   │   ├── (auth)/            # Auth group (login, register)
│   │   ├── (main)/            # Main layout group
│   │   ├── api/               # API routes (if needed)
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # Page-level components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   └── ...
│   ├── context/               # React contexts
│   │   ├── AuthContext.tsx
│   │   └── LanguageContext.tsx
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Utilities, API client
│   │   └── api.ts
│   ├── styles/                # Global styles
│   │   └── globals.css
│   └── types/                 # Frontend-only types
├── public/                    # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── jest.config.js
```

### Component Development

#### Creating a New Component

```tsx
// apps/frontend/src/components/MyComponent.tsx
'use client';

import { forwardRef } from 'react';
import { cn } from '@dh-araria/shared/utils';

interface MyComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export const MyComponent = forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary-600 text-white',
      secondary: 'bg-secondary-600 text-white',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg font-medium transition-colors',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

MyComponent.displayName = 'MyComponent';
```

#### Component Best Practices

1. **Use TypeScript** - Define props interface
2. **Forward refs** - For DOM access
3. **Use `cn` utility** - For className merging
4. **Accessibility first** - ARIA, semantic HTML
5. **Responsive design** - Mobile-first Tailwind
6. **Client components only when needed** - `'use client'`

### State Management

#### Context Pattern (Auth, Language)

```tsx
// apps/frontend/src/context/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // ... implementation
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

#### Server State (SWR/TanStack Query)

```tsx
// apps/frontend/src/hooks/useDoctors.ts
import useSWR from 'swr';
import { api } from '@/lib/api';

export function useDoctors(params?: DoctorFilters) {
  const { data, error, isLoading, mutate } = useSWR(
    ['doctors', params],
    () => api.getDoctors(params)
  );

  return {
    doctors: data?.data || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
```

### API Integration

```typescript
// apps/frontend/src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor (token refresh)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        await refreshToken();
        return api(error.config);
      } catch {
        logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Styling with Tailwind

#### Design Tokens (tailwind.config.ts)

```typescript
// apps/frontend/tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: { 50: '#f0f9ff', ..., 900: '#0c4a6e' },
        secondary: { 50: '#fdf4ff', ..., 900: '#701a75' },
        success: { 50: '#f0fdf4', 500: '#22c55e', 600: '#16a34a' },
        warning: { 50: '#fffbeb', 500: '#f59e0b', 600: '#d97706' },
        danger: { 50: '#fef2f2', 500: '#ef4444', 600: '#dc2626' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};
```

#### Utility Classes

```tsx
// Use design tokens
<div className="bg-primary-600 text-white hover:bg-primary-700">
<button className="text-danger-600 hover:text-danger-700">

// Responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Dark mode
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">

// Accessibility
<button className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
```

### Testing

```bash
# Run tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

```tsx
// Example test
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@dh-araria/ui/components';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

---

## Backend Development (NestJS)

### Project Structure

```
apps/backend/
├── src/
│   ├── main.ts                 # Application entry
│   ├── app.module.ts           # Root module
│   ├── config/                 # Configuration
│   │   ├── configuration.ts
│   │   └── validation.ts
│   ├── common/                 # Shared utilities
│   │   ├── prisma/             # Prisma service
│   │   ├── auth/               # JWT strategy, guards
│   │   ├── decorators/         # Custom decorators
│   │   ├── filters/            # Exception filters
│   │   ├── interceptors/       # Response/logging interceptors
│   │   ├── guards/             # Auth/role guards
│   │   └── dto/                # Common DTOs
│   └── modules/                # Feature modules
│       ├── auth/
│       ├── users/
│       ├── doctors/
│       ├── departments/
│       ├── appointments/
│       ├── blood-bank/
│       ├── grievances/
│       ├── notices/
│       └── health/
├── prisma/
│   └── schema.prisma           # Database schema
├── test/                       # E2E tests
├── package.json
├── tsconfig.json
└── nest-cli.json
```

### Creating a Module

```bash
# Generate module structure
nest g module modules/new-feature
nest g controller modules/new-feature
nest g service modules/new-feature
nest g dto modules/new-feature/create.dto
nest g dto modules/new-feature/update.dto
```

### Module Structure

```
modules/new-feature/
├── dto/
│   ├── create-new-feature.dto.ts
│   ├── update-new-feature.dto.ts
│   └── new-feature-query.dto.ts
├── interfaces/
│   └── new-feature.interface.ts
├── new-feature.controller.ts
├── new-feature.service.ts
├── new-feature.module.ts
└── new-feature.service.spec.ts
```

### Controller Example

```typescript
// modules/new-feature/new-feature.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { NewFeatureService } from './new-feature.service';
import { CreateNewFeatureDto } from './dto/create-new-feature.dto';
import { UpdateNewFeatureDto } from './dto/update-new-feature.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '@dh-araria/shared/types';

@ApiTags('New Feature')
@Controller('new-feature')
export class NewFeatureController {
  constructor(private readonly newFeatureService: NewFeatureService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all items' })
  async findAll(@Query() pagination: PaginationDto) {
    return this.newFeatureService.findAll(pagination);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get item by ID' })
  async findById(@Param('id') id: string) {
    return this.newFeatureService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new item (Admin only)' })
  async create(@Body() data: CreateNewFeatureDto, @CurrentUser('id') userId: string) {
    return this.newFeatureService.create(data, userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update item (Admin only)' })
  async update(@Param('id') id: string, @Body() data: UpdateNewFeatureDto) {
    return this.newFeatureService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete item (Admin only)' })
  async delete(@Param('id') id: string) {
    return this.newFeatureService.delete(id);
  }
}
```

### Service Example

```typescript
// modules/new-feature/new-feature.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateNewFeatureDto } from './dto/create-new-feature.dto';
import { UpdateNewFeatureDto } from './dto/update-new-feature.dto';

@Injectable()
export class NewFeatureService {
  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.newFeature.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.newFeature.count(),
    });

    return {
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const item = await this.prisma.newFeature.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  async create(data: CreateNewFeatureDto, userId: string) {
    const existing = await this.prisma.newFeature.findUnique({
      where: { uniqueField: data.uniqueField },
    });
    if (existing) throw new ConflictException('Item already exists');

    return this.prisma.newFeature.create({
      data: { ...data, createdById: userId },
    });
  }

  async update(id: string, data: UpdateNewFeatureDto) {
    await this.findById(id);
    return this.prisma.newFeature.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.newFeature.delete({ where: { id } });
  }
}
```

### DTOs with Validation

```typescript
// modules/new-feature/dto/create-new-feature.dto.ts
import { IsString, MinLength, MaxLength, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNewFeatureDto {
  @ApiProperty({ example: 'Item Name' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'Description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: ['TYPE_A', 'TYPE_B'] })
  @IsEnum(['TYPE_A', 'TYPE_B'])
  type: 'TYPE_A' | 'TYPE_B';
}
```

### Database (Dual-ORM: Drizzle + MikroORM)

We use a **Dual-ORM Strategy** based on service domain requirements:

| ORM | Use Case | Services |
|-----|----------|----------|
| **Drizzle ORM** | Citizen-Facing (High traffic, simple queries) | Homepage, Doctor Directory, Basic Appointments, Grievances, Blood Bank, Notices |
| **MikroORM** | Clinical & ABDM (Complex transactions, audit trails) | ABDM M2/M3, Clinical Records, FHIR Bundles, Consent Management |

Both ORMs connect to the same PostgreSQL 15+ database. PostgreSQL's native `JSONB` columns store FHIR R4 bundles for ABDM integration.

#### Drizzle ORM (Citizen-Facing Services)

**Location**: `apps/backend/src/common/drizzle/`

```typescript
// drizzle.module.ts
import { Module, Global } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

@Global()
@Module({
  providers: [
    {
      provide: 'DRIZZLE',
      useFactory: () => {
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        return drizzle(pool, { schema });
      },
    },
  ],
  exports: ['DRIZZLE'],
})
export class DrizzleModule {}
```

```typescript
// Schema definition (drizzle/schema.ts)
import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['PATIENT', 'DOCTOR', 'ADMIN', 'STAFF']);
export const appointmentStatusEnum = pgEnum('appointment_status', ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'RESCHEDULED']);
export const appointmentTypeEnum = pgEnum('appointment_type', ['OPD', 'TELECONSULTATION', 'EMERGENCY', 'FOLLOW_UP']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).unique(),
  role: userRoleEnum('role').default('PATIENT').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  abhaId: varchar('abha_id', { length: 50 }).unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').references(() => users.id).notNull(),
  doctorId: uuid('doctor_id').references(() => doctors.id).notNull(),
  departmentId: uuid('department_id').references(() => departments.id).notNull(),
  appointmentDate: timestamp('appointment_date').notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(),
  endTime: varchar('end_time', { length: 5 }).notNull(),
  status: appointmentStatusEnum('status').default('PENDING').notNull(),
  type: appointmentTypeEnum('type').default('OPD').notNull(),
  reason: text('reason'),
  notes: text('notes'),
  abhaId: varchar('abha_id', { length: 50 }),
  tokenNumber: integer('token_number'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Usage in service
import { Inject, Injectable } from '@nestjs/common';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { appointments, doctors, timeSlots } from '../common/drizzle/schema';

@Injectable()
export class PublicAppointmentService {
  constructor(@Inject('DRIZZLE') private db: DrizzleDb) {}

  async findAvailableSlots(doctorId: string, date: Date) {
    const dayOfWeek = date.getDay();
    return this.db
      .select()
      .from(timeSlots)
      .where(
        and(
          eq(timeSlots.doctorId, doctorId),
          eq(timeSlots.dayOfWeek, dayOfWeek),
          eq(timeSlots.isAvailable, true)
        )
      );
  }
}
```

**Key Benefits**: Zero abstraction overhead, type-safe SQL, ~10KB bundle, native pg pool.

#### MikroORM (Clinical & ABDM Services)

**Location**: `apps/backend/src/common/mikro/`

```typescript
// mikro.module.ts
import { Module, Global } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { EntityGenerator } from '@mikro-orm/entity-generator';

@Global()
@Module({
  providers: [
    {
      provide: 'MIKRO_ORM',
      useFactory: async () => {
        return await MikroORM.init({
          entities: ['dist/**/*.entity.js'],
          entitiesTs: ['src/**/*.entity.ts'],
          dbName: process.env.DB_NAME,
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT || '5432'),
          user: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          debug: process.env.NODE_ENV === 'development',
          extensions: [EntityGenerator],
        });
      },
    },
  ],
  exports: ['MIKRO_ORM'],
})
export class MikroModule {}
```

```typescript
// Clinical Entity with Lifecycle Hooks for CERT-In Audit Logging
// apps/backend/src/modules/abdm/entities/fhir-bundle.entity.ts
import { Entity, Property, PrimaryKey, Index, EntityRepositoryType, OnCreate, OnUpdate, OnDelete } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/core';
import { AuditLogService } from '../../common/audit/audit-log.service';

@Entity({ tableName: 'fhir_bundles' })
export class FhirBundle {
  @PrimaryKey()
  id: string;

  @Property({ unique: true })
  bundleId: string;

  @Property()
  resourceType: string = 'Bundle';

  @Property()
  bundleType: string;

  @Property()
  patientId: string;

  @Property({ nullable: true })
  careContextId?: string;

  @Property({ type: 'jsonb' })
  fhirJson: any;

  @Property({ nullable: true })
  encryptedData?: string;

  @Property({ nullable: true })
  encryptionKey?: string;

  @Property({ default: 'PENDING' })
  status: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Index()
  patientIdIdx: string;

  @Index()
  careContextIdIdx: string;

  @Index()
  statusIdx: string;

  // MikroORM Lifecycle Hooks for CERT-In Audit Compliance
  @OnCreate()
  async onCreate(em: EntityManager) {
    await AuditLogService.log({
      action: 'FHIR_BUNDLE_CREATE',
      resource: 'FhirBundle',
      resourceId: this.id,
      details: { bundleId: this.bundleId, patientId: this.patientId },
    });
  }

  @OnUpdate()
  async onUpdate(em: EntityManager) {
    await AuditLogService.log({
      action: 'FHIR_BUNDLE_UPDATE',
      resource: 'FhirBundle',
      resourceId: this.id,
      details: { bundleId: this.bundleId, status: this.status },
    });
  }

  @OnDelete()
  async onDelete(em: EntityManager) {
    await AuditLogService.log({
      action: 'FHIR_BUNDLE_DELETE',
      resource: 'FhirBundle',
      resourceId: this.id,
      details: { bundleId: this.bundleId },
    });
  }

  [EntityRepositoryType]?: EntityRepository<FhirBundle>;
}
```

**Key Benefits**: Unit of Work (atomic transactions), Identity Map, Lifecycle Hooks (CERT-In audit logging), Change Tracking, Explicit Transaction Control.

#### ORM Selection Guide

| Module / Service | ORM | Reason |
|------------------|-----|--------|
| Homepage / Landing Page | Drizzle | High traffic, simple queries |
| Doctor Directory | Drizzle | Read-heavy, public access |
| Basic Appointment Booking | Drizzle | High concurrency, simple CRUD |
| Grievance Submission | Drizzle | Public-facing, moderate traffic |
| Blood Bank Inventory | Drizzle | Real-time polling, simple reads |
| Notices / Announcements | Drizzle | Read-heavy, public |
| **ABDM M2 (HIP)** | **MikroORM** | FHIR bundles, Fidelius encryption, atomic transactions |
| **ABDM M3 (HIU)** | **MikroORM** | Consent management, audit trails |
| **Clinical Records** | **MikroORM** | Complex transactions, audit logging |
| **FHIR Bundle Encryption** | **MikroORM** | ECDH + AES-GCM, lifecycle hooks |

#### Database Commands

```bash
# Drizzle migrations
cd apps/backend
npm run db:generate     # Generate Drizzle migrations
npm run db:migrate      # Run Drizzle migrations
npm run db:push         # Push schema directly (dev only)
npm run db:studio       # Open Drizzle Studio

# MikroORM
npm run mikro:generate  # Generate entities
npm run mikro:migrate   # Run MikroORM migrations
npm run mikro:schema    # Update schema

# Shared PostgreSQL (docker-compose)
docker-compose up -d postgres
```

#### Query Examples

**Drizzle (Citizen-Facing)**:
```typescript
// Complex query with relations
const appointments = await db
  .select()
  .from(appointments)
  .where(
    and(
      eq(appointments.doctorId, doctorId),
      gte(appointments.appointmentDate, new Date()),
      inArray(appointments.status, ['PENDING', 'CONFIRMED'])
    )
  )
  .leftJoin(patients, eq(appointments.patientId, patients.id))
  .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
  .orderBy(asc(appointments.appointmentDate))
  .limit(20);

// Transaction
await db.transaction(async (tx) => {
  const appointment = await tx.insert(appointments).values(appointmentData).returning();
  await tx.insert(auditLogs).values({ action: 'CREATE', resource: 'Appointment', resourceId: appointment[0].id });
});
```

**MikroORM (Clinical/ABDM)**:
```typescript
// Using Unit of Work for atomic ABDM transactions
const em = mikroORM.em.fork();
const bundle = em.create(FhirBundle, {
  bundleId: generateBundleId(),
  patientId: patient.id,
  fhirJson: fhirBundle,
  encryptedData: await fidelius.encrypt(fhirBundle),
});
await em.persistAndFlush(bundle); // Atomic with audit hooks

// Explicit transaction for ABDM M3 consent flow
await em.transactional(async (em) => {
  const consent = em.create(ConsentArtefact, consentData);
  await em.persistAndFlush(consent);
  await em.getRepository(FhirBundle).update({ careContextId }, { status: 'CONSENTED' });
});
```

### Authentication & Authorization

```typescript
// Guards
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.DOCTOR)
@ApiBearerAuth()

// Current user
@CurrentUser() user: User
@CurrentUser('id') userId: string

// Public endpoint
@Public()
```

### Error Handling

```typescript
// Custom exceptions
throw new NotFoundException('Doctor not found');
throw new ConflictException('Email already registered');
throw new BadRequestException('Invalid time slot');
throw new ForbiddenException('Not authorized');
throw new UnauthorizedException('Invalid credentials');
```

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

```typescript
// Unit test example (Drizzle ORM - Citizen-Facing Services)
import { Test, TestingModule } from '@nestjs/testing';
import { DoctorsService } from './doctors.service';
import { DrizzleDb } from '../../common/drizzle/drizzle.module';

describe('DoctorsService', () => {
  let service: DoctorsService;
  let db: DrizzleDb;

  const mockDb = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([{ id: '1', name: 'Dr. Test' }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorsService,
        { provide: 'DRIZZLE', useValue: mockDb },
      ],
    }).compile();

    service = module.get<DoctorsService>(DoctorsService);
    db = module.get<DrizzleDb>('DRIZZLE');
  });

  it('should find doctor by ID', async () => {
    const result = await service.findById('1');
    expect(result).toEqual({ id: '1', name: 'Dr. Test' });
  });
});
```

```typescript
// Unit test example (MikroORM - Clinical/ABDM Services)
import { Test, TestingModule } from '@nestjs/testing';
import { FhirBundleService } from './fhir-bundle.service';
import { MikroORM, EntityManager } from '@mikro-orm/core';

describe('FhirBundleService', () => {
  let service: FhirBundleService;
  let orm: MikroORM;
  let em: EntityManager;

  const mockEm = {
    persistAndFlush: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FhirBundleService,
        { provide: 'MIKRO_ORM', useValue: { em: { fork: () => mockEm } } },
      ],
    }).compile();

    service = module.get<FhirBundleService>(FhirBundleService);
    orm = module.get<MikroORM>('MIKRO_ORM');
    em = orm.em.fork();
  });

  it('should create FHIR bundle with audit logging', async () => {
    const bundleData = { bundleId: 'test-bundle', patientId: 'patient-1' };
    await service.create(bundleData);

    expect(mockEm.create).toHaveBeenCalled();
    expect(mockEm.persistAndFlush).toHaveBeenCalled();
  });
});
```

---

## Shared Package Development

### Adding Types

```typescript
// packages/shared/src/types/new-types.ts
export interface NewEntity {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum NewEntityStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}
```

### Adding Constants

```typescript
// packages/shared/src/constants/new-constants.ts
export const NEW_ENTITY_CONFIG = {
  maxNameLength: 100,
  defaultStatus: NewEntityStatus.ACTIVE,
} as const;
```

### Adding Utilities

```typescript
// packages/shared/src/utils/new-utils.ts
export function formatNewEntity(entity: NewEntity): string {
  return `${entity.name} (${entity.id})`;
}
```

### Export

```typescript
// packages/shared/src/index.ts
export * from './types';
export * from './constants';
export * from './utils';
```

### Building

```bash
cd packages/shared
npm run build
```

---

## UI Package Development

### Creating Components

```tsx
// packages/ui/src/components/NewComponent.tsx
'use client';

import { forwardRef } from 'react';
import { cn } from '@dh-araria/shared/utils';

export interface NewComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary';
}

export const NewComponent = forwardRef<HTMLDivElement, NewComponentProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-gray-100 text-gray-900',
      primary: 'bg-primary-600 text-white',
    };

    return (
      <div
        ref={ref}
        className={cn('rounded-lg p-4', variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

NewComponent.displayName = 'NewComponent';
```

### Export

```typescript
// packages/ui/src/components/index.ts
export { NewComponent } from './NewComponent';
export type { NewComponentProps } from './NewComponent';
```

```typescript
// packages/ui/src/index.ts
export * from './components';
export * from './hooks';
export * from './utils';
```

---

## Database Migrations (Dual-ORM)

### Drizzle ORM Migrations (Citizen-Facing)

```bash
# 1. Modify drizzle/schema.ts
# 2. Generate migration
npm run db:generate

# 3. Apply migration
npm run db:migrate

# 4. Or push directly (development only)
npm run db:push

# 4. Open Drizzle Studio
npm run db:studio
```

### MikroORM Migrations (Clinical/ABDM)

```bash
# 1. Modify entity files
# 2. Generate migration
npm run mikro:migration:create descriptive_name

# 3. Run migration
npm run mikro:migrate

# 4. Or update schema directly (development only)
npm run mikro:schema
```

### Migration Best Practices

1. **Always review generated SQL** before applying
2. **Use descriptive names** - `add_user_abha_id`, `create_blood_stock_table`, `add_fhir_bundle_encryption`
3. **Test on staging** before production
4. **Backup before migration** in production
5. **Use transactions** for multi-step migrations
5. **Coordinate Dual-ORM migrations** - ensure Drizzle and MikroORM migrations don't conflict

### Seeding (Dual-ORM)

```typescript
// Drizzle Seed (Citizen-Facing)
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './drizzle/schema';
import * as bcrypt from 'bcrypt';

async function seedDrizzle() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  const adminPassword = await bcrypt.hash('Admin@123', 12);
  await db.insert(schema.users).values({
    email: 'admin@dhararia.gov.in',
    password: adminPassword,
    name: 'System Administrator',
    phone: '+91-6453-222123',
    role: 'ADMIN',
    isActive: true,
  });

  // Seed departments, doctors, blood stock, etc.
}

// MikroORM Seed (Clinical/ABDM)
import { MikroORM } from '@mikro-orm/postgresql';
import { FhirBundle, CareContext, AbhaProfile } from './entities';

async function seedMikro(orm: MikroORM) {
  const em = orm.em.fork();

  // Seed ABDM-related entities if needed
  // Clinical reference data, FHIR profiles, etc.
}
```

### Migration Commands Summary

```bash
# Drizzle (Citizen-Facing)
npm run db:generate     # Generate migrations
npm run db:migrate      # Run migrations
npm run db:push         # Push schema directly (dev only)
npm run db:studio       # Open Drizzle Studio

# MikroORM (Clinical/ABDM)
npm run mikro:generate  # Generate entities
npm run mikro:migrate   # Run migrations
npm run mikro:schema    # Update schema directly (dev only)

# Shared PostgreSQL (docker-compose)
docker-compose up -d postgres
```

---

## Code Quality

### Linting

```bash
# Check all
npm run lint

# Fix auto-fixable
npm run lint -- --fix
```

### Formatting

```bash
# Check
npx prettier --check .

# Fix
npx prettier --write .
```

### Type Checking

```bash
# Frontend
cd apps/frontend && npm run type-check

# Backend (via tsc)
cd apps/backend && npx tsc --noEmit
```

---

## Environment-Specific Config

### Development

```env
NODE_ENV=development
LOG_LEVEL=debug
JWT_ACCESS_EXPIRY=15m
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dh_araria
```

### Staging

```env
NODE_ENV=staging
LOG_LEVEL=info
JWT_ACCESS_EXPIRY=15m
DATABASE_URL=postgresql://user:pass@staging-db:5432/dh_araria
```

### Production

```env
NODE_ENV=production
LOG_LEVEL=warn
JWT_ACCESS_EXPIRY=15m
DATABASE_URL=postgresql://user:pass@prod-db:5432/dh_araria
# Use secrets for sensitive values
```

---

## Debugging

### Frontend

```bash
# VS Code launch.json
{
  "type": "chrome",
  "request": "launch",
  "name": "Next.js: Chrome",
  "url": "http://localhost:3000",
  "webRoot": "${workspaceFolder}/apps/frontend/src"
}
```

### Backend

```bash
# VS Code launch.json
{
  "type": "node",
  "request": "launch",
  "name": "NestJS: Debug",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "start:debug", "--prefix", "apps/backend"],
  "console": "integratedTerminal",
  "restart": true,
  "autoAttachChildProcesses": true
}
```

### Database

```bash
# Prisma Studio
cd apps/backend && npm run db:studio

# Direct SQL
psql -h localhost -U postgres -d dh_araria
```

---

## Performance Profiling

### Frontend

- React DevTools Profiler
- Lighthouse CI
- Bundle analyzer: `npm run build && npx @next/bundle-analyzer`

### Backend

- Clinic.js: `clinic doctor -- node dist/main.js`
- Prometheus metrics: `/metrics` endpoint
- Database query logging (development)

---

## Common Patterns

### Error Boundaries (Frontend)

```tsx
// components/ErrorBoundary.tsx
'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-center text-danger-600">
          Something went wrong. <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### Interceptors (Backend)

```typescript
// common/interceptors/transform.interceptor.ts
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data: data?.data ?? data,
        meta: data?.meta,
      })),
    );
  }
}
```

---

## Deployment from Developer Machine

```bash
# Build all
npm run build

# Build specific
npm run build:frontend
npm run build:backend

# Docker build
docker build -t dh-araria-backend ./apps/backend
docker build -t dh-araria-frontend ./apps/frontend

# Push to registry
docker tag dh-araria-backend your-registry/dh-araria-backend:v1.0.0
docker push your-registry/dh-araria-backend:v1.0.0
```

---

## Useful Commands

```bash
# Install new dependency (workspace root)
npm install package-name --workspace=apps/frontend
npm install package-name --workspace=apps/backend
npm install package-name --workspace=packages/shared
npm install package-name --workspace=packages/ui

# Add dev dependency
npm install -D package-name --workspace=apps/frontend

# Run script in specific workspace
npm run dev --workspace=apps/frontend
npm run test --workspace=apps/backend

# Clean all
npm run clean  # if defined, or manually remove node_modules, dist, .next

# Update dependencies
npm update --workspaces
```

---

*Document Version: 1.0*  
*Last Updated: 2024-10-06*  
*Classification: Internal - Government Use*