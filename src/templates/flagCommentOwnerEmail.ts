export interface FlagCommentOwnerEmailProps {
    commentTxt: string;
    commentId: number;
    conversationId: number;
    conversationTopic: string;
    conversationDescription: string;
    appName?: string;
    supportEmail?: string;
    commentAuthorEmail: string;
    flagReason: string;
  }
  
  export const flagCommentOwnerEmail = ({
    commentTxt,
    commentId,
    conversationId,
    conversationTopic,
    conversationDescription,
    appName = "Vayam",
    supportEmail = "support@vayam.com",
    commentAuthorEmail,
    flagReason
  }: FlagCommentOwnerEmailProps) => {
    const subject = `Flag report received for comment in "${conversationTopic}"`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${appName} Flag Report Confirmation</h2>
        <p>Hello,</p>
        <p>Thank you for reporting a comment in your conversation <strong>"${conversationTopic}"</strong>. Our team has been notified and will review your report.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0;">
          <p><strong>Flag Reason:</strong> ${flagReason}</p>
          <p><strong>Reported Comment:</strong> ${commentTxt}</p>
          <p><strong>Comment Author:</strong> ${commentAuthorEmail}</p>
        </div>
        
        <p>We'll notify you once our team has reviewed this report and taken appropriate action.</p>
        <p>If you have any additional concerns, please contact our support team at ${supportEmail}.</p>
        
        <div style="margin-top: 30px; font-size: 0.9em; color: #6c757d;">
          <p>Conversation ID: ${conversationId}</p>
          <p>Comment ID: ${commentId}</p>
        </div>
        
        <p style="margin-top: 20px;">Thank you for helping maintain our community standards.<br>The ${appName} Team</p>
      </div>
    `;
    
    return { subject, html };
  };