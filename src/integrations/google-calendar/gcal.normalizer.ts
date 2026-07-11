import { Normalizer } from '../../sync/interfaces/normalizer.interface';
import { Event } from '@prisma/client';
import { calendar_v3 } from 'googleapis';

export class GcalNormalizer implements Normalizer<calendar_v3.Schema$Event, Omit<Event, 'id' | 'createdAt' | 'updatedAt'>> {
  normalize(data: calendar_v3.Schema$Event): Omit<Event, 'id' | 'createdAt' | 'updatedAt'> {
    let startTime = new Date();
    let endTime: Date | null = null;

    if (data.start?.dateTime) {
      startTime = new Date(data.start.dateTime);
    } else if (data.start?.date) {
      startTime = new Date(data.start.date);
    }

    if (data.end?.dateTime) {
      endTime = new Date(data.end.dateTime);
    } else if (data.end?.date) {
      endTime = new Date(data.end.date);
    }

    return {
      externalId: data.id || 'unknown_id',
      summary: data.summary || 'No Title',
      startTime,
      endTime,
    };
  }
}
