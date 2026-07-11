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
var HubspotConnectorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HubspotConnectorService = void 0;
const common_1 = require("@nestjs/common");
const api_client_1 = require("@hubspot/api-client");
let HubspotConnectorService = HubspotConnectorService_1 = class HubspotConnectorService {
    hubspotClient;
    logger = new common_1.Logger(HubspotConnectorService_1.name);
    constructor() {
        this.hubspotClient = new api_client_1.Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN || 'pat-na1-placeholder' });
    }
    getName() {
        return 'hubspot';
    }
    async fetchData(cursor) {
        this.logger.debug(`Fetching HubSpot contacts from cursor: ${cursor || 'start'}`);
        const limit = 100;
        const properties = ['firstname', 'lastname', 'email', 'company'];
        const response = await this.hubspotClient.crm.contacts.basicApi.getPage(limit, cursor, properties);
        const data = response.results;
        let nextCursor = null;
        let hasMore = false;
        if (response.paging && response.paging.next && response.paging.next.after) {
            nextCursor = response.paging.next.after;
            hasMore = true;
        }
        return {
            data,
            nextCursor,
            hasMore,
        };
    }
};
exports.HubspotConnectorService = HubspotConnectorService;
exports.HubspotConnectorService = HubspotConnectorService = HubspotConnectorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], HubspotConnectorService);
//# sourceMappingURL=hubspot-connector.service.js.map