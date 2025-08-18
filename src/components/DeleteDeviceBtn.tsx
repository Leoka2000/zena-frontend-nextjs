import React from "react";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";

export function DeleteDeviceBtn() {
  return (
    <>
      <Button
        variant="outline"
        className="transition hover:bg-red-100 hover:text-red-500 shadow-xs dark:text-red-400 dark:hover:text-red-500 hover:border-red-300  text-red-400"
      >
        <Trash2 />
        Delete device
      </Button>
    </>
  );
}
