"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const argon2_1 = __importDefault(require("argon2"));
const crypto_1 = __importDefault(require("crypto"));
const output = [];
try {
    output.push(`argon2: ${typeof argon2_1.default}`);
    if (argon2_1.default) {
        output.push(`argon2.verify: ${typeof argon2_1.default.verify}`);
        output.push(`argon2 keys: ${Object.keys(argon2_1.default).join(',')}`);
    }
}
catch (e) {
    output.push('argon2 error: ' + e.toString());
}
try {
    output.push(`crypto: ${typeof crypto_1.default}`);
    if (crypto_1.default)
        output.push(`crypto.createHash: ${typeof crypto_1.default.createHash}`);
}
catch (e) {
    output.push('crypto error: ' + e.toString());
}
fs.writeFileSync('c:/Lekhaly/apps/api/debug_output.txt', output.join('\n'));
console.log('Done');
//# sourceMappingURL=debug_imports.js.map