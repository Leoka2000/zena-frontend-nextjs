"use client";

import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getToken } from "@/lib/auth";
import { toast } from "sonner"; // ✅ Import toast from sonner

export function DeleteDeviceBtn() {
  const [deviceId, setDeviceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch active device on mount
  useEffect(() => {
    const fetchActiveDevice = async () => {
      const token = getToken();
      try {
        const res = await fetch("http://localhost:8080/api/device/active", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch active device");
        const data = await res.json();
        setDeviceId(data.deviceId);
      } catch (err) {
        console.error("Error fetching active device:", err);
      }
    };

    fetchActiveDevice();
  }, []);

  // 🔹 Handle delete action
  const handleDelete = async () => {
    if (!deviceId) return;

    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(
        `http://localhost:8080/api/device/list/${deviceId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        toast.success("Device deleted successfully ✅"); // ✅ Success toast
        setDeviceId(null);
      } else {
        toast.error("Failed to delete device ❌"); // ❌ Error toast
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Something went wrong. Please try again."); // ❌ Fallback toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="transition hover:bg-red-100 hover:text-red-500 shadow-xs bg-red-100 border-red-300 dark:text-0 dark:hover:text-red-500 hover:border-red-300 text-red-400"
        >
          <Trash2 className="mr-2" />
          Delete device
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            device and all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
