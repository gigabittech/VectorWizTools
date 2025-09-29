import { storage } from "./storage";
import type { InsertActivity } from "@shared/schema";

export class ActivityLogger {
  static async logOrderCreated(userId: string, orderId: string, service: string) {
    await storage.createActivity({
      userId,
      orderId,
      type: "ORDER_CREATED",
      title: `New order created`,
      description: `${service.replace(/_/g, " ").toLowerCase()} order created`,
      metadata: { service }
    });
  }

  static async logOrderUpdated(userId: string, orderId: string, status: string, previousStatus?: string) {
    const statusMap = {
      QUEUED: "queued",
      IN_PROGRESS: "in progress", 
      NEEDS_REVISION: "needs revision",
      WAITING_PAYMENT: "waiting for payment",
      COMPLETE: "completed",
      CANCELED: "canceled"
    };

    const statusName = statusMap[status as keyof typeof statusMap] || status;
    
    await storage.createActivity({
      userId,
      orderId,
      type: "ORDER_UPDATED",
      title: `Order ${statusName}`,
      description: `Order status changed to ${statusName}`,
      metadata: { status, previousStatus }
    });
  }

  static async logPaymentProcessed(userId: string, orderId: string, amount: number) {
    await storage.createActivity({
      userId,
      orderId,
      type: "PAYMENT_PROCESSED", 
      title: "Payment processed",
      description: `Payment of $${(amount / 100).toFixed(2)} processed successfully`,
      metadata: { amount }
    });
  }

  static async logFileUploaded(userId: string, orderId: string, fileName: string, fileKind: string) {
    const kindMap = {
      SOURCE: "source file",
      UPLOAD: "upload",
      PROOF: "proof", 
      FINAL: "final file"
    };

    const kindName = kindMap[fileKind as keyof typeof kindMap] || fileKind;
    
    await storage.createActivity({
      userId,
      orderId,
      type: "FILE_UPLOADED",
      title: `${kindName} uploaded`,
      description: `${fileName} has been uploaded`,
      metadata: { fileName, fileKind }
    });
  }

  static async logProofUploaded(userId: string, orderId: string) {
    await storage.createActivity({
      userId,
      orderId,
      type: "PROOF_UPLOADED",
      title: "Proof uploaded for review",
      description: "Designer has uploaded a proof for your review",
      metadata: {}
    });
  }

  static async logMessageSent(userId: string, orderId: string, messagePreview: string) {
    await storage.createActivity({
      userId,
      orderId,
      type: "MESSAGE_SENT",
      title: "New message",
      description: messagePreview.substring(0, 100) + (messagePreview.length > 100 ? "..." : ""),
      metadata: { messageLength: messagePreview.length }
    });
  }
}