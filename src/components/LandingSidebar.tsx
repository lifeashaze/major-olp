
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "./ui/sidebar"
import {
  IconFiles,
  IconBrandTabler,
  IconChartBar,
  IconSettings,
  IconBook,
  IconDatabase
} from "@tabler/icons-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { UserButton ,SignedIn,SignedOut} from "@clerk/nextjs";




export function Hamburger() {

    

      
  const links = [
    {
      label: "Sign In",
      href: "/sign-in",
      icon: (
        <IconBrandTabler className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Sign Up",
      href: "/sign-up",
      icon: (
        <IconFiles className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "about",
      href: "/",
      icon: (
        <IconBook className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "docs",
      href: "/",
      icon: (
        <IconDatabase className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
        label: "changelog",
        href: "/",
        icon: (
          <IconSettings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        ),
      },
  ];

  const dlinks = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: (
          <IconBrandTabler className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        ),
    },
    {
        label: "about",
        href: "/",
        icon: (
          <IconBook className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        ),
      },
      {
        label: "docs",
        href: "/",
        icon: (
          <IconDatabase className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        ),
      },
      {
          label: "changelog",
          href: "/",
          icon: (
            <IconSettings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
          ),
        },
  ];
  const [open, setOpen] = useState(false);

  const handleLinkClick = () => {
    // Close sidebar on mobile devices
    if (window.innerWidth < 768) { // md breakpoint
      setOpen(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-md flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800  max-w-xs mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden",
        "h-screen" 
      )}
    >
      <Sidebar open={open} setOpen={setOpen} animate={false}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <>
              <Logo />
            </>
            <SignedOut>
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink 
                  key={idx} 
                  link={link}
                  onClick={handleLinkClick}
                />
              ))}
            </div>
            </SignedOut>
            <SignedIn>
            <div className="mt-8 flex flex-col gap-2">
              {dlinks.map((dlink, idx) => (
                <SidebarLink 
                  key={idx} 
                  link={dlink}
                  onClick={handleLinkClick}
                />
              ))}
            </div>
            </SignedIn>
          </div>
          <div className="">
             <UserButton />
          </div>
        </SidebarBody>
      </Sidebar>
    </div>
  );
}

export const Logo = () => {
  return (
    <Link
      href="/"
      className="font-normal flex space-x-2 items-center text-xl text-black py-1 relative z-20"
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-black dark:text-white whitespace-pre"
      >
        athenium
      </motion.span>
    </Link>
  );
};