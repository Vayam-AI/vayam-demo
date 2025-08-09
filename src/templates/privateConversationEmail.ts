export interface PrivateConversationEmailProps {
    conversationLink: string;
    appName?: string;
    supportEmail?: string;
    adminEmail: string;
    conversationTopic?: string;
    conversationDescription?: string;
  }
  
  export const privateConversationEmail = ({
    conversationLink,
    appName = "Vayam",
    supportEmail = "support@vayam.com",
    adminEmail,
    conversationTopic,
    conversationDescription,
  }: PrivateConversationEmailProps) => {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Private Conversation Invitation</title>
          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #f8f9fa;
              }
              .container {
                  background-color: white;
                  padding: 30px;
                  border-radius: 10px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .header {
                  text-align: center;
                  margin-bottom: 30px;
              }
              .logo {
                  font-size: 24px;
                  font-weight: bold;
                  color: #2563eb;
                  margin-bottom: 10px;
              }
              .invitation-title {
                  color: #1e40af;
                  font-size: 20px;
                  margin-bottom: 20px;
              }
              .conversation-details {
                  background-color: #f1f5f9;
                  padding: 20px;
                  border-radius: 8px;
                  margin: 20px 0;
              }
              .cta-button {
                  display: inline-block;
                  background-color: #2563eb;
                  color: white;
                  padding: 12px 24px;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: 500;
                  margin: 20px 0;
              }
              .cta-button:hover {
                  background-color: #1d4ed8;
              }
              .footer {
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #e5e7eb;
                  font-size: 14px;
                  color: #6b7280;
              }
              .link-fallback {
                  word-break: break-all;
                  background-color: #f3f4f6;
                  padding: 10px;
                  border-radius: 4px;
                  margin: 10px 0;
                  font-family: monospace;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <div class="logo">${appName}</div>
                  <h1 class="invitation-title">🎉 You're Invited to a Private Conversation!</h1>
              </div>
              
              <p>Hello!</p>
              <p>You've been invited to join an exclusive private conversation on ${appName}.</p>
              
              ${conversationTopic || conversationDescription ? `
              <div class="conversation-details">
                  ${conversationTopic ? `<h3 style="margin-top: 0; color: #1e40af;">📋 Topic: ${conversationTopic}</h3>` : ''}
                  ${conversationDescription ? `<p><strong>Description:</strong> ${conversationDescription}</p>` : ''}
              </div>
              ` : ''}
              
              <div style="text-align: center; margin: 30px 0;">
                  <a href="${conversationLink}" class="cta-button">🚀 Join Conversation</a>
              </div>
              
              <p><strong>Can't click the button?</strong> Copy and paste this link into your browser:</p>
              <div class="link-fallback">${conversationLink}</div>
              
              <div class="footer">
                  <p><strong>Need Help?</strong></p>
                  <p>If you have any questions or need assistance, please don't hesitate to reach out:</p>
                  <ul>
                      <li>📧 Support Team: <a href="mailto:${supportEmail}">${supportEmail}</a></li>
                      <li>👤 Admin Contact: <a href="mailto:${adminEmail}">${adminEmail}</a></li>
                  </ul>
                  
                  <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                  <p style="text-align: center; color: #9ca3af; font-size: 12px;">
                      This is an automated message from ${appName}.<br>
                      Please do not reply directly to this email.
                  </p>
              </div>
          </div>
      </body>
      </html>
    `;
  };