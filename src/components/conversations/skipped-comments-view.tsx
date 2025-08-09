"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ThumbsUp, ThumbsDown, Meh, ChevronRight, MoveLeft } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { AddCommentDialog } from "@/components/conversations/add-comment-dialog";

type VoteType = -1 | 0 | 1;

interface SkippedComment {
  tid: number;
  zid: number;
  uid: number;
  txt: string;
  created: string;
  modified: string;
  isSeed: boolean;
  votes?: any[];
  flagStatus?: string;
}

interface SkippedCommentsViewProps {
  zid: number;
  onVote: (tid: number, vote: number) => void;
  onStar: (tid: number) => void;
  onShowQuestion: () => void;
  isVoting: boolean;
  isMobile: boolean;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTap: () => void;
  commentCardRef: React.RefObject<HTMLDivElement>;
  onContinue: () => void;
  onCommentAdded?: () => void;
}

function getUidFromCookie() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )uid=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export const SkippedCommentsView = ({
  zid,
  onContinue,
  onCommentAdded,
}: SkippedCommentsViewProps) => {
  const uid = getUidFromCookie();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skippedComments, setSkippedComments] = useState<SkippedComment[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [starred, setStarred] = useState<Set<number>>(new Set());
  const [voting, setVoting] = useState<{ [tid: number]: boolean }>({});
  const [isMobile, setIsMobile] = useState(false);
  const [cardAnimation, setCardAnimation] = useState<any>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const commentCardRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  // Detect mobile
  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth <= 768);
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Fetch skipped comments and star status
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [commentsRes, starRes] = await Promise.all([
          axios.get(`/api/v1/user/conversations/skipped-comments?zid=${zid}`),
          axios.get(`/api/v1/user/stars`),
        ]);
        
        setSkippedComments(commentsRes.data.data.skippedComments || []);
        setStarred(new Set((starRes.data.data || []).map((c: any) => c.tid)));
      } catch (err: any) {
        setError(err?.response?.data?.error || "Failed to load skipped comments.");
      } finally {
        setLoading(false);
      }
    };
    
    if (zid) fetchData();
  }, [zid]);

  // Helper to get the user's vote for a comment
  const getUserVote = (tid: number) => {
    const comment = skippedComments.find(c => c.tid === tid);
    if (!comment || !comment.votes || !Array.isArray(comment.votes)) return null;
    const userVote = comment.votes.find((v: any) => v.uid === Number(uid));
    return userVote ? userVote.vote : null;
  };

  // Handle vote with animation and next logic
  const handleVote = async (tid: number, vote: VoteType) => {
    if (!uid) {
      toast.error("Login required");
      return;
    }
    
    if (isAnimating) {
      toast.error("Please wait for the animation to finish.");
      return;
    }
    
    const userVote = getUserVote(tid);
    if (userVote === vote) {
      toast.info("You have already voted on this reaction.");
      animateAndNext(userVote);
      return;
    }
    
    setVoting((prev) => ({ ...prev, [tid]: true }));
    setIsAnimating(true);
    
    animateAndNext(vote);
    
    try {
      const res = await axios.post("/api/v1/votes", {
        zid: Number(zid),
        tid: Number(tid),
        vote: Number(vote),
      });
      if (res.data?.message === "Vote updated") {
        toast.success("Vote updated!");
      } else {
        toast.success("Vote recorded successfully!");
      }
      // Refresh the comments to get updated vote counts
      const commentsRes = await axios.get(`/api/v1/user/conversations/skipped-comments?zid=${zid}`);
      setSkippedComments(commentsRes.data.data.skippedComments || []);
    } catch (error: any) {
      if (error?.response?.data?.message === "Already voted this way") {
        toast.info("You have already voted on this reaction.");
        animateAndNext(userVote);
      } else {
        toast.error("Failed to record vote. Please try again.");
      }
    } finally {
      setVoting((prev) => ({ ...prev, [tid]: false }));
    }
  };

  // Animation and next logic
  const animateAndNext = (vote: VoteType) => {
    let anim;
    if (vote === 1) anim = { x: 500, opacity: 0, rotate: 15 };
    else if (vote === -1) anim = { x: -500, opacity: 0, rotate: -15 };
    else anim = { scale: 0.85, opacity: 0.5 };
    setCardAnimation(anim);
    setTimeout(() => {
      setCardAnimation(null);
      setCurrentIndex((i) => Math.min(i + 1, skippedComments.length));
      setIsAnimating(false);
    }, 400);
  };

  // Next arrow handler
  const handleNext = () => {
    if (isAnimating) return;
    setCardAnimation({ x: 500, opacity: 0, rotate: 10 });
    setIsAnimating(true);
    setTimeout(() => {
      setCardAnimation(null);
      setCurrentIndex((i) => Math.min(i + 1, skippedComments.length));
      setIsAnimating(false);
    }, 400);
  };

  // Star logic
  const handleStar = async (tid: number) => {
    if (!uid) return toast.error("Login required");
    setStarred((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tid)) newSet.delete(tid);
      else newSet.add(tid);
      return newSet;
    });
    try {
      if (starred.has(tid))
        await axios.delete("/api/v1/user/stars", { data: { tid } });
      else await axios.post("/api/v1/user/stars", { tid });
    } catch {
      setStarred((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(tid)) newSet.delete(tid);
        else newSet.add(tid);
        return newSet;
      });
      toast.error("Failed to update star");
    }
  };

  // Touch/Swipe logic
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = touchStartX.current - currentX;
    const diffY = touchStartY.current - currentY;
    if (Math.abs(diffX) > Math.abs(diffY)) {
      const swipePercentage = (diffX / window.innerWidth) * 100;
      const limitedSwipe = Math.max(Math.min(swipePercentage, 30), -30);
      if (commentCardRef.current) {
        commentCardRef.current.style.transform = `translateX(${-limitedSwipe}px)`;
        if (limitedSwipe > 15)
          commentCardRef.current.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
        else if (limitedSwipe < -15)
          commentCardRef.current.style.backgroundColor = "rgba(34, 197, 94, 0.1)";
        else commentCardRef.current.style.backgroundColor = "";
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, tid: number) => {
    if (!touchStartX.current || !touchStartY.current) return;
    touchEndX.current = e.changedTouches[0].clientX;
    touchEndY.current = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;
    if (commentCardRef.current) {
      commentCardRef.current.style.transform = "";
      commentCardRef.current.style.backgroundColor = "";
    }
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > 100) {
        if (diffX > 0) handleVote(tid, -1);
        else handleVote(tid, 1);
      }
    } else {
      if (diffY > 100) setCurrentIndex((i) => Math.min(i + 1, skippedComments.length));
    }
    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  const handleTap = (tid: number) => {
    if (!isMobile) return;
    const userVote = getUserVote(tid);
    if (userVote !== 0) handleVote(tid, 0);
  };

  // Get current comment
  const currentComment = skippedComments[currentIndex];

  // Calculate vote counts
  const voteCounts = useMemo(() => {
    if (!currentComment)
      return { likes: 0, dislikes: 0, neutral: 0, userVote: null };
    
    const userVote = getUserVote(currentComment.tid);
    const counts = (currentComment.votes || []).reduce(
      (acc: any, vote: any) => {
        if (vote.vote === 1) acc.likes++;
        else if (vote.vote === -1) acc.dislikes++;
        else if (vote.vote === 0) acc.neutral++;
        return acc;
      },
      { likes: 0, dislikes: 0, neutral: 0 }
    );
    return { ...counts, userVote };
  }, [currentComment, uid, skippedComments]);

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto py-10 px-2 md:px-0">
        <div className="flex items-center justify-center min-h-[60vh]">
          <span>Loading skipped comments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-2xl mx-auto py-10 px-2 md:px-0">
        <div className="flex items-center justify-center min-h-[60vh] text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (!skippedComments.length) {
    return (
      <div className="container max-w-2xl mx-auto py-10 px-2 md:px-0">
        <Button onClick={onContinue} className="mb-4">
          <MoveLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
          No skipped comments found.
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-10 px-2 md:px-0">
      <Button onClick={onContinue} className="mb-4">
        <MoveLeft className="mr-2 h-4 w-4" /> Back to Conversation
      </Button>
      
      <div className="w-full max-w-xl mx-auto px-2">
        <div className="relative w-full">
          <AnimatePresence mode="wait">
            {currentComment ? (
              <motion.div
                key={currentComment.tid}
                ref={commentCardRef}
                initial={{ scale: 0.98, opacity: 0 }}
                animate={cardAnimation || { scale: 1, opacity: 1, x: 0, rotate: 0 }}
                exit={{ scale: 0.98, opacity: 0 }}
                transition={{ type: "spring", stiffness: 120 }}
                className={`w-full ${getUserVote(currentComment.tid) !== null ? "ring-2 ring-primary/70" : ""}`}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={(e) => handleTouchEnd(e, currentComment.tid)}
                onClick={() => handleTap(currentComment.tid)}
              >
                <Card className="relative overflow-hidden group transition-transform">
                  <CardContent className="pt-6 pb-4 px-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {currentIndex + 1}/{skippedComments.length}
                        </Badge>
                        <Badge variant="secondary">Skipped</Badge>
                        {currentComment.isSeed && (
                          <Badge variant="secondary">Seed</Badge>
                        )}
                      </div>
                      <div
                        className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStar(currentComment.tid);
                        }}
                        title={
                          starred.has(currentComment.tid) ? "Unstar" : "Star"
                        }
                      >
                        <Star
                          className={
                            starred.has(currentComment.tid)
                              ? "w-5 h-5 fill-yellow-400 text-yellow-400"
                              : "w-5 h-5 text-gray-500"
                          }
                        />
                      </div>
                    </div>
                    {currentComment.flagStatus === 'pending' && (
                      <div className="flex items-center gap-2 mb-2 text-yellow-700 bg-yellow-100 px-3 py-2 rounded">
                        <Meh className="w-4 h-4 text-yellow-700" />
                        <span className="font-medium">This comment is under review.</span>
                      </div>
                    )}
                    <div className="text-xl text-foreground leading-relaxed text-center mb-4">
                      {currentComment.txt}
                    </div>
                    <div className="flex gap-4 justify-between mt-4">
                      <div
                        className={`flex items-center gap-1 cursor-pointer hover:opacity-80 transition px-2 py-1 rounded-md ${getUserVote(currentComment.tid) === -1 ? "bg-red-100 text-red-700 font-bold scale-105" : ""}`}
                        onClick={() => handleVote(currentComment.tid, -1)}
                        style={{ 
                          pointerEvents: getUserVote(currentComment.tid) !== null ? "none" : "auto", 
                          opacity: getUserVote(currentComment.tid) !== null && getUserVote(currentComment.tid) !== -1 ? 0.5 : 1 
                        }}
                      >
                        <ThumbsDown
                          className={
                            getUserVote(currentComment.tid) === -1
                              ? "w-5 h-5 text-red-600"
                              : "w-5 h-5 text-gray-500"
                          }
                        />
                        <span className="text-sm text-gray-600">{voteCounts.dislikes}</span>
                      </div>
                      <div
                        className={`flex items-center gap-1 cursor-pointer hover:opacity-80 transition px-2 py-1 rounded-md ${getUserVote(currentComment.tid) === 0 ? "bg-yellow-100 text-yellow-700 font-bold scale-105" : ""}`}
                        onClick={() => handleVote(currentComment.tid, 0)}
                        style={{ 
                          pointerEvents: getUserVote(currentComment.tid) !== null ? "none" : "auto", 
                          opacity: getUserVote(currentComment.tid) !== null && getUserVote(currentComment.tid) !== 0 ? 0.5 : 1 
                        }}
                      >
                        <Meh
                          className={
                            getUserVote(currentComment.tid) === 0
                              ? "w-5 h-5 text-yellow-600"
                              : "w-5 h-5 text-gray-500"
                          }
                        />
                        <span className="text-sm text-gray-600">{voteCounts.neutral}</span>
                      </div>
                      <div
                        className={`flex items-center gap-1 cursor-pointer hover:opacity-80 transition px-2 py-1 rounded-md ${getUserVote(currentComment.tid) === 1 ? "bg-green-100 text-green-700 font-bold scale-105" : ""}`}
                        onClick={() => handleVote(currentComment.tid, 1)}
                        style={{ 
                          pointerEvents: getUserVote(currentComment.tid) !== null ? "none" : "auto", 
                          opacity: getUserVote(currentComment.tid) !== null && getUserVote(currentComment.tid) !== 1 ? 0.5 : 1 
                        }}
                      >
                        <ThumbsUp
                          className={
                            getUserVote(currentComment.tid) === 1
                              ? "w-5 h-5 text-green-600"
                              : "w-5 h-5 text-gray-500"
                          }
                        />
                        <span className="text-sm text-gray-600">{voteCounts.likes}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="no-more-comments"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full"
              >
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="text-xl font-semibold mb-4">
                      All skipped comments reviewed!
                    </div>
                    <AddCommentDialog zid={String(zid)} onCommentAdded={onCommentAdded} />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {currentIndex < skippedComments.length - 1 && (
          <Button
            variant="ghost"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10"
            onClick={handleNext}
            disabled={isAnimating}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        )}
      </div>
    </div>
  );
};