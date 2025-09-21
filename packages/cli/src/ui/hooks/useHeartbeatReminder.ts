/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

interface UseHeartbeatReminderOptions {
  /** Whether the heartbeat loop should be running. */
  isActive: boolean;
  /** Function that queues a message for submission to Gemini. */
  addMessage: (message: string) => void;
  /** Message that should be sent on each heartbeat tick. */
  message?: string;
  /** Interval between heartbeat ticks in milliseconds. */
  intervalMs?: number;
}

const DEFAULT_HEARTBEAT_MESSAGE = '继续你的使命';
const DEFAULT_HEARTBEAT_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Sets up a repeating reminder that queues a chat message on a fixed interval.
 * The reminder starts when `isActive` becomes true and is automatically
 * cancelled when the component using this hook unmounts or the flag is
 * deactivated.
 */
export function useHeartbeatReminder({
  isActive,
  addMessage,
  message = DEFAULT_HEARTBEAT_MESSAGE,
  intervalMs = DEFAULT_HEARTBEAT_INTERVAL_MS,
}: UseHeartbeatReminderOptions): void {
  const addMessageRef = useRef(addMessage);
  addMessageRef.current = addMessage;

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const timer = setInterval(() => {
      addMessageRef.current(message);
    }, intervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [isActive, message, intervalMs]);
}
