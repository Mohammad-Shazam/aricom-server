// emailTemplates.js

// Helper function to format dates (optional)
const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  // Handle both Firebase Timestamps and ISO strings
  if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleString();
  }
  if (timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
      return date.toLocaleString();
  }
  return 'N/A';
};

const generateContactNotification = (data) => {
  const formattedDate = formatDate(data.createdAt);
  return {
      subject: `New Contact Message: ${data.subject || 'No Subject'}`,
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2c3e50;">New Contact Message Received</h2>
              <p><strong>Received At:</strong> ${formattedDate}</p>
              <hr style="border: 1px solid #eee;">
              
              <h3 style="color: #2c3e50;">Contact Details</h3>
              <p><strong>Name:</strong> ${data.firstName || ''} ${data.lastName || ''}</p>
              <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email || 'N/A'}</a></p>
              <p><strong>Phone:</strong> ${data.phone || 'N/A'}</p>
              <p><strong>Subject:</strong> ${data.subject || 'N/A'}</p>
              
              <hr style="border: 1px solid #eee;">
              
              <h3 style="color: #2c3e50;">Message</h3>
              <div style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
                  ${data.message || 'N/A'}
              </div>
              
              <hr style="border: 1px solid #eee;">
              
              <p style="font-size: 0.9em; color: #7f8c8d;">
                  This message was sent via the Aricom Studios contact form.
              </p>
          </div>
      `,
  };
};
  
const generateModificationNotification = (data) => {
  const formattedDate = formatDate(data.createdAt);
  return {
      subject: `Modification Request for Plan: ${data.planTitle || data.planId || 'N/A'}`,
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2c3e50;">New Plan Modification Request</h2>
              <p><strong>Received At:</strong> ${formattedDate}</p>
              <hr style="border: 1px solid #eee;">
              
              <h3 style="color: #2c3e50;">Requester Details</h3>
              <p><strong>Name:</strong> ${data.name || 'N/A'}</p>
              <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email || 'N/A'}</a></p>
              <p><strong>Phone:</strong> ${data.phone || 'N/A'}</p>
              
              <hr style="border: 1px solid #eee;">
              
              <h3 style="color: #2c3e50;">Plan Information</h3>
              <p><strong>Plan Title:</strong> ${data.planTitle || 'N/A'}</p>
              <p><strong>Plan ID:</strong> ${data.planId || 'N/A'}</p>
              <p><strong>Current Status:</strong> <span style="color: ${data.status === 'pending' ? '#e67e22' : '#2ecc50'}">${data.status || 'N/A'}</span></p>
              
              <hr style="border: 1px solid #eee;">
              
              <h3 style="color: #2c3e50;">Requested Modifications</h3>
              <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; white-space: pre-wrap;">
                  ${data.modifications || 'No modifications details provided'}
              </div>
              
              <hr style="border: 1px solid #eee;">
              
              <p style="font-size: 0.9em; color: #7f8c8d;">
                  Please review this modification request in the admin panel.
              </p>
          </div>
      `,
  };
};
  
const generateOrderConfirmation = (data) => {
  const formattedDate = formatDate(data.createdAt || new Date());
  return {
      subject: `Your Aricom Studios Order Confirmation (${data.id || 'N/A'})`,
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2c3e50;">Thank You For Your Order, ${data.userName || 'Customer'}!</h2>
              <p>We've received your order and are processing it.</p>
              
              <hr style="border: 1px solid #eee;">
              
              <h3 style="color: #2c3e50;">Order Summary</h3>
              <p><strong>Order Number:</strong> ${data.id || 'N/A'}</p>
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Payment Method:</strong> ${data.paymentMethod ? data.paymentMethod.charAt(0).toUpperCase() + data.paymentMethod.slice(1) : 'N/A'}</p>
              
              ${data.planTitle ? `
              <h3 style="color: #2c3e50; margin-top: 20px;">Plan Details</h3>
              <p><strong>Plan:</strong> ${data.planTitle}</p>
              ${data.planId ? `<p><strong>Plan ID:</strong> ${data.planId}</p>` : ''}
              ${data.price ? `<p><strong>Price:</strong> $${data.price}</p>` : ''}
              ` : ''}
              
              <hr style="border: 1px solid #eee;">
              
              <h3 style="color: #2c3e50;">Customer Information</h3>
              <p><strong>Name:</strong> ${data.userName || 'N/A'}</p>
              <p><strong>Email:</strong> <a href="mailto:${data.userEmail}">${data.userEmail || 'N/A'}</a></p>
              ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
              
              <hr style="border: 1px solid #eee;">
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                  <h4 style="color: #2c3e50; margin-top: 0;">Next Steps</h4>
                  ${data.paymentMethod === 'invoice' ? `
                  <p>Since you selected <strong>Invoice</strong> as your payment method, our team will contact you shortly with payment details.</p>
                  ` : `
                  <p>Your order is being processed. You'll receive another email once it's completed.</p>
                  `}
                  <p>If you have any questions, please reply to this email.</p>
              </div>
              
              <p style="margin-top: 20px;">Thank you for choosing Aricom Studios!</p>
          </div>
      `,
  };
};

const generateOrderNotificationAdmin = (data) => {
  const formattedDate = formatDate(data.createdAt || new Date());
  return {
      subject: `New Order Received: ${data.userName || 'Customer'} (${data.id || 'No ID'})`,
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2c3e50;">New Order Notification</h2>
              <p><strong>Received:</strong> ${formattedDate}</p>
              
              <hr style="border: 1px solid #eee;">
              
              <h3 style="color: #2c3e50;">Order Details</h3>
              <p><strong>Order ID:</strong> ${data.id || 'N/A'}</p>
              <p><strong>Payment Method:</strong> ${data.paymentMethod ? data.paymentMethod.charAt(0).toUpperCase() + data.paymentMethod.slice(1) : 'N/A'}</p>
              
              ${data.planTitle ? `
              <h4 style="color: #2c3e50; margin-top: 15px;">Plan Information</h4>
              <p><strong>Plan:</strong> ${data.planTitle}</p>
              ${data.planId ? `<p><strong>Plan ID:</strong> ${data.planId}</p>` : ''}
              ${data.price ? `<p><strong>Price:</strong> $${data.price}</p>` : ''}
              ` : ''}
              
              <hr style="border: 1px solid #eee;">
              
              <h3 style="color: #2c3e50;">Customer Information</h3>
              <p><strong>Name:</strong> ${data.userName || 'N/A'}</p>
              <p><strong>Email:</strong> <a href="mailto:${data.userEmail}">${data.userEmail}</a></p>
              ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
              
              <hr style="border: 1px solid #eee;">
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                  <h4 style="color: #2c3e50; margin-top: 0;">Action Required</h4>
                  ${data.paymentMethod === 'invoice' ? `
                  <p>This customer selected <strong>Invoice</strong> payment. Please send them the invoice details.</p>
                  ` : `
                  <p>Please process this order in the system.</p>
                  `}
                  <p><a href="mailto:${data.userEmail}?subject=Regarding Order ${data.id}">Reply to Customer</a></p>
              </div>
          </div>
      `,
  };
};
  
  
  module.exports = {
    generateContactNotification,
    generateModificationNotification,
    generateOrderConfirmation,
    generateOrderNotificationAdmin
  };