const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors'); // Import CORS package

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all requests
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

const htmlFilePath = path.join(__dirname, 'paymentSimulate.html');

app.post('/', async (req, res) => {
    console.log('Received POST data:', req.body);

    try {
        const htmlContent = await fs.readFile(htmlFilePath, 'utf8');

        const data = {
            TransactionId: req.body.transactionId || '',
            OrderId: req.body.orderId || '',
            SuccessURL: req.body.successURL || '',
            FailedURL: req.body.failedURL || '',
            CancelURL: req.body.cancelURL || ''
        };

        const updatedHtml = htmlContent.replace(
            '<script>',
            `<script>\n  const initialPaymentData = ${JSON.stringify(data)};\n  processPaymentData(initialPaymentData);\n`
        );

        res.send(updatedHtml);
    } catch (error) {
        console.error('Error reading/processing HTML:', error);
        res.status(500).send('Error loading payment page.');
    }
});

app.post('/payment-response', (req, res) => {
    try {
        console.log('Received payment response:', req.body);
        res.json({ message: 'Payment response received successfully!' });
    } catch (error) {
        console.error('Error handling payment response:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.use(express.static(path.join(__dirname)));

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
