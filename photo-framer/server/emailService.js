const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Email configuration
// For development, using a test account. In production, use environment variables
const EMAIL_CONFIG = {
    // For testing, you can use Gmail or create test account at https://ethereal.email/
    service: 'gmail', // Change this in production
    auth: {
        user: process.env.EMAIL_USER || 'silas66@ethereal.email', // Set in environment variables
        pass: process.env.EMAIL_PASS || 'kbHtVUfuSm5dj1e4rz' // Use App Password for Gmail
    }
};

// Admin email address
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@photoframer.com';

// Create transporter
let transporter;

try {
    transporter = nodemailer.createTransport(EMAIL_CONFIG);
} catch (error) {
    console.error('Email transporter creation failed:', error);
    console.log('Email functionality will be disabled. Set EMAIL_USER and EMAIL_PASS environment variables to enable.');
}

// Generate secure download token
function generateDownloadToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Send customer confirmation email
async function sendCustomerConfirmation(orderData) {
    if (!transporter) {
        console.log('Email not configured - would send customer confirmation to:', orderData.contact.email);
        return { success: false, message: 'Email not configured' };
    }

    const { contact, shipping, order } = orderData;
    const items = order.items.map(item => 
        `    - ${item.frameSizeName}" ${item.orientation} with ${item.mountName} - $${item.totalPrice.toFixed(2)}`
    ).join('\n');

    const emailContent = `
Dear ${shipping.firstName} ${shipping.lastName},

Thank you for your order!

Order Details:
${items}

Subtotal: $${order.totals.subtotal.toFixed(2)}
Shipping: $${order.totals.shipping.toFixed(2)}
Tax: $${order.totals.tax.toFixed(2)}
Total: $${order.totals.total.toFixed(2)}

Shipping Address:
${shipping.firstName} ${shipping.lastName}
${shipping.address}
${shipping.city}, ${shipping.state} ${shipping.zipCode}
Phone: ${shipping.phone}

Your custom framed photo(s) will be prepared and shipped within 3-5 business days.
You will receive tracking information via email once your order ships.

Thank you for choosing Photo Framer!

Best regards,
The Photo Framer Team
    `.trim();

    const mailOptions = {
        from: `"Photo Framer" <${EMAIL_CONFIG.auth.user}>`,
        to: contact.email,
        subject: `Order Confirmation - Photo Framer`,
        text: emailContent,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #667eea;">Thank You for Your Order!</h2>
                <p>Dear ${shipping.firstName} ${shipping.lastName},</p>
                <p>Thank you for your order!</p>
                
                <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Order Details</h3>
                <div style="background: #f8f9ff; padding: 15px; border-radius: 8px;">
                    ${order.items.map(item => `
                        <div style="margin-bottom: 10px;">
                            <strong>${item.frameSizeName}" ${item.orientation}</strong><br>
                            Mount: ${item.mountName}<br>
                            Price: $${item.totalPrice.toFixed(2)}
                        </div>
                    `).join('<hr style="border: 1px solid #e0e0e0;">')}
                </div>
                
                <table style="width: 100%; margin-top: 20px;">
                    <tr><td>Subtotal:</td><td align="right">$${order.totals.subtotal.toFixed(2)}</td></tr>
                    <tr><td>Shipping:</td><td align="right">$${order.totals.shipping.toFixed(2)}</td></tr>
                    <tr><td>Tax:</td><td align="right">$${order.totals.tax.toFixed(2)}</td></tr>
                    <tr style="border-top: 2px solid #667eea; font-weight: bold; font-size: 1.2em;">
                        <td>Total:</td><td align="right">$${order.totals.total.toFixed(2)}</td>
                    </tr>
                </table>
                
                <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-top: 30px;">Shipping Address</h3>
                <div style="background: #f8f9ff; padding: 15px; border-radius: 8px;">
                    ${shipping.firstName} ${shipping.lastName}<br>
                    ${shipping.address}<br>
                    ${shipping.city}, ${shipping.state} ${shipping.zipCode}<br>
                    Phone: ${shipping.phone}
                </div>
                
                <p style="margin-top: 30px;">Your custom framed photo(s) will be prepared and shipped within <strong>3-5 business days</strong>.</p>
                <p>You will receive tracking information via email once your order ships.</p>
                
                <p style="margin-top: 30px;">Thank you for choosing Photo Framer!</p>
                <p><strong>The Photo Framer Team</strong></p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Customer confirmation email sent to:', contact.email);
        return { success: true };
    } catch (error) {
        console.error('Failed to send customer email:', error);
        return { success: false, error: error.message };
    }
}

// Send admin notification with download link
async function sendAdminNotification(orderData, orderId) {
    if (!transporter) {
        console.log('Email not configured - would send admin notification for order:', orderId);
        return { success: false, message: 'Email not configured' };
    }

    const { contact, shipping, order } = orderData;
    const downloadToken = generateDownloadToken();
    const downloadLink = `http://localhost:3000/api/download/${orderId}/${downloadToken}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const items = order.items.map((item, index) => {
        const dimensions = item.frameSize.split('x');
        return `
Item ${index + 1}:
    Frame: ${item.frameSizeName}" ${item.orientation}
    Mount: ${item.mountName}
    Image Resolution: (stored in order data)
    Price: $${item.totalPrice.toFixed(2)}
        `.trim();
    }).join('\n\n');

    const emailContent = `
NEW ORDER RECEIVED - PRINT REQUIRED

Order ID: ${orderId}

Customer Information:
Name: ${shipping.firstName} ${shipping.lastName}
Email: ${contact.email}
Phone: ${shipping.phone}

Shipping Address:
${shipping.address}
${shipping.city}, ${shipping.state} ${shipping.zipCode}

Order Details:
${items}

Payment Information:
Subtotal: $${order.totals.subtotal.toFixed(2)}
Shipping: $${order.totals.shipping.toFixed(2)}
Tax: $${order.totals.tax.toFixed(2)}
TOTAL: $${order.totals.total.toFixed(2)}
Payment Method: ${order.payment ? order.payment.method : 'N/A'}

DOWNLOAD HIGH-RESOLUTION IMAGES:
${downloadLink}

Download Link Expires: ${expiresAt.toLocaleString()}

IMPORTANT: 
- Download the images within 7 days
- Images are configured with customer's selected positioning and zoom
- Process the order and prepare for metal printing
- Mark as shipped once completed

Order Date: ${new Date(order.orderDate).toLocaleString()}
    `.trim();

    const mailOptions = {
        from: `"Photo Framer System" <${EMAIL_CONFIG.auth.user}>`,
        to: ADMIN_EMAIL,
        subject: `🔔 New Order #${orderId} - Print Required`,
        text: emailContent,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; border: 3px solid #dc3545; border-radius: 10px; padding: 20px;">
                <h2 style="color: #dc3545; text-align: center;">🔔 NEW ORDER - PRINT REQUIRED</h2>
                <h3 style="background: #dc3545; color: white; padding: 10px; border-radius: 5px; text-align: center;">Order ID: ${orderId}</h3>
                
                <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #856404;">📥 DOWNLOAD IMAGES</h3>
                    <a href="${downloadLink}" style="display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0;">
                        Download High-Resolution Images
                    </a>
                    <p style="margin: 5px 0; color: #856404;"><strong>Link Expires:</strong> ${expiresAt.toLocaleString()}</p>
                    <p style="margin: 5px 0; color: #856404;"><small>One-time use only. Download within 7 days.</small></p>
                </div>
                
                <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Customer Information</h3>
                <table style="width: 100%; background: #f8f9ff; padding: 15px; border-radius: 8px;">
                    <tr><td><strong>Name:</strong></td><td>${shipping.firstName} ${shipping.lastName}</td></tr>
                    <tr><td><strong>Email:</strong></td><td>${contact.email}</td></tr>
                    <tr><td><strong>Phone:</strong></td><td>${shipping.phone}</td></tr>
                </table>
                
                <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-top: 20px;">Shipping Address</h3>
                <div style="background: #f8f9ff; padding: 15px; border-radius: 8px;">
                    ${shipping.firstName} ${shipping.lastName}<br>
                    ${shipping.address}<br>
                    ${shipping.city}, ${shipping.state} ${shipping.zipCode}
                </div>
                
                <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-top: 20px;">Order Details</h3>
                ${order.items.map((item, index) => `
                    <div style="background: #f8f9ff; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                        <h4 style="margin-top: 0;">Item ${index + 1}</h4>
                        <strong>Frame:</strong> ${item.frameSizeName}" ${item.orientation}<br>
                        <strong>Mount:</strong> ${item.mountName}<br>
                        <strong>Price:</strong> $${item.totalPrice.toFixed(2)}
                    </div>
                `).join('')}
                
                <table style="width: 100%; margin-top: 20px; font-size: 1.1em;">
                    <tr><td>Subtotal:</td><td align="right">$${order.totals.subtotal.toFixed(2)}</td></tr>
                    <tr><td>Shipping:</td><td align="right">$${order.totals.shipping.toFixed(2)}</td></tr>
                    <tr><td>Tax:</td><td align="right">$${order.totals.tax.toFixed(2)}</td></tr>
                    <tr style="border-top: 3px solid #667eea; font-weight: bold; font-size: 1.3em; color: #667eea;">
                        <td>TOTAL:</td><td align="right">$${order.totals.total.toFixed(2)}</td>
                    </tr>
                </table>
                
                <div style="background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin-top: 30px;">
                    <h4 style="margin-top: 0; color: #1976D2;">⚠️ Action Required</h4>
                    <ol style="margin: 0; padding-left: 20px;">
                        <li>Download the high-resolution images using the link above</li>
                        <li>Process images for metal printing</li>
                        <li>Prepare for shipping</li>
                        <li>Send tracking information to customer</li>
                    </ol>
                </div>
                
                <p style="margin-top: 20px; font-size: 0.9em; color: #666;">Order Date: ${new Date(order.orderDate).toLocaleString()}</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Admin notification email sent for order:', orderId);
        return { success: true, downloadToken, expiresAt };
    } catch (error) {
        console.error('Failed to send admin email:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendCustomerConfirmation,
    sendAdminNotification,
    generateDownloadToken
};
