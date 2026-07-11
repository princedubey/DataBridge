"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HubSpotNormalizer = void 0;
class HubSpotNormalizer {
    normalize(data) {
        return {
            externalId: data.id,
            firstName: data.properties.firstname || null,
            lastName: data.properties.lastname || null,
            email: data.properties.email || null,
        };
    }
}
exports.HubSpotNormalizer = HubSpotNormalizer;
//# sourceMappingURL=hubspot.normalizer.js.map