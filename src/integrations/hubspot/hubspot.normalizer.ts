import { Normalizer } from '../../sync/interfaces/normalizer.interface';
import { Customer } from '@prisma/client';
import { SimplePublicObjectWithAssociations } from '@hubspot/api-client/lib/codegen/crm/contacts/models/SimplePublicObjectWithAssociations';

export class HubSpotNormalizer implements Normalizer<
  SimplePublicObjectWithAssociations,
  Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
> {
  normalize(
    data: SimplePublicObjectWithAssociations,
  ): Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      externalId: data.id,
      firstName: data.properties.firstname || null,
      lastName: data.properties.lastname || null,
      email: data.properties.email || null,
    };
  }
}
