const nodemailer = require('nodemailer');

// Test email configuration
async function testEmailConfiguration() {
    console.log('\n========================================');
    console.log('📧 EMAIL CONFIGURATION TEST');
    console.log('========================================\n');

    // Check environment variables
    console.log('1️⃣  Checking Environment Variables:');
    console.log('   EMAIL_USER:', process.env.EMAIL_USER || '❌ NOT SET');
    console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ SET (hidden)' : '❌ NOT SET');
    console.log('   ADMIN_EMAIL:', process.env.ADMIN_EMAIL || '❌ NOT SET');
    console.log('');

    // Create configuration
    const EMAIL_CONFIG = {
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER || 'silas66@ethereal.email',
            pass: process.env.EMAIL_PASS || 'kbHtVUfuSm5dj1e4rz'
        }
    };

    console.log('2️⃣  Email Configuration:');
    console.log('   Service:', EMAIL_CONFIG.service);
    console.log('   User:', EMAIL_CONFIG.auth.user);
    console.log('   Using env vars:', !!(process.env.EMAIL_USER && process.env.EMAIL_PASS));
    console.log('');

    // Test transporter creation
    console.log('3️⃣  Creating Email Transporter...');
    let transporter;
    try {
        transporter = nodemailer.createTransport(EMAIL_CONFIG);
        console.log('   ✅ Transporter created successfully');
    } catch (error) {
        console.log('   ❌ Failed to create transporter:', error.message);
        return;
    }
    console.log('');

    // Verify connection
    console.log('4️⃣  Verifying SMTP Connection...');
    try {
        await transporter.verify();
        console.log('   ✅ SMTP connection verified successfully!');
        console.log('   ✅ Email service is ready to send emails');
    } catch (error) {
        console.log('   ❌ SMTP verification failed:', error.message);
        console.log('');
        console.log('   Common Issues:');
        console.log('   - Invalid credentials (check EMAIL_USER and EMAIL_PASS)');
        console.log('   - Need Gmail App Password (not regular password)');
        console.log('   - 2-Factor Authentication not enabled on Gmail');
        console.log('   - Firewall blocking SMTP ports (587/465)');
        console.log('');
        console.log('   Gmail Setup Instructions:');
        console.log('   1. Enable 2-Factor Authentication at https://myaccount.google.com/security');
        console.log('   2. Generate App Password at https://myaccount.google.com/apppasswords');
        console.log('   3. Use the 16-character app password for EMAIL_PASS');
        return;
    }
    console.log('');

    // Send test email
    const testEmail = process.env.EMAIL_USER || 'test@example.com';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';

    console.log('5️⃣  Sending Test Email...');
    console.log('   From:', EMAIL_CONFIG.auth.user);
    console.log('   To:', testEmail);
    
    const mailOptions = {
        from: `"Modenlo Test" <${EMAIL_CONFIG.auth.user}>`,
        to: testEmail,
        subject: '✅ Modenlo Email Test - Success!',
        text: 'This is a test email from the Modenlo email service. If you receive this, email configuration is working correctly!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 3px solid #28a745; border-radius: 10px;">
                <h2 style="color: #28a745;">✅ Email Test Successful!</h2>
                <p>This is a test email from the Modenlo email service.</p>
                <p>If you're receiving this email, your email configuration is working correctly!</p>
                <div style="background: #f8f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3>Configuration Details:</h3>
                    <p><strong>Service:</strong> ${EMAIL_CONFIG.service}</p>
                    <p><strong>Sender:</strong> ${EMAIL_CONFIG.auth.user}</p>
                    <p><strong>Admin Email:</strong> ${adminEmail}</p>
                </div>
                <p>You can now place orders and receive confirmation emails!</p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('   ✅ Test email sent successfully!');
        console.log('   Message ID:', info.messageId);
        console.log('   Check your inbox at:', testEmail);
    } catch (error) {
        console.log('   ❌ Failed to send test email:', error.message);
        console.log('   Full error:', error);
    }
    console.log('');

    console.log('========================================');
    console.log('✅ EMAIL CONFIGURATION TEST COMPLETE');
    console.log('========================================\n');
}

// Run the test
testEmailConfiguration()
    .then(() => {
        console.log('Test completed. Exiting...');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Test failed with error:', error);
        process.exit(1);
    });
