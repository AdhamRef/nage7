"use client";

import { useEffect } from "react";

import { getDeviceId } from "@/lib/device-client";

/**
 * Mints the browser's device id on first load and re-mirrors it into the
 * cookie on every visit, so clearing cookies alone does not look like a new
 * device. Renders nothing.
 */
export const DeviceGuard = () => {
  useEffect(() => {
    try {
      getDeviceId();
    } catch {
      // A browser with no crypto.randomUUID or no storage simply stays
      // unbound; the sign-in gate treats that as "cannot verify" and allows.
    }
  }, []);

  return null;
};

export default DeviceGuard;
