import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import axios from "axios";
import { useState } from "react";
import { toast } from "sonner";

interface AddCommentDialogProps {
  zid: string;
  onCommentAdded?: () => void;
  disabled?: boolean;
  disabledMessage?: string;
}

const buttonHover = {
  scale: 1.05,
  transition: { duration: 0.2 },
};

const buttonTap = {
  scale: 0.98,
  transition: { duration: 0.1 },
};

export const AddCommentDialog = ({ zid, onCommentAdded, disabled = false, disabledMessage }: AddCommentDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate word count
  const wordCount = newComment.trim() ? newComment.trim().split(/\s+/).length : 0;
  const isWordCountValid = wordCount >= 70 && wordCount <= 150;

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    if (wordCount < 70) {
      toast.error("Comment must be at least 70 words");
      return;
    }

    if (wordCount > 150) {
      toast.error("Comment must not exceed 150 words");
      return;
    }

    const numericZid = Number(zid);
    setIsSubmitting(true);
    
    try {
      const response = await axios.post("/api/v1/comments", {
        zid: numericZid,
        txt: newComment.trim(),
        isSeed: false,
      });

      if (response.status === 201) {
        setNewComment("");
        setIsOpen(false);
        toast.success("Comment added successfully!");
        
        // Call the callback to refetch comments
        if (onCommentAdded) {
          onCommentAdded();
        }
      }
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      
      // Handle validation errors from the API
      if (error.response?.status === 400 && error.response?.data?.errors) {
        const errors = error.response.data.errors;
        if (errors.txt) {
          toast.error(errors.txt[0] || "Invalid comment format");
        } else if (errors.zid) {
          toast.error(errors.zid[0] || "Invalid conversation ID");
        } else {
          toast.error("Validation error. Please check your input.");
        }
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Failed to add comment. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.div
          whileHover={disabled ? {} : buttonHover}
          whileTap={disabled ? {} : buttonTap}
          className="add-comment"
        >
          <Button 
            className={`w-1/2 transition-all duration-200 ${
              disabled 
                ? "opacity-50 cursor-not-allowed" 
                : "hover:bg-primary hover:text-primary-foreground"
            }`}
            disabled={disabled}
            title={disabled ? disabledMessage : "Add your comment"}
          >
            <div className="flex items-center justify-center gap-4">
              <div>
                + 
              </div>
              <div>
                Add your comment
              </div>
            </div>
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="rounded-xl max-w-7xl w-[98vw] max-h-[98vh] flex flex-col overflow-hidden">
        <DialogHeader className="pb-4 flex-shrink-0">
          <DialogTitle className="text-3xl font-bold">Share your thoughts</DialogTitle>
          <DialogDescription className="text-lg text-muted-foreground">
            Be respectful and constructive in your response. Your comment should be between 70-150 words.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="space-y-6 p-1">
            <Textarea
              placeholder="Type your comment here... (70-150 words required)"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[500px] w-full text-lg resize-none leading-relaxed p-6 border-2 focus:border-primary"
            />
            <div className="flex justify-between items-center text-base bg-muted/30 rounded-lg p-4">
              <div className="text-muted-foreground font-medium">
                Word count: <span className="font-bold">{wordCount}</span>
              </div>
              <div className={`font-bold ${
                wordCount < 70 ? 'text-red-500' : 
                wordCount > 150 ? 'text-red-500' : 
                'text-green-600'
              }`}>
                {wordCount < 70 ? `${70 - wordCount} more words needed` :
                 wordCount > 150 ? `${wordCount - 150} words over limit` :
                 '✓ Word count valid'}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="pt-6 flex-shrink-0">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !newComment.trim() || !isWordCountValid}
            className="px-12 py-3 text-lg font-semibold"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Submitting...
              </>
            ) : (
              "Post Comment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
