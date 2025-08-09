export interface FlagCommentAdminEmailProps {
    commentTxt: string;
    commentId: number;
    conversationId: number;
    conversationTopic: string;
    conversationDescription: string;
    appName?: string;
    supportEmail?: string;
    ownerEmail: string;
    commentAuthorEmail: string;
    flagReason: string;
    ownerName: string;
    commentAuthorName: string;
  }
  
  export const flagCommentAdminEmail = ({
    commentTxt,
    commentId,
    conversationId,
    conversationTopic,
    conversationDescription,
    appName = "Vayam",
    supportEmail = "support@vayam.com",
    ownerEmail,
    commentAuthorEmail,
    flagReason,
    ownerName,
    commentAuthorName
  }: FlagCommentAdminEmailProps) => {
    const subject = `[Action Required] Comment Flagged in "${conversationTopic}"`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h2 style="color: #333;">${appName} Admin Flag Notification</h2>
        <p>A comment has been flagged and requires your review.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #0d6efd; margin: 15px 0;">
          <h3 style="margin-top: 0;">Conversation Details</h3>
          <p><strong>Topic:</strong> ${conversationTopic}</p>
          <p><strong>Description:</strong> ${conversationDescription}</p>
          <p><strong>Conversation ID:</strong> ${conversationId}</p>
          
          <h3>Comment Details</h3>
          <p><strong>Comment ID:</strong> ${commentId}</p>
          <p><strong>Comment Text:</strong> ${commentTxt}</p>
          <p><strong>Flag Reason:</strong> ${flagReason}</p>
          
          <h3>User Details</h3>
          <p><strong>Comment Author:</strong> ${commentAuthorName} (${commentAuthorEmail})</p>
          <p><strong>Conversation Owner:</strong> ${ownerName} (${ownerEmail})</p>
        </div>
        
        <p>Please review this flag and take appropriate action through the admin dashboard.</p>
        
        <div style="margin-top: 30px; padding: 15px; background-color: #f1f8ff; border-radius: 5px;">
          <p><strong>Quick Actions:</strong></p>
          <ul>
            <li><a href="${process.env.ADMIN_DASHBOARD_URL}/comments/${commentId}/review">Review Comment</a></li>
            <li><a href="${process.env.ADMIN_DASHBOARD_URL}/users/${commentAuthorEmail}">View Comment Author</a></li>
            <li><a href="${process.env.ADMIN_DASHBOARD_URL}/conversations/${conversationId}">View Conversation</a></li>
          </ul>
        </div>
        
        <p style="margin-top: 20px;">Thank you,<br>The ${appName} Team</p>
      </div>
    `;
    
    return { subject, html };
  };