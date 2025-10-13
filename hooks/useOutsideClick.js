// Detects clicks occurring outside of a specified element and executes a provided callback.
// Commonly used to close popups, dropdowns, or sidebars.
"use client";

import { useEffect } from "react";

export default function useOutsideClick(ref, callback) {
  useEffect(() => {
    const handleClick = (event) => {
      // Executes callback if the clicked target is not inside the referenced element.
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [ref, callback]);
}
