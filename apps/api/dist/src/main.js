"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix("v1");
    await app.listen(process.env.API_PORT ? Number(process.env.API_PORT) : 4000);
    app.useGlobalFilters(new (class {
        catch(exception, host) {
            console.error(exception);
            throw exception;
        }
    })());
}
bootstrap();
//# sourceMappingURL=main.js.map