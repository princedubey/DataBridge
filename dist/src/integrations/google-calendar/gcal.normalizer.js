"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GcalNormalizer = void 0;
class GcalNormalizer {
    normalize(data) {
        let startTime = new Date();
        let endTime = null;
        if (data.start?.dateTime) {
            startTime = new Date(data.start.dateTime);
        }
        else if (data.start?.date) {
            startTime = new Date(data.start.date);
        }
        if (data.end?.dateTime) {
            endTime = new Date(data.end.dateTime);
        }
        else if (data.end?.date) {
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
exports.GcalNormalizer = GcalNormalizer;
//# sourceMappingURL=gcal.normalizer.js.map