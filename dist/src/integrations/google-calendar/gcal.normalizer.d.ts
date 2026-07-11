import { Normalizer } from '../../sync/interfaces/normalizer.interface';
import { Event } from '@prisma/client';
import { calendar_v3 } from 'googleapis';
export declare class GcalNormalizer implements Normalizer<calendar_v3.Schema$Event, Omit<Event, 'id' | 'createdAt' | 'updatedAt'>> {
    normalize(data: calendar_v3.Schema$Event): Omit<Event, 'id' | 'createdAt' | 'updatedAt'>;
}
