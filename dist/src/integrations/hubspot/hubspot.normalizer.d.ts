import { Normalizer } from '../../sync/interfaces/normalizer.interface';
import { Customer } from '@prisma/client';
import { SimplePublicObjectWithAssociations } from '@hubspot/api-client/lib/codegen/crm/contacts/models/SimplePublicObjectWithAssociations';
export declare class HubSpotNormalizer implements Normalizer<SimplePublicObjectWithAssociations, Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>> {
    normalize(data: SimplePublicObjectWithAssociations): Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;
}
