"use client";

import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Users, Calendar, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const interactionTypeConfig = {
  CALL: {
    label: "Cuộc gọi",
    icon: Phone,
    color: "bg-blue-100 text-blue-700 border-blue-300",
    iconColor: "text-blue-600",
  },
  EMAIL: {
    label: "Email",
    icon: Mail,
    color: "bg-purple-100 text-purple-700 border-purple-300",
    iconColor: "text-purple-600",
  },
  MEETING: {
    label: "Gặp mặt",
    icon: Users,
    color: "bg-green-100 text-green-700 border-green-300",
    iconColor: "text-green-600",
  },
  EVENT: {
    label: "Sự kiện",
    icon: Calendar,
    color: "bg-orange-100 text-orange-700 border-orange-300",
    iconColor: "text-orange-600",
  },
};

interface Interaction {
  id: string;
  type: "CALL" | "EMAIL" | "MEETING" | "EVENT";
  date: string;
  subject: string;
  notes?: string | null;
}

interface InteractionTimelineProps {
  interactions: Interaction[];
  onDelete?: (id: string) => void;
}

export function InteractionTimeline({ interactions, onDelete }: InteractionTimelineProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (interactions.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Chưa có tương tác nào được ghi nhận
      </div>
    );
  }

  return (
    <>
      <div className="relative space-y-4">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

        {interactions.map((interaction, index) => {
          const config = interactionTypeConfig[interaction.type];
          const Icon = config.icon;

          return (
            <div key={interaction.id} className="relative pl-14 pb-8">
              {/* Icon */}
              <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-full bg-background border-2 border-border">
                <Icon className={`h-5 w-5 ${config.iconColor}`} />
              </div>

              {/* Content */}
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={config.color}>
                        {config.label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(interaction.date, "dd/MM/yyyy HH:mm")}
                      </span>
                    </div>
                    <h4 className="font-semibold mb-1">{interaction.subject}</h4>
                    {interaction.notes && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {interaction.notes}
                      </p>
                    )}
                  </div>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(interaction.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {onDelete && (
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa tương tác này? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteId) {
                    onDelete(deleteId);
                    setDeleteId(null);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
