"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const homey_1 = __importDefault(require("homey"));
class App extends homey_1.default.App {
    constructor() {
        super(...arguments);
        this.filteredHeaders = ["Authorization"];
        this.filteredQueries = ["homey"];
    }
    async onInit() {
        const id = homey_1.default.env.WEBHOOK_ID;
        const secret = homey_1.default.env.WEBHOOK_SECRET;
        const flowAny = this.homey.flow.getTriggerCard('webhook-triggered-any');
        const flowEvent = this.homey.flow.getTriggerCard('webhook-triggered-event');
        flowEvent.registerRunListener(async (args, state) => {
            return args.event === state.event;
        });
        const webhook = await this.homey.cloud.createWebhook(id, secret, {});
        // Set this so its available from the settings page.
        const baseUrl = "https://webhooks.athom.com/webhook/";
        const homeyId = await this.homey.cloud.getHomeyId();
        const homeyUrl = baseUrl + id + "?homey=" + homeyId;
        this.homey.settings.set("webhook_url", homeyUrl);
        webhook.on('message', args => {
            const headers = Object.keys(args.headers)
                .filter(name => !this.filteredHeaders.includes(name))
                .reduce((obj, key) => {
                obj[key] = args.headers[key];
                return obj;
            }, {});
            const query = Object.keys(args.query)
                .filter(name => !this.filteredQueries.includes(name))
                .reduce((obj, key) => {
                obj[key] = args.query[key];
                return obj;
            }, {});
            const tokens = {
                event: args.query.event,
                headers: JSON.stringify(headers),
                query: JSON.stringify(query),
                body: JSON.stringify(args.body)
            };
            flowAny.trigger(tokens)
                .catch(this.error);
            flowEvent.trigger(tokens, { event: args.query.event })
                .catch(this.error);
        });
    }
}
module.exports = App;
