"use client";

import { useSession } from "next-auth/react";
import { MdLogin, MdLogout } from "react-icons/md";
import { VscAccount } from "react-icons/vsc";
import { RiAccountCircleLine } from "react-icons/ri";
import { useUI } from "@/context/UIContext";

export default function AuthButton() {
  const { data: session, status } = useSession();
  const { openSidebar } = useUI();

  if (status === "loading") {
    return (
      <div className="nav-item" title="Loading...">
        <MdLogin />
      </div>
    );
  }

  // Always open the login panel - don't logout from navbar
  // The logout button is inside the LoginPanel
  return (
    <div
      className="nav-item"
      title={session ? `Account (${session.user.name})` : "Login"}
      onClick={() => openSidebar("login")}
    >
      {/* {session ? <MdLogout /> : <MdLogin />} */}
      <RiAccountCircleLine />
    </div>
  );
}