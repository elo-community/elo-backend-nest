import { Controller, Get } from "@nestjs/common";
import * as client from "prom-client";

@Controller('metrics')
export class MetricsController {
    private readonly register: client.Registry;

    constructor() {
        this.register = new client.Registry();
        client.collectDefaultMetrics({ register: this.register });
    }

    @Get()
    async getMetrics(): Promise<string> {
        return this.register.metrics();
    }
}