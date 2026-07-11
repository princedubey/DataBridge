import { GcalNormalizer } from './gcal.normalizer';
import { calendar_v3 } from 'googleapis';

describe('GcalNormalizer', () => {
  let normalizer: GcalNormalizer;

  beforeEach(() => {
    normalizer = new GcalNormalizer();
  });

  it('should normalize a Google Calendar event with dateTime', () => {
    const event: calendar_v3.Schema$Event = {
      id: 'gcal_123',
      summary: 'Project Meeting',
      start: { dateTime: '2026-07-12T10:00:00Z' },
      end: { dateTime: '2026-07-12T11:00:00Z' },
    };

    const result = normalizer.normalize(event);

    expect(result.externalId).toEqual('gcal_123');
    expect(result.summary).toEqual('Project Meeting');
    expect(result.startTime).toEqual(new Date('2026-07-12T10:00:00Z'));
    expect(result.endTime).toEqual(new Date('2026-07-12T11:00:00Z'));
  });

  it('should normalize a Google Calendar event with date (all-day)', () => {
    const event: calendar_v3.Schema$Event = {
      id: 'gcal_456',
      summary: 'Holiday',
      start: { date: '2026-07-15' },
      end: { date: '2026-07-16' },
    };

    const result = normalizer.normalize(event);

    expect(result.externalId).toEqual('gcal_456');
    expect(result.summary).toEqual('Holiday');
    expect(result.startTime).toEqual(new Date('2026-07-15'));
    expect(result.endTime).toEqual(new Date('2026-07-16'));
  });
});
