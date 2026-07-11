"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GcalConnectorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GcalConnectorService = void 0;
const common_1 = require("@nestjs/common");
const googleapis_1 = require("googleapis");
let GcalConnectorService = GcalConnectorService_1 = class GcalConnectorService {
    calendar;
    logger = new common_1.Logger(GcalConnectorService_1.name);
    constructor() {
        const auth = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID || 'client_id', process.env.GOOGLE_CLIENT_SECRET || 'client_secret');
        auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN || 'refresh_token' });
        this.calendar = googleapis_1.google.calendar({ version: 'v3', auth });
    }
    getName() {
        return 'google-calendar';
    }
    async fetchData(cursor) {
        this.logger.debug(`Fetching Google Calendar events from cursor: ${cursor || 'start'}`);
        const maxResults = 100;
        let updatedMin = undefined;
        if (cursor && !cursor.startsWith('pageToken:')) {
            updatedMin = new Date(cursor).toISOString();
        }
        let pageToken = undefined;
        if (cursor && cursor.startsWith('pageToken:')) {
            pageToken = cursor.split(':')[1];
        }
        const response = await this.calendar.events.list({
            calendarId: 'primary',
            maxResults,
            updatedMin,
            pageToken,
            singleEvents: true,
            showDeleted: false,
        });
        const data = response.data.items || [];
        let nextCursor = null;
        let hasMore = false;
        if (response.data.nextPageToken) {
            nextCursor = `pageToken:${response.data.nextPageToken}`;
            hasMore = true;
        }
        else if (data.length > 0) {
            const maxUpdated = data.reduce((max, event) => {
                const updated = new Date(event.updated || 0).getTime();
                return updated > max ? updated : max;
            }, 0);
            if (maxUpdated > 0) {
                nextCursor = new Date(maxUpdated).toISOString();
            }
        }
        return {
            data,
            nextCursor,
            hasMore,
        };
    }
};
exports.GcalConnectorService = GcalConnectorService;
exports.GcalConnectorService = GcalConnectorService = GcalConnectorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], GcalConnectorService);
//# sourceMappingURL=gcal-connector.service.js.map