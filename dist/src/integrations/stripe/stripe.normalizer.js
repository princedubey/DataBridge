"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeNormalizer = void 0;
class StripeNormalizer {
    COLLECTED_STATUSES = ['succeeded', 'paid', 'completed'];
    normalize(data) {
        let internalStatus = 'PENDING';
        if (this.COLLECTED_STATUSES.includes(data.status)) {
            internalStatus = 'COLLECTED';
        }
        else if (data.status === 'canceled' || data.status === 'requires_payment_method') {
            internalStatus = 'FAILED';
        }
        return {
            externalId: data.id,
            customerName: data.customer || null,
            amount: data.amount,
            currency: data.currency.toUpperCase(),
            status: internalStatus,
        };
    }
}
exports.StripeNormalizer = StripeNormalizer;
//# sourceMappingURL=stripe.normalizer.js.map