// server.js
const express = require('express');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

// Import Email Templates
const {
    generateContactNotification,
    generateModificationNotification,
    generateOrderConfirmation,
    generateOrderNotificationAdmin
} = require('./emailTemplates');

// --- Configuration ---
const PORT = process.env.PORT || 5001;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL; // Email address to receive admin notifications

// --- Initialize Firebase Admin SDK ---
try {
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
        // Add databaseURL if you need to interact with Realtime Database
        // databaseURL: "https://<YOUR_PROJECT_ID>.firebaseio.com"
    });
    console.log('Firebase Admin SDK Initialized Successfully.');
} catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    console.error(`Ensure serviceAccountKey.json path is correct in .env (currently: ${process.env.FIREBASE_SERVICE_ACCOUNT_PATH}) and the file exists.`);
    process.exit(1); // Exit if Firebase Admin can't initialize
}
// Optional: Get Firestore instance if needed later
// const db = admin.firestore();

// --- Initialize Nodemailer Transporter ---
// Validate email configuration
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.EMAIL_HOST) {
    console.error('Missing Nodemailer configuration in .env file (EMAIL_USER, EMAIL_PASS, EMAIL_HOST are required).');
    process.exit(1);
}

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '465', 10), // Default to 465 if not specified
    secure: process.env.EMAIL_SECURE === 'true', // Use true for port 465, false for others (like 587)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use the App Password here for Gmail
    },

     tls: {
       rejectUnauthorized: false
     }
});

// Verify Nodemailer connection
transporter.verify(function (error, success) {
    if (error) {
        console.error('Error verifying Nodemailer transporter:', error);
        console.error('Check your EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, and EMAIL_PASS in the .env file.');
    } else {
        console.log('Nodemailer transporter is ready to send emails.');
    }
});


// --- Initialize Express App ---
const app = express();

// --- Middleware ---
app.use(cors()); // Enable CORS for all origins (consider restricting in production)
app.use(express.json()); // Parse JSON request bodies

// --- API Routes ---

// Health Check Endpoint
app.get('/health', (req, res) => {
    const status = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            email: !!transporter,
            firebase: !!admin.app().name,
            database: process.env.FIREBASE_DATABASE_URL ? true : false
        }
    };
    console.log('Health check performed at:', status.timestamp);
    res.status(200).json(status);
});

// Root route (optional - for testing)
app.get('/', (req, res) => {
    res.json({
        message: 'Aricom Notification Server is running!',
        version: '1.0.0',
        endpoints: [
            '/notify/contact',
            '/notify/modification',
            '/notify/order',
            '/health'
        ]
    });
});

// 1. Contact Message Notification
app.post('/notify/contact', async (req, res) => {
    console.log('Received /notify/contact request:', req.body);
    
    // Extract data from nested structure or fall back to root
    const data = req.body.data || req.body;

    // Basic validation
    if (!data.email || !data.message || !ADMIN_EMAIL) {
        console.error('Missing required fields for contact notification:', {
            email: !!data.email,
            message: !!data.message,
            ADMIN_EMAIL: !!ADMIN_EMAIL
        });
        return res.status(400).send({ 
            success: false, 
            message: 'Missing required fields (email, message) or server admin email not configured.' 
        });
    }

    const { subject, html } = generateContactNotification(data);

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: ADMIN_EMAIL,
        replyTo: data.email,
        subject: subject,
        html: html,
    };

    try {
        console.log('Attempting to send contact notification email...');
        let info = await transporter.sendMail(mailOptions);
        console.log('Contact notification email sent successfully. Message ID:', info.messageId);
        console.log('Email details:', {
            to: mailOptions.to,
            subject: mailOptions.subject,
            timestamp: new Date().toISOString()
        });
        res.status(200).send({
            success: true,
            message: 'Contact notification sent successfully.',
            messageId: info.messageId
        });
    } catch (error) {
        console.error('Error sending contact notification email:', {
            error: error.message,
            stack: error.stack,
            mailOptions: {
                to: mailOptions.to,
                subject: mailOptions.subject
            },
            timestamp: new Date().toISOString()
        });
        res.status(500).send({
            success: false,
            message: 'Failed to send contact notification.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// 2. Modification Request Notification
app.post('/notify/modification', async (req, res) => {
    console.log('Received /notify/modification request:', req.body);
    
    // Extract data from nested structure or fall back to root
    const data = req.body.data || req.body;

    // Basic validation
    if (!data.email || !data.modifications || !data.planId || !ADMIN_EMAIL) {
        console.error('Missing required fields for modification notification:', {
            email: !!data.email,
            modifications: !!data.modifications,
            planId: !!data.planId,
            ADMIN_EMAIL: !!ADMIN_EMAIL
        });
        return res.status(400).send({ 
            success: false, 
            message: 'Missing required fields (email, modifications, planId) or server admin email not configured.' 
        });
    }

    const { subject, html } = generateModificationNotification(data);

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: ADMIN_EMAIL,
        replyTo: data.email,
        subject: subject,
        html: html,
    };

    try {
        console.log('Attempting to send modification request email...');
        let info = await transporter.sendMail(mailOptions);
        console.log('Modification request email sent successfully. Message ID:', info.messageId);
        console.log('Email details:', {
            to: mailOptions.to,
            subject: mailOptions.subject,
            planId: data.planId,
            timestamp: new Date().toISOString()
        });
        res.status(200).send({
            success: true,
            message: 'Modification request sent successfully.',
            messageId: info.messageId
        });
    } catch (error) {
        console.error('Error sending modification request email:', {
            error: error.message,
            stack: error.stack,
            mailOptions: {
                to: mailOptions.to,
                subject: mailOptions.subject
            },
            timestamp: new Date().toISOString()
        });
        res.status(500).send({
            success: false,
            message: 'Failed to send modification request.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// 3. Order Notification (Confirmation to User + Notification to Admin)
app.post('/notify/order', async (req, res) => {
    console.log('Received /notify/order request:', req.body);
    
    // Extract data from nested structure or fall back to root
    const data = req.body.data || req.body;

    // Enhanced validation with more detailed error reporting
    const missingFields = [];
    if (!data.userEmail) missingFields.push('userEmail');
    if (!data.id) missingFields.push('orderId');
    if (!data.paymentMethod) missingFields.push('paymentMethod');
    if (!ADMIN_EMAIL) missingFields.push('ADMIN_EMAIL configuration');

    if (missingFields.length > 0) {
        console.error('Missing required fields for order notification:', missingFields);
        return res.status(400).send({ 
            success: false, 
            message: `Missing required fields: ${missingFields.join(', ')}`,
            missingFields: missingFields
        });
    }

    try {
        console.log('Attempting to send order confirmation emails...');
        
        // --- Email 1: Confirmation to User ---
        const userEmailContent = generateOrderConfirmation(data);
        const userMailOptions = {
            from: process.env.EMAIL_FROM,
            to: data.userEmail,
            subject: userEmailContent.subject,
            html: userEmailContent.html,
        };

        // --- Email 2: Notification to Admin ---
        const adminEmailContent = generateOrderNotificationAdmin(data);
        const adminMailOptions = {
            from: process.env.EMAIL_FROM,
            to: ADMIN_EMAIL,
            replyTo: data.userEmail,
            subject: adminEmailContent.subject,
            html: adminEmailContent.html,
        };

        // Send both emails in parallel
        const [infoUser, infoAdmin] = await Promise.all([
            transporter.sendMail(userMailOptions),
            transporter.sendMail(adminMailOptions)
        ]);

        console.log('Order emails sent successfully:', {
            userEmail: data.userEmail,
            adminEmail: ADMIN_EMAIL,
            userMessageId: infoUser.messageId,
            adminMessageId: infoAdmin.messageId,
            timestamp: new Date().toISOString()
        });

        res.status(200).send({
            success: true,
            message: 'Order confirmation and notification sent successfully.',
            userMessageId: infoUser.messageId,
            adminMessageId: infoAdmin.messageId
        });

    } catch (error) {
        console.error('Error sending order emails:', {
            error: error.message,
            stack: error.stack,
            userEmail: data.userEmail,
            orderId: data.id,
            timestamp: new Date().toISOString()
        });
        res.status(500).send({
            success: false,
            message: 'Failed to send order emails.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// --- Basic Error Handling Middleware (Optional but good practice) ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ success: false, message: 'Something broke on the server!' });
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log('\n=== Server Startup Configuration ===');
    console.log(`Server Port: ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Admin Email: ${ADMIN_EMAIL || 'Not Set (Check .env)'}`);
    console.log(`Email From: ${process.env.EMAIL_FROM || 'Not Set (Check .env)'}`);
    console.log(`Email Host: ${process.env.EMAIL_HOST || 'Not Set (Check .env)'}`);
    console.log(`Firebase Initialized: ${admin.app().name ? 'Yes' : 'No'}`);
    console.log('==================================\n');
    console.log(`Aricom notification server listening on port ${PORT}`);
});