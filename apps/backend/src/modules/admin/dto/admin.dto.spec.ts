import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { describe, expect, it } from '@jest/globals';

import { CreateDoctorDto } from './admin.dto';

/**
 * The pipe matches `configureApp()` in `bootstrap.ts`, because the failure this
 * guards against was a wire-format mismatch the unit-level validator would
 * never see: the admin form posts a number and a string array, while the DTO
 * originally demanded digit strings.
 */
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
});

const DEPARTMENT_ID = '0b7a4f0e-3a37-4f4d-9b4b-2a6f9c2a1d10';

const frontendPayload = {
  name: 'Dr Anjali Verma',
  email: 'anjali.verma@example.com',
  phone: '9876543210',
  specialization: 'Obstetrics and Gynaecology',
  qualification: 'MBBS, MS',
  experience: 7,
  departmentId: DEPARTMENT_ID,
  bio: '',
  hprId: '',
  consultationFee: 300,
  languages: ['English', 'Hindi'],
};

const transform = async (value: unknown) =>
  (await pipe.transform(value, { type: 'body', metatype: CreateDoctorDto })) as CreateDoctorDto;

describe('CreateDoctorDto', () => {
  it('accepts the payload the admin form sends', async () => {
    const dto = await transform({ ...frontendPayload });

    expect(dto.experience).toBe('7');
    expect(dto.consultationFee).toBe('300');
    expect(dto.languages).toEqual(['English', 'Hindi']);
  });

  it('still accepts digit strings and JSON-encoded languages', async () => {
    const dto = await transform({
      ...frontendPayload,
      experience: '7',
      consultationFee: '300',
      languages: '["English","Hindi"]',
    });

    expect(dto.languages).toEqual(['English', 'Hindi']);
  });

  it('accepts a comma-separated language list', async () => {
    const dto = await transform({ ...frontendPayload, languages: 'English, Hindi' });

    expect(dto.languages).toEqual(['English', 'Hindi']);
  });

  it('leaves optional fields out when they are not supplied', async () => {
    const {
      consultationFee: _fee,
      languages: _languages,
      bio: _bio,
      hprId: _hpr,
      ...required
    } = frontendPayload;
    const dto = await transform(required);

    expect(dto.consultationFee).toBeUndefined();
    expect(dto.languages).toBeUndefined();
  });

  it('rejects a non-numeric experience', async () => {
    await expect(transform({ ...frontendPayload, experience: 'seven years' })).rejects.toThrow();
  });
});
