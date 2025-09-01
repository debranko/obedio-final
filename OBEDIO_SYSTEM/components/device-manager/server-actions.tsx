"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const ServerActionButton: React.FC<{
  name: string;
  description: string;
  icon: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  onAction: () => void;
}> = ({
  name,
  description,
  icon,
  variant = "outline",
  requiresConfirmation = false,
  confirmationMessage = "Are you sure you want to perform this action?",
  onAction,
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleClick = () => {
    if (requiresConfirmation) {
      setShowConfirmation(true);
    } else {
      onAction();
    }
  };

  return (
    <>
      <div className="relative h-full">
        <Button
          variant={variant}
          className="w-full h-full flex flex-col items-center justify-center py-8 px-2 space-y-3"
          onClick={handleClick}
        >
          <div className="text-2xl">{icon}</div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-center text-muted-foreground">{description}</div>
        </Button>
      </div>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm {name}</AlertDialogTitle>
            <AlertDialogDescription>{confirmationMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              onAction();
              setShowConfirmation(false);
            }}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export function ServerActions() {
  const [actionStatus, setActionStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  // These would be actual API calls in a real implementation
  const handleRestartServices = () => {
    // Simulate API call
    setTimeout(() => {
      setActionStatus({
        success: true,
        message: "All server services have been successfully restarted.",
      });
    }, 2000);
  };

  const handleUpdateServer = () => {
    // Simulate API call
    setTimeout(() => {
      setActionStatus({
        success: true,
        message: "Server software has been updated to version 2.5.3.",
      });
    }, 3000);
  };

  const handleBackupDatabase = () => {
    // Simulate API call
    setTimeout(() => {
      setActionStatus({
        success: true,
        message: "Database backup completed successfully. Backup stored at /backups/db_20250511.bak",
      });
    }, 2500);
  };

  const handleRestartServer = () => {
    // Simulate API call
    setTimeout(() => {
      setActionStatus({
        success: true,
        message: "Server is restarting. This may take a few minutes.",
      });
    }, 1000);
  };

  const handleClearCache = () => {
    // Simulate API call
    setTimeout(() => {
      setActionStatus({
        success: true,
        message: "System cache cleared successfully.",
      });
    }, 1500);
  };

  const handleFactoryReset = () => {
    // Simulate API call
    setTimeout(() => {
      setActionStatus({
        success: false,
        message: "Factory reset requires administrator approval. Please contact system administrator.",
      });
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Server Management Actions</CardTitle>
          <CardDescription>
            Perform maintenance operations on the Obedio Server. Some actions may temporarily interrupt system functionality.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {actionStatus && (
            <Alert
              variant={actionStatus.success ? "default" : "destructive"}
              className="mb-6"
            >
              <AlertTitle>{actionStatus.success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>{actionStatus.message}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ServerActionButton
              name="Restart Services"
              description="Restart all server services without rebooting the system"
              icon={<span role="img" aria-label="restart">🔄</span>}
              onAction={handleRestartServices}
              requiresConfirmation
              confirmationMessage="This will restart all server services. Active connections will be temporarily interrupted. Do you want to continue?"
            />

            <ServerActionButton
              name="Update Server"
              description="Check for and install server software updates"
              icon={<span role="img" aria-label="update">⬆️</span>}
              onAction={handleUpdateServer}
              requiresConfirmation
              confirmationMessage="This will check for and install server software updates. The server may need to restart after updates are installed. Do you want to continue?"
            />

            <ServerActionButton
              name="Backup Database"
              description="Create a complete backup of the system database"
              icon={<span role="img" aria-label="backup">💾</span>}
              onAction={handleBackupDatabase}
            />

            <ServerActionButton
              name="Restart Server"
              description="Completely restart the server hardware"
              icon={<span role="img" aria-label="power">🔌</span>}
              variant="destructive"
              requiresConfirmation
              confirmationMessage="This will completely restart the server hardware. All connections will be interrupted for several minutes. Do you want to continue?"
              onAction={handleRestartServer}
            />

            <ServerActionButton
              name="Clear Cache"
              description="Clear system caches to free up memory"
              icon={<span role="img" aria-label="clear">🧹</span>}
              onAction={handleClearCache}
            />

            <ServerActionButton
              name="Factory Reset"
              description="Reset server to factory default settings"
              icon={<span role="img" aria-label="reset">⚠️</span>}
              variant="destructive"
              requiresConfirmation
              confirmationMessage="WARNING: This will reset all server settings, erase all data, and restore factory defaults. This action cannot be undone. Are you absolutely sure you want to continue?"
              onAction={handleFactoryReset}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Maintenance</CardTitle>
          <CardDescription>
            Configure automated maintenance tasks for optimal server performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Daily Maintenance</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Runs every day at 3:00 AM
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Database optimization</span>
                    <span className="text-green-500">Enabled</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Log rotation</span>
                    <span className="text-green-500">Enabled</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache cleanup</span>
                    <span className="text-green-500">Enabled</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Weekly Maintenance</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Runs every Sunday at 2:00 AM
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Full database backup</span>
                    <span className="text-green-500">Enabled</span>
                  </div>
                  <div className="flex justify-between">
                    <span>System updates check</span>
                    <span className="text-green-500">Enabled</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Security scan</span>
                    <span className="text-green-500">Enabled</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline">
                Configure Maintenance Schedule
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}