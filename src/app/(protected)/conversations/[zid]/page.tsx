"use client";

import type React from "react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ChevronRight,
  MoveLeft,
  Heart,
  HeartOff,
  Minus,
} from "lucide-react";
import axios from "axios";
import Loading from "@/components/ui/loading";
import { AnimatePresence, motion } from "framer-motion";
import { AddCommentDialog } from "@/components/conversations/add-comment-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Lottie from "lottie-react";
import addCommentAnimation from "../../../../../public/assets/addComment.json";
import { NoConversations } from "@/components/conversations/no-conversations";

// TypeScript interfaces
type VoteType = -1 | 0 | 1;

interface Vote {
  tid: number;
  zid: number;
  pid?: number;
  uid: number;
  vote: number;
  created?: string;
  modified?: string;
}

interface Comment {
  tid: number;
  zid: number;
  pid?: number;
  uid?: string;
  txt: string;
  agid?: number;
  created?: string;
  modified?: string;
  flagStatus?: string;
  isSeed?: boolean;
  votes: Vote[];
  userVote?: Vote | null; // Add user's specific vote
}

interface Conversation {
  zid: number;
  topic?: string;
  description?: string;
  infoImages?: string[];
  tags?: string[];
  is_active?: boolean;
  created?: string;
  modified?: string;
  comments: Comment[];
}

interface ApiResponse {
  success: boolean;
  data?: Conversation;
  error?: string;
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const zid = params?.zid as string;
  const uid = session?.user?.id;

  // State management
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showQuestion, setShowQuestion] = useState<boolean>(true);
  const [showVoting, setShowVoting] = useState<boolean>(true);
  const [voting, setVoting] = useState<{ [tid: number]: boolean }>({});
  const [pageLoading, setPageLoading] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [cardAnimation, setCardAnimation] = useState<any>(null);
  const [viewedCommentsCount, setViewedCommentsCount] = useState<number>(0);

  // Touch/swipe refs
  const commentCardRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState<boolean>(false);

  // Detect mobile
  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth <= 768);
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  // Fisher-Yates shuffle algorithm
  const shuffleComments = useCallback((commentsArr: Comment[]): number[] => {
    const indices = Array.from({ length: commentsArr.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }, []);

  // Fetch conversation and comments
  const fetchConversation = useCallback(async (): Promise<void> => {
    if (!zid || !uid || status !== "authenticated") return;
    setPageLoading(true);
    try {
      const convRes = await axios.get(`/api/v1/conversations/${zid}`);
      setConversation(convRes.data.data);
      const loadedComments = convRes.data.data.comments || [];
      setComments(loadedComments);
      // Shuffle indices for comments
      setShuffledIndices(shuffleComments(loadedComments));
      setCurrentIndex(0);
      setViewedCommentsCount(0);
    } catch (e) {
      setError("Failed to load conversation");
      console.error("[fetchConversation] Error:", e);
    } finally {
      setPageLoading(false);
    }
  }, [zid, uid, status, shuffleComments]);

  useEffect(() => {
    if (uid && status === "authenticated") {
      fetchConversation();
    }
  }, [uid, status, fetchConversation]);

  // Helper to get the user's vote for a comment
  const getUserVote = (tid: number): number | null => {
    const comment = comments.find((c) => c.tid === tid);
    if (!comment) return null;
    
    // First check if we have the userVote field from the API
    if (comment.userVote) {
      return comment.userVote.vote;
    }
    
    // Fallback to searching through votes array
    if (!comment.votes) return null;
    const userVote = comment.votes.find((v: Vote) => v.uid === Number(uid));
    return userVote ? userVote.vote : null;
  };

  // Handle voting
  const handleVote = async (tid: number, vote: VoteType): Promise<void> => {
    if (!uid) {
      //toast.error('Login required');
      return;
    }
    if (isAnimating) {
      //toast.error('Please wait for the animation to finish.');
      return;
    }

    const userVote = getUserVote(tid);
    if (userVote === vote) {
      //toast.info('You have already voted on this reaction.');
      animateAndNext(userVote);
      return;
    }

    setVoting((prev) => ({ ...prev, [tid]: true }));
    setIsAnimating(true);

    // Update vote locally first for immediate feedback
    setComments((prevComments) =>
      prevComments.map((comment) => {
        if (comment.tid === tid) {
          // Remove existing vote from this user
          const filteredVotes = comment.votes.filter(
            (v) => v.uid !== Number(uid)
          );
          // Add new vote
          const newVote: Vote = {
            tid: Number(tid),
            zid: Number(zid),
            uid: Number(uid),
            vote: vote,
            created: new Date().toISOString(),
          };
          return {
            ...comment,
            votes: [...filteredVotes, newVote],
            userVote: newVote, // Update user's specific vote
          };
        }
        return comment;
      })
    );

    // Animate and move to next comment immediately
    animateAndNext(vote);

    try {
      const res = await axios.post("/api/v1/votes", {
        zid: Number(zid),
        tid: Number(tid),
        vote: Number(vote),
      });

      if (res.data?.message === "Vote updated") {
        //toast.success('Vote updated!');
      } else {
        //toast.success('Vote recorded successfully!');
      }
      // Don't fetch conversation here - we've already updated locally
    } catch (error: any) {
      if (error?.response?.data?.message === "Already voted this way") {
        //toast.info('You have already voted on this reaction.');
      } else {
        //toast.error('Failed to record vote. Please try again.');
        // Revert local changes on error
        setComments((prevComments) =>
          prevComments.map((comment) => {
            if (comment.tid === tid) {
              const filteredVotes = comment.votes.filter(
                (v) => v.uid !== Number(uid)
              );
              if (userVote !== null) {
                const originalVote: Vote = {
                  tid: Number(tid),
                  zid: Number(zid),
                  uid: Number(uid),
                  vote: userVote,
                  created: new Date().toISOString(),
                };
                return {
                  ...comment,
                  votes: [...filteredVotes, originalVote],
                  userVote: originalVote, // Restore original user vote
                };
              }
              return {
                ...comment,
                votes: filteredVotes,
                userVote: null, // No vote
              };
            }
            return comment;
          })
        );
      }
    } finally {
      setVoting((prev) => ({ ...prev, [tid]: false }));
    }
  };

  // Animation and next logic
  const animateAndNext = (vote: VoteType): void => {
    let anim;
    if (vote === 1) anim = { x: 500, opacity: 0, rotate: 15 };
    else if (vote === -1) anim = { x: -500, opacity: 0, rotate: -15 };
    else anim = { scale: 0.85, opacity: 0.5 };

    setCardAnimation(anim);
    setTimeout(() => {
      setCardAnimation(null);
      setCurrentIndex((i) => Math.min(i + 1, shuffledIndices.length));
      setViewedCommentsCount((prev) => prev + 1);
      setIsAnimating(false);
    }, 300); // Reduced from 400ms for faster transition
  };

  // Next arrow handler
  const handleNext = (): void => {
    if (isAnimating) return;
    setCardAnimation({ x: 500, opacity: 0, rotate: 10 });
    setIsAnimating(true);
    setTimeout(() => {
      setCardAnimation(null);
      setCurrentIndex((i) => Math.min(i + 1, shuffledIndices.length));
      setViewedCommentsCount((prev) => prev + 1);
      setIsAnimating(false);
    }, 300); // Reduced from 400ms for faster transition
  };

  // Touch/Swipe handlers
  const handleTouchStart = (e: React.TouchEvent): void => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent): void => {
    if (!touchStartX.current || !touchStartY.current) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = touchStartX.current - currentX;
    const diffY = touchStartY.current - currentY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      const swipePercentage = (diffX / window.innerWidth) * 100;
      const limitedSwipe = Math.max(Math.min(swipePercentage, 30), -30);
      setSwipeDirection(-limitedSwipe);

      if (commentCardRef.current) {
        commentCardRef.current.style.transform = `translateX(${-limitedSwipe}px)`;
        if (limitedSwipe > 15) {
          commentCardRef.current.style.backgroundColor =
            "rgba(239, 68, 68, 0.1)";
        } else if (limitedSwipe < -15) {
          commentCardRef.current.style.backgroundColor =
            "rgba(34, 197, 94, 0.1)";
        } else {
          commentCardRef.current.style.backgroundColor = "";
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, tid: number): void => {
    if (!touchStartX.current || !touchStartY.current) {
      setIsSwiping(false);
      return;
    }

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
      if (diffY > 100) {
        setCurrentIndex((i) => Math.min(i + 1, shuffledIndices.length));
        setViewedCommentsCount((prev) => prev + 1);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
    setSwipeDirection(0);
    setIsSwiping(false);
  };

  const handleTap = (tid: number): void => {
    if (!isMobile) return;
    const userVote = getUserVote(tid);
    if (userVote !== 0) handleVote(tid, 0);
  };

  // Filter visible comments
  const visibleComments = useMemo(() => {
    return comments.filter(
      (c) => c.flagStatus !== "accepted" && c.flagStatus !== "flagged"
    );
  }, [comments]);

  const currentComment =
    visibleComments.length > 0 && shuffledIndices.length > 0
      ? visibleComments[shuffledIndices[currentIndex]]
      : null;

  const voteCounts = useMemo(() => {
    if (!currentComment)
      return { likes: 0, dislikes: 0, neutral: 0, userVote: null };

    const userVote = getUserVote(currentComment.tid);
    const counts = currentComment.votes.reduce(
      (acc: any, vote: Vote) => {
        if (vote.vote === 1) acc.likes++;
        else if (vote.vote === -1) acc.dislikes++;
        else if (vote.vote === 0) acc.neutral++;
        return acc;
      },
      { likes: 0, dislikes: 0, neutral: 0 }
    );

    return { ...counts, userVote };
  }, [currentComment, uid, comments]);

  // Check if add comment should be shown
  const shouldShowAddComment = useMemo(() => {
    const totalComments = visibleComments.length;
    // Only show add comment at the very end
    return currentIndex >= totalComments;
  }, [visibleComments.length, currentIndex]);

  // Check if user can add comment (after viewing 10 comments or all available comments)
  const canAddComment = useMemo(() => {
    return viewedCommentsCount >= 10 || viewedCommentsCount >= visibleComments.length;
  }, [viewedCommentsCount, visibleComments.length]);

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ): void => {
    const target = e.target as HTMLImageElement;
    target.style.display = "none";
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const getUserInitial = (uid: string | undefined): string => {
    if (!uid) return "A";
    return uid.charAt(0).toUpperCase();
  };

  if (status === "loading" || pageLoading) {
    return <Loading />;
  }

  if (error) {
    return <div className="text-center text-destructive py-12">{error}</div>;
  }

  if (
    !conversation ||
    (Array.isArray(conversation) && conversation.length === 0)
  ) {
    return <NoConversations />;
  }

  return (
    <div className="min-h-screen px-4 pt-2 sm:px-8 lg:px-24">
      {/* <Button onClick={() => router.push("/home")} className="mb-4 ">
          <div className="flex items-center gap-2">
            <MoveLeft className="mr-2 h-4 w-4" />
            <div className="text-sm">Back</div>
          </div>
        </Button> */}

      {/* Header Section - Always Visible */}
      <div className=" rounded-lg shadow-sm mb-8 overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">{conversation.topic}</h1>

          {/* Content Area - Changes based on state */}
          {!showVoting ? (
            <>
              {/* About Section */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  About
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {conversation.description}
                </p>
              </div>

              {/* Info Images Grid */}
              {conversation.infoImages &&
                conversation.infoImages.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {conversation.infoImages.map(
                      (image: string, index: number) => (
                        <div
                          key={index}
                          className="bg-muted/50 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow aspect-video"
                        >
                          <img
                            src={image || "/placeholder.svg"}
                            alt={`Info image ${index + 1}`}
                            className="w-full h-full object-contain bg-muted"
                            onError={handleImageError}
                          />
                        </div>
                      )
                    )}
                  </div>
                )}

              {/* Tags */}
              {conversation.tags && conversation.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-8">
                  {conversation.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Start Voting Button */}
              <div className="text-center">
                <Button onClick={() => setShowVoting(true)}>
                  Start Voting
                </Button>
              </div>
            </>
          ) : (
            /* Voting Interface - New Layout */
            <div className="fixed inset-0 bg-background z-50 flex flex-col">
              {/* Header Bar */}
              <div className="flex items-center justify-between p-3 border-b">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVoting(false)}
                >
                  <MoveLeft className="w-4 h-4 mr-2" />
                  About
                </Button>

                {/* Next button */}
                {currentIndex < visibleComments.length &&
                  !shouldShowAddComment && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNext}
                      disabled={isAnimating}
                    >
                      Skip
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {/* Fixed conversation title at the top */}
                <div className="w-full max-w-4xl mb-4">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center">
                    {conversation.topic}
                  </h2>
                </div>

                <AnimatePresence mode="wait">
                  {currentIndex < visibleComments.length &&
                  !shouldShowAddComment ? (
                    <div className="relative w-full max-w-4xl h-[65vh] md:h-[55vh]">
                      {/* Background card with next comment (blurred) - positioned behind and offset */}
                      {currentIndex + 1 < visibleComments.length && (
                        <div className="absolute -top-4 left-20 right-0 bottom-12 bg-card border-2 border-border rounded-2xl shadow-lg opacity-60 overflow-hidden z-0">
                          <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col">
                            {/* Blurred background content */}
                            <div className="flex-1 flex items-center justify-center min-h-0">
                              <div className="max-h-full overflow-hidden w-full px-2">
                                <blockquote className="text-sm md:text-base lg:text-lg font-medium leading-relaxed text-center max-w-full break-words blur-sm text-muted-foreground">
                                  "{visibleComments[shuffledIndices[currentIndex + 1]]?.txt}"
                                </blockquote>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Main comment card */}
                      <motion.div
                        key={currentComment?.tid || "comment"}
                        ref={commentCardRef}
                        initial={{ scale: 0.95, opacity: 0, x: 100 }}
                        animate={
                          cardAnimation || {
                            scale: 1,
                            opacity: 1,
                            x: 0,
                            y: 0,
                            rotate: 0,
                          }
                        }
                        exit={{ scale: 0.95, opacity: 0, x: -100 }}
                        transition={{
                          type: "spring",
                          stiffness: 120,
                          damping: 15,
                        }}
                        className="absolute top-12 left-0 right-12 bottom-0 bg-card border-2 border-border rounded-2xl shadow-xl p-4 md:p-6 lg:p-8 flex flex-col overflow-hidden z-10"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={(e: any) =>
                          currentComment && handleTouchEnd(e, currentComment.tid)
                        }
                        onClick={() =>
                          currentComment && handleTap(currentComment.tid)
                        }
                      >
                        {/* Header with badges */}
                        <div className="flex items-center justify-center gap-2 mb-4 flex-shrink-0">
                          {currentComment?.isSeed && (
                            <Badge variant="secondary" className="text-xs">
                              Seed
                            </Badge>
                          )}
                        </div>

                        {/* Flag status */}
                        {currentComment?.flagStatus === "pending" && (
                          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4 flex-shrink-0">
                            <Minus className="w-4 h-4" />
                            <span className="text-sm">Under review</span>
                          </div>
                        )}

                        {/* Main comment - scrollable for long content */}
                        <div className="flex-1 flex items-center justify-center min-h-0">
                          <div className="max-h-full overflow-y-auto w-full px-2">
                            <blockquote className="text-sm md:text-base lg:text-lg font-medium leading-relaxed text-center max-w-full break-words">
                              "{currentComment?.txt}"
                            </blockquote>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  ) : (
                    <motion.div
                      key="add-comment"
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 120,
                        damping: 15,
                      }}
                      className="text-center space-y-8 max-w-2xl mx-auto"
                    >
                      <div className="w-32 h-32 mx-auto">
                        <Lottie
                          animationData={addCommentAnimation}
                          loop={true}
                          className="w-full h-full"
                        />
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold mb-4">
                          🎉 You've reviewed all comments!
                        </h2>
                        <p className="text-muted-foreground mb-6">
                          Share your thoughts and contribute to this meaningful
                          conversation. Your voice matters!
                        </p>
                      </div>

                      <AddCommentDialog
                        zid={String(zid)}
                        onCommentAdded={() => {
                          fetchConversation();
                          if (currentIndex >= visibleComments.length) {
                            setShowVoting(false);
                          }
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Voting buttons - moved below the card */}
                {currentIndex < visibleComments.length && !shouldShowAddComment && (
                  <div className="w-full max-w-4xl mt-4">
                    <div className="flex items-center justify-center gap-4 md:gap-8">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex flex-col items-center gap-2 p-3 md:p-4 rounded-xl transition-all min-w-[80px] ${
                          currentComment &&
                          getUserVote(currentComment.tid) === -1
                            ? "bg-red-100 dark:bg-red-900/30 ring-2 ring-red-500"
                            : "bg-muted/50 hover:bg-red-50 dark:hover:bg-red-900/20"
                        }`}
                        onClick={() =>
                          currentComment &&
                          handleVote(currentComment.tid, -1)
                        }
                      >
                        <span className="text-2xl">😔</span>
                        <span className="text-xs md:text-sm font-medium">
                          Disagree
                        </span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex flex-col items-center gap-2 p-3 md:p-4 rounded-xl transition-all min-w-[80px] ${
                          currentComment &&
                          getUserVote(currentComment.tid) === 0
                            ? "bg-gray-100 dark:bg-gray-800/50 ring-2 ring-gray-500"
                            : "bg-muted/50 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                        }`}
                        onClick={() =>
                          currentComment &&
                          handleVote(currentComment.tid, 0)
                        }
                      >
                        <span className="text-2xl">😐</span>
                        <span className="text-xs md:text-sm font-medium">
                          Neutral
                        </span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex flex-col items-center gap-2 p-3 md:p-4 rounded-xl transition-all min-w-[80px] ${
                          currentComment &&
                          getUserVote(currentComment.tid) === 1
                            ? "bg-green-100 dark:bg-green-900/30 ring-2 ring-green-500"
                            : "bg-muted/50 hover:bg-green-50 dark:hover:bg-green-900/20"
                        }`}
                        onClick={() =>
                          currentComment &&
                          handleVote(currentComment.tid, 1)
                        }
                      >
                        <span className="text-2xl">😊</span>
                        <span className="text-xs md:text-sm font-medium">
                          Agree
                        </span>
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer with Progress indicator */}
              <div className="p-3 border-t">
                {/* Progress indicator - moved to bottom with lighter design */}
                {currentIndex < visibleComments.length && (
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <span className="text-xs text-muted-foreground">
                      {currentIndex + 1} of {visibleComments.length}
                    </span>
                    <div className="w-24 bg-muted/50 rounded-full h-1">
                      <div
                        className="bg-muted-foreground/60 h-1 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            ((currentIndex + 1) / visibleComments.length) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Add comment section */}
                <div className="text-center">
                  {!canAddComment && currentIndex < visibleComments.length && (
                    <div className="text-xs text-muted-foreground">
                      💡 {visibleComments.length < 10 
                        ? "You can add your comment at the end" 
                        : `${10 - viewedCommentsCount} more to add your comment`}
                    </div>
                  )}

                  {canAddComment && currentIndex < visibleComments.length && (
                    <AddCommentDialog
                      zid={String(zid)}
                      disabled={!canAddComment}
                      disabledMessage={visibleComments.length < 10 
                        ? "You can add your comment after viewing all comments"
                        : `You need to review ${10 - viewedCommentsCount} more comments before adding your own`}
                      onCommentAdded={() => {
                        fetchConversation();
                        if (currentIndex >= visibleComments.length) {
                          setShowVoting(false);
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
