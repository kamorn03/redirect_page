const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises; // Use promises for cleaner async/await

const app = express();
const port = 3000;
const htmlFilePath = path.join(__dirname, 'paymentSimulate.html'); // Adjust if your file name is different

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json()); // To parse JSON request bodies for the return URLs

app.post('/', async (req, res) => {
    console.log('Received POST data:', req.body);

    try {
        const htmlContent = await fs.readFile(htmlFilePath, 'utf8');

        // Prepare the data to be injected into the HTML
        const data = {
            TransactionId: req.body.transactionId || '',
            OrderId: req.body.orderId || '',
            SuccessURL: req.body.successURL || '',
            FailedURL: req.body.failedURL || '',
            CancelURL: req.body.cancelURL || ''
        };

        // Inject the data as a JavaScript object within the HTML
        const updatedHtml = htmlContent.replace(
            '<script>',
            `<script>\n  const initialPaymentData = ${JSON.stringify(data)};\n  processPaymentData(initialPaymentData);\n`
        );

        res.send(updatedHtml);

    } catch (error) {
        console.error('Error reading/processing HTML:', error);
        res.status(500).send('Error loading payment page.', error);
    }
});

// This route will handle the responses coming back from the HTML page
app.post('/payment-response', (req, res) => {
    console.log('Received payment response:', req.body);
    res.json({ message: 'Payment response received successfully!' }); // You can customize this response
});

app.use(express.static(path.join(__dirname)));

app.listen(port, () => {
    console.log(`Server listening at http://127.0.0.1:${port}`);
});