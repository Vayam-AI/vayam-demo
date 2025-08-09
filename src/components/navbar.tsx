"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  User,
  LogOut,
  Settings,
  Home,
  Plus,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProfileDialog } from "@/components/profile/profile-dialog";
import { useState } from "react";
import { isAdminUser } from "@/utils/adminCheck";

export default function Navbar() {
  const { data: session } = useSession();
  const [showProfile, setShowProfile] = useState(false);

  const isAdmin = isAdminUser(session?.user?.email);  

  const handleLogout = async () => {
    try {
      // Use signOut with redirect: false and handle redirect manually
      await signOut({ redirect: false });
      // Force redirect to show success message
      window.location.href = "/?message=logged-out";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 w-full bg-background border-b border-border shadow-sm"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/home" className="flex items-center space-x-3">
                <span className="text-2xl font-bold text-foreground">
                  Vayam
                </span>
              </Link>
            </motion.div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {/* User Menu */}
              {session?.user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="relative h-8 w-8 rounded-full text-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                      >
                        <div className="flex items-center justify-center rounded-full">
                          <Menu className="h-4 w-4" />
                        </div>
                      </Button>
                    </motion.div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        {session.user.name && (
                          <p className="font-medium">{session.user.name}</p>
                        )}
                        {session.user.email && (
                          <p className="w-[200px] truncate text-sm text-muted-foreground">
                            {session.user.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowProfile(true)}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    
                    {/* Admin-only menu items */}
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/conversations/create" className="flex items-center">
                            <Plus className="mr-2 h-4 w-4" />
                            <span>Create Conversation</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/conversations/dashboard" className="flex items-center">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      <ProfileDialog open={showProfile} onOpenChange={setShowProfile} />
    </>
  );
}
