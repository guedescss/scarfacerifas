"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="bottom-center"
      richColors
      toastOptions={{
        classNames: {
          success: "!border-green-500 !bg-green-950 !text-green-100",
          error: "!border-red-500 !bg-red-950 !text-red-100",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
