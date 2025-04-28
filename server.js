const express = require('express');
const axios = require('axios');
const app = express();
const port = 63342; // Match this to the port in your redirect URI

// Enable CORS for your web app
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// OAuth callback endpoint
app.get('/auth/google/callback', async (req, res) => {
    const code = req.query.code;
    console.log('Authorization code received:', code);

    // Here you would exchange the code for tokens
    // This is just a simple example - you'd normally store these tokens securely
    try {
        const clientId = '233840126993-uned9hu7bedgpnursvggctc8c0qvussl.apps.googleusercontent.com';
        const clientSecret = 'YOUR_CLIENT_SECRET'; // Replace with your actual client secret
        const redirectUri = 'http://localhost:63342/auth/google/callback';

        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
        });

        const tokens = tokenResponse.data;
        console.log('Access token received');

        // Send a success page that redirects back to your application
        res.send(`
      <html>
        <body>
          <h1>Authentication Successful!</h1>
          <p>You can close this window and return to the application.</p>
          <script>
            // Store tokens in localStorage (not recommended for production)
            localStorage.setItem('google-auth-token', '${tokens.access_token}');
            localStorage.setItem('google-refresh-token', '${tokens.refresh_token}');
            
            // Close this window or redirect
            setTimeout(() => {
              window.close();
              // Or redirect: window.location.href = 'http://localhost:63342/Settings.html';
            }, 2000);
          </script>
        </body>
      </html>
    `);
    } catch (error) {
        console.error('Error exchanging code for tokens:', error);
        res.status(500).send('Authentication failed. See server logs for details.');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});