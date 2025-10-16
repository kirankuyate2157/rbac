import { writeAudit } from "../middlewares/auditLogger.middleware.js";
import { emailRepository } from "../repositories/email.repository.js";


export const emailService = {
    /**
     * Add email to outbox
     */
    queueEmail: async (data) => {
        const email = await emailRepository.insertEmail(data);

        // Optional: audit log
        await writeAudit({
            tenantId: data.tenant_id,
            userId: data.user_id,
            module: "email",
            action: "QUEUE",
            target_type: "EmailOutbox",
            target_id: email.id,
            description: `Queued email to ${data.to}`,
        });

        return email;
    },

    /**
     * Add multiple emails
     */
    queueEmails: async (emails) => {
        const inserted = await emailRepository.insertMany(emails);

        // Optional: audit for bulk queue
        // Could loop and log each or just log count
        await writeAudit({
            module: "email",
            action: "QUEUE_BULK",
            description: `Queued ${emails.length} emails`,
            metadata: { count: emails.length },
        });

        return inserted;
    },

    /**
     * Fetch pending emails for sending worker
     */
    getPendingEmails: async (limit = 50) => {
        return emailRepository.getPending(limit);
    },

    /**
     * Mark email as sent
     */
    markEmailSent: async (id) => {
        return emailRepository.markAsSent(id);
    },

    /**
     * Increment attempt count
     */
    incrementEmailAttempt: async (id) => {
        return emailRepository.incrementAttempt(id);
    },
};
