import express from 'express';
import { config } from './config.js';
import { createLinePayHeaders, generateOrderId } from './utils.js';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

// 首頁路由
app.get('/', (req, res) => {
    res.send(`
        <h1>Line Pay 測試</h1>
        <form id="paymentForm">
            <input type="number" id="amount" placeholder="輸入金額" required>
            <button type="submit">付款</button>
        </form>
        <div id="result" style="margin-top: 20px; color: red;"></div>
        <script>
            document.getElementById('paymentForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const resultDiv = document.getElementById('result');
                try {
                    const amount = document.getElementById('amount').value;
                    console.log('Sending amount:', amount);
                    
                    const response = await fetch('/create-payment', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ amount: Number(amount) })
                    });
                    
                    const data = await response.json();
                    console.log('Response data:', data);
                    
                    if (!response.ok) {
                        throw new Error(data.error || '付款請求失敗');
                    }
                    
                    if (data.paymentUrl) {
                        window.location.href = data.paymentUrl.web;
                    } else {
                        resultDiv.textContent = '付款建立失敗: ' + (data.error || '未知錯誤');
                    }
                } catch (error) {
                    console.error('Payment error:', error);
                    resultDiv.textContent = '錯誤: ' + error.message;
                }
            });
        </script>
    `);
});

// 付款請求路由
app.post('/create-payment', async (req, res) => {
    try {
        const { amount } = req.body;
        console.log('Received amount:', amount);

        if (!amount || isNaN(amount)) {
            console.log('Invalid amount:', amount);
            return res.status(400).json({ error: '無效的金額' });
        }

        const orderId = generateOrderId();
        const uri = `${config.version}/payments/request`;
        const requestUrl = config.baseUrl + uri;

        const requestBody = {
            amount: parseInt(amount),
            currency: 'TWD',
            orderId: orderId,
            packages: [{
                id: orderId,
                amount: parseInt(amount),
                name: '測試商品',
                products: [{
                    name: '測試項目',
                    quantity: 1,
                    price: parseInt(amount)
                }]
            }],
            redirectUrls: {
                confirmUrl: `${config.returnHost}/confirm`,
                cancelUrl: `${config.returnHost}/cancel`
            }
        };

        console.log('Line Pay Request:', {
            url: requestUrl,
            body: requestBody,
            headers: createLinePayHeaders(uri, requestBody)
        });

        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: createLinePayHeaders(uri, requestBody),
            body: JSON.stringify(requestBody)
        });

        const responseData = await response.json();
        console.log('Line Pay Response:', responseData);

        if (responseData.returnCode === '0000') {
            res.json({
                paymentUrl: responseData.info.paymentUrl,
                transactionId: responseData.info.transactionId
            });
        } else {
            console.error('Line Pay Error:', responseData);
            res.status(400).json({
                error: responseData.returnMessage || 'Line Pay request failed'
            });
        }
    } catch (error) {
        console.error('Create payment error:', error);
        res.status(500).json({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Config:', {
        baseUrl: config.baseUrl,
        returnHost: config.returnHost,
        channelId: config.channelId.substring(0, 4) + '****' // 只顯示部分 ID
    });
});