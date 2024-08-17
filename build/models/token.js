"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenModel = void 0;
const mongoose_1 = require("mongoose");
const TokenSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: "user"
    },
    token: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600,
    },
});
exports.TokenModel = (0, mongoose_1.model)('Token', TokenSchema);
