const express = require('express');
const https = require('https');
const http = require('http'); // Required for handling redirects
const bodyParser = require('body-parser');
const { URL } = require('url'); // Use the URL class for URL parsing

const app = express();
const port = 3000;

// Use body-parser to parse the JSON request body
app.use(bodyParser.json());

function handleRedirect(url, originalReq, originalRes) { // Add originalReq and originalRes
    const parsedUrl = new URL(url);
    const redirectOptions = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET'
    };

    const redirectRequest = (parsedUrl.protocol === 'https:' ? https : http).request(redirectOptions, (redirectResponse) => {
        console.log('Redirect Status Code:', redirectResponse.statusCode);
        console.log('Redirect Headers:', redirectResponse.headers);

        if (redirectResponse.statusCode >= 300 && redirectResponse.statusCode < 400 && redirectResponse.headers.location) {
            const newRedirectUrl = redirectResponse.headers.location;
            console.log(`Following redirect to: ${newRedirectUrl}`);
            handleRedirect(newRedirectUrl, originalReq, originalRes); // Pass original requests
        } else {
            let redirectData = '';
            redirectResponse.on('data', (chunk) => {
                redirectData += chunk;
            });
            redirectResponse.on('end', () => {
                console.log('Redirected Response Data:', redirectData);
                //  Now, we send the user to the final URL using express's res.redirect
                //  This will make the *user's* browser go to the final URL.
                if (redirectResponse.statusCode >= 200 && redirectResponse.statusCode < 300) {
                    originalRes.redirect(parsedUrl.href); // Use parsedUrl.href
                }
                else {
                    originalRes.status(redirectResponse.statusCode).send(redirectData);
                }
            });
        }
    });

    redirectRequest.on('error', (err) => {
        console.error('Redirect Error:', err);
        originalRes.status(500).send('Internal Server Error'); // Send error to original client
    });

    redirectRequest.end();
}



app.post('/', (req, res) => {
    const postData = JSON.stringify(req.body); // Use the body from the Express request
    const options = {
        hostname: 'ecommpay-dummy.azurewebsites.net',
        path: '/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
        },
        followRedirect: false
    };

    const request = https.request(options, (response) => {
        console.log('Original Request Status Code:', response.statusCode);
        console.log('Original Request Headers:', response.headers);

        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            const redirectUrl = response.headers.location;
            console.log(`Initial redirect to: ${redirectUrl}`);
            handleRedirect(redirectUrl, req, res); // Pass the Express request and response
        } else {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });
            response.on('end', () => {
                console.log('Original Response Data (if no redirect):', data);
                //  Send the data back to the *original* client (the browser)
                res.send(data);
            });
            response.on('error', (e) => {
                console.error(e);
                res.status(500).send('Internal Server Error');
            })
        }
    });

    request.on('error', (err) => {
        console.error('Original Request Error:', err);
        res.status(500).send('Internal Server Error');
    });

    request.write(postData);
    request.end();
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
