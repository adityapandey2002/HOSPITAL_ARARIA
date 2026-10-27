import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';

import { DRIZZLE, type DrizzleDb } from '../../common/drizzle/drizzle.module';
import { newId } from '../../common/drizzle/id';
import { slideshowImages, type NewSlideshowImageRow, type SlideshowImageRow } from '../../common/drizzle/schema';

@Injectable()
export class SlideshowService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findActive(): Promise<SlideshowImageRow[]> {
    return this.db
      .select()
      .from(slideshowImages)
      .where(eq(slideshowImages.isActive, true))
      .orderBy(asc(slideshowImages.sortOrder), asc(slideshowImages.createdAt));
  }

  async findAll(): Promise<SlideshowImageRow[]> {
    return this.db
      .select()
      .from(slideshowImages)
      .orderBy(asc(slideshowImages.sortOrder), asc(slideshowImages.createdAt));
  }

  async findById(id: string): Promise<SlideshowImageRow> {
    const [row] = await this.db.select().from(slideshowImages).where(eq(slideshowImages.id, id)).limit(1);
    if (!row) throw new NotFoundException('Slideshow image not found');
    return row;
  }

  async create(data: Partial<NewSlideshowImageRow>): Promise<SlideshowImageRow> {
    const [created] = await this.db
      .insert(slideshowImages)
      .values({
        id: data.id ?? newId(),
        url: data.url!,
        alt: data.alt ?? null,
        caption: data.caption ?? null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return created;
  }

  async update(id: string, data: Partial<NewSlideshowImageRow>): Promise<SlideshowImageRow> {
    await this.findById(id);
    const [updated] = await this.db
      .update(slideshowImages)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(slideshowImages.id, id))
      .returning();
    return updated;
  }

  async delete(id: string): Promise<{ success: true }> {
    await this.findById(id);
    await this.db.delete(slideshowImages).where(eq(slideshowImages.id, id));
    return { success: true };
  }
}
