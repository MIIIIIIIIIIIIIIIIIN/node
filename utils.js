import crypto from 'crypto';
import { config } from './config.js';

export const generateOrderId = () => {
    return `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

export const createLinePayHeaders = (uri, body) => {
    const nonce = Date.now().toString();
    const signatureString = config.channelSecret + uri + JSON.stringify(body) + nonce;
    const signature = crypto
        .createHmac('sha256', config.channelSecret)
        .update(signatureString)
        .digest('base64');

    return {
        'Content-Type': 'application/json',
        'X-LINE-ChannelId': config.channelId,
        'X-LINE-Authorization-Nonce': nonce,
        'X-LINE-Authorization': signature
    };
};