"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";

import { Button } from "@/components/ui/button";
import { getDeviceId } from "@/lib/device-client";

const GoogleButton = ({ callbackUrl }: { callbackUrl: string }) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-x-2"
      disabled={isLoading}
      onClick={() => {
        setIsLoading(true);
        // Mirror the device id into the cookie before we leave the page, so
        // the callback can read it.
        getDeviceId();
        signIn("google", { callbackUrl });
      }}
    >
      <FcGoogle className="h-5 w-5" />
      المتابعة باستخدام Google
    </Button>
  );
};

export default GoogleButton;
