"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Audit = exports.AUDIT_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.AUDIT_KEY = "auditMeta";
const Audit = (meta) => (0, common_1.SetMetadata)(exports.AUDIT_KEY, meta);
exports.Audit = Audit;
//# sourceMappingURL=audit.decorator.js.map