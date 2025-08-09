// Email template interfaces and functions
export interface FlagCommentUserEmailProps {
    commentTxt: string;
    commentId: number;
    conversationId: number;
    conversationTopic: string;
    conversationDescription: string;
    appName?: string;
    supportEmail?: string;
    ownerEmail: string;
    flagReason: string;
  }
  
  export const flagCommentUserEmail = ({
    commentTxt,
    commentId,
    conversationId,
    conversationTopic,
    conversationDescription,
    appName = "Vayam",
    supportEmail = "support@vayam.com",
    ownerEmail,
    flagReason
  }: FlagCommentUserEmailProps) => {
    const subject = `Your comment has been flagged in "${conversationTopic}"`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${appName} Comment Flag Notification</h2>
        <p>Hello,</p>
        <p>Your comment in the conversation <strong>"${conversationTopic}"</strong> has been flagged by the conversation owner.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545; margin: 15px 0;">
          <p><strong>Flag Reason:</strong> ${flagReason}</p>
          <p><strong>Your Comment:</strong> ${commentTxt}</p>
        </div>
        
        <p>Your comment will not be displayed until an administrator reviews this flag.</p>
        <p>If you believe this was done in error, you may contact the conversation owner at ${ownerEmail} or our support team at ${supportEmail}.</p>
        
        <div style="margin-top: 30px; font-size: 0.9em; color: #6c757d;">
          <p>Conversation ID: ${conversationId}</p>
          <p>Comment ID: ${commentId}</p>
        </div>
        
        <p style="margin-top: 20px;">Thank you,<br>The ${appName} Team</p>
      </div>
    `;
    
    return { subject, html };
  };