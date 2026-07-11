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
var AppService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const sync_service_1 = require("./sync/sync.service");
const idempotency_service_1 = require("./sync/services/idempotency.service");
const stripe_connector_service_1 = require("./integrations/stripe/stripe-connector.service");
const stripe_normalizer_1 = require("./integrations/stripe/stripe.normalizer");
const hubspot_connector_service_1 = require("./integrations/hubspot/hubspot-connector.service");
const hubspot_normalizer_1 = require("./integrations/hubspot/hubspot.normalizer");
const gcal_connector_service_1 = require("./integrations/google-calendar/gcal-connector.service");
const gcal_normalizer_1 = require("./integrations/google-calendar/gcal.normalizer");
let AppService = AppService_1 = class AppService {
    syncService;
    idempotencyService;
    stripeConnector;
    hubspotConnector;
    gcalConnector;
    logger = new common_1.Logger(AppService_1.name);
    constructor(syncService, idempotencyService, stripeConnector, hubspotConnector, gcalConnector) {
        this.syncService = syncService;
        this.idempotencyService = idempotencyService;
        this.stripeConnector = stripeConnector;
        this.hubspotConnector = hubspotConnector;
        this.gcalConnector = gcalConnector;
    }
    getHello() {
        return 'DataBridge API is running!';
    }
    async triggerAllSyncs() {
        this.logger.log('Manually triggering all sync operations...');
        const results = await Promise.allSettled([
            this.syncService.runSync(this.stripeConnector, new stripe_normalizer_1.StripeNormalizer(), async (data) => this.idempotencyService.upsertPayment(data)),
            this.syncService.runSync(this.hubspotConnector, new hubspot_normalizer_1.HubSpotNormalizer(), async (data) => this.idempotencyService.upsertCustomer(data)),
            this.syncService.runSync(this.gcalConnector, new gcal_normalizer_1.GcalNormalizer(), async (data) => this.idempotencyService.upsertEvent(data))
        ]);
        const status = results.map(r => r.status);
        this.logger.log(`Sync operations completed. Statuses: ${JSON.stringify(status)}`);
        return {
            message: 'Sync operations completed',
            results: status
        };
    }
};
exports.AppService = AppService;
exports.AppService = AppService = AppService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sync_service_1.SyncService,
        idempotency_service_1.IdempotencyService,
        stripe_connector_service_1.StripeConnectorService,
        hubspot_connector_service_1.HubspotConnectorService,
        gcal_connector_service_1.GcalConnectorService])
], AppService);
//# sourceMappingURL=app.service.js.map