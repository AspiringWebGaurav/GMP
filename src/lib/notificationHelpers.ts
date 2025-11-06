"use client";

import { useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { NotificationType } from "@/types/notification";

interface NotificationService {
  createNotification: (input: {
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
  }) => Promise<void>;
  showToast: (type: NotificationType, message: string, title?: string) => void;
}

let notificationService: NotificationService | null = null;

export function setNotificationService(service: NotificationService) {
  notificationService = service;
}

export async function createAuthNotification(
  type: "login" | "logout",
  user: any
) {
  if (!notificationService) return;

  const displayName = user?.displayName || user?.email || "User";
  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  if (type === "login") {
    await notificationService.createNotification({
      type: "login",
      title: "Login Successful",
      message: `${displayName} logged in at ${timestamp}`,
      data: { userId: user?.uid, email: user?.email },
    });
    notificationService.showToast("success", `Welcome back, ${displayName}!`);
  } else {
    await notificationService.createNotification({
      type: "logout",
      title: "Logged Out",
      message: `${displayName} logged out at ${timestamp}`,
      data: { userId: user?.uid, email: user?.email },
    });
    notificationService.showToast("info", "You have been logged out");
  }
}

export async function createTimesheetNotification(
  action: "add" | "update" | "delete",
  data?: any
) {
  if (!notificationService) return;

  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  let title = "";
  let message = "";

  switch (action) {
    case "add":
      title = "Timesheet Entry Added";
      message = `New time log entry created at ${timestamp}`;
      notificationService.showToast("success", "Entry added successfully");
      break;
    case "update":
      title = "Timesheet Entry Updated";
      message = `Time log entry updated at ${timestamp}`;
      notificationService.showToast("success", "Entry updated successfully");
      break;
    case "delete":
      title = "Timesheet Entry Deleted";
      message = `Time log entry deleted at ${timestamp}`;
      notificationService.showToast("success", "Entry deleted successfully");
      break;
  }

  await notificationService.createNotification({
    type: "timesheet",
    title,
    message,
    data: data || {},
  });
}

export async function createVersionNotification(
  action: "create" | "update",
  versionNumber?: string
) {
  if (!notificationService) return;

  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  let title = "";
  let message = "";

  switch (action) {
    case "create":
      title = "Version Notes Created";
      message = `New version ${
        versionNumber || "notes"
      } created at ${timestamp}`;
      notificationService.showToast(
        "success",
        `Version ${versionNumber || "notes"} saved successfully`
      );
      break;
    case "update":
      title = "Version Notes Updated";
      message = `Version ${versionNumber || "notes"} updated at ${timestamp}`;
      notificationService.showToast(
        "success",
        "Version notes updated successfully"
      );
      break;
  }

  await notificationService.createNotification({
    type: "version",
    title,
    message,
    data: { version: versionNumber },
  });
}

export async function createTodoNotification(
  action: "complete" | "create" | "update" | "delete",
  data?: any
) {
  if (!notificationService) return;

  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  let title = "";
  let message = "";
  let toastMessage = "";

  switch (action) {
    case "complete":
      title = "Task Completed! 🎉";
      message = `"${data?.title || "Task"}" was completed at ${timestamp}`;
      toastMessage = `Great job! Task completed: ${data?.title || "Task"}`;
      notificationService.showToast("success", toastMessage);
      break;
    case "create":
      title = "Task Created";
      message = `New task "${data?.title || "Task"}" created at ${timestamp}`;
      toastMessage = "Task added successfully";
      notificationService.showToast("success", toastMessage);
      break;
    case "update":
      title = "Task Updated";
      message = `Task "${data?.title || "Task"}" updated at ${timestamp}`;
      toastMessage = "Task updated successfully";
      notificationService.showToast("success", toastMessage);
      break;
    case "delete":
      title = "Task Deleted";
      message = `Task "${data?.title || "Task"}" deleted at ${timestamp}`;
      toastMessage = "Task deleted successfully";
      notificationService.showToast("success", toastMessage);
      break;
  }

  await notificationService.createNotification({
    type: "todo",
    title,
    message,
    data: data || {},
  });
}

export async function createErrorNotification(error: string, context?: string) {
  if (!notificationService) return;

  await notificationService.createNotification({
    type: "error",
    title: "Error Occurred",
    message: `${context ? context + ": " : ""}${error}`,
    data: { context },
  });
  notificationService.showToast("error", error, context);
}
