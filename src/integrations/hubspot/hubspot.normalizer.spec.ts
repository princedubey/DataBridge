import { HubSpotNormalizer } from './hubspot.normalizer';
import { SimplePublicObjectWithAssociations } from '@hubspot/api-client/lib/codegen/crm/contacts/models/SimplePublicObjectWithAssociations';

describe('HubSpotNormalizer', () => {
  let normalizer: HubSpotNormalizer;

  beforeEach(() => {
    normalizer = new HubSpotNormalizer();
  });

  it('should normalize a HubSpot contact', () => {
    const contact: SimplePublicObjectWithAssociations = {
      id: 'hs_123',
      properties: {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      archived: false,
    };

    const result = normalizer.normalize(contact);

    expect(result).toEqual({
      externalId: 'hs_123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    });
  });

  it('should normalize with missing properties', () => {
    const contact: SimplePublicObjectWithAssociations = {
      id: 'hs_456',
      properties: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      archived: false,
    };

    const result = normalizer.normalize(contact);

    expect(result).toEqual({
      externalId: 'hs_456',
      firstName: null,
      lastName: null,
      email: null,
    });
  });
});
