import prisma from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

export const emailRepository = {

    /**
  * Insert new email into outbox
  * @param {object} data
  * @param {string} data.tenant_id
  * @param {string} data.user_id
  * @param {string} data.to
  * @param {string} data.subject
  * @param {string} data.body
  * @param {string} [data.cc]
  * @param {string} [data.bcc]
  * @param {Date} [data.scheduledAt]
  * @param {object[]} [data.attachments] - Array of attachments
  */

    insertEmail: async ({
        tenant_id = null,
        user_id = null,
        to,
        cc = null,
        bcc = null,
        subject,
        body,
        attachments = null,
        scheduledAt = new Date(),
    }) => {
        return prisma.emailOutbox.create({
            data: {
                id: uuidv4(),
                tenant_id,
                user_id,
                to,
                cc,
                bcc,
                subject,
                body,
                attachments,
                scheduledAt,
            },
        });
    },

    /**
     * Bulk insert emails
     */
    insertMany: async (emails) => {
        const data = emails.map((e) => ({
            id: uuidv4(),
            tenant_id: e.tenant_id || null,
            user_id: e.user_id || null,
            to: e.to,
            cc: e.cc || null,
            bcc: e.bcc || null,
            subject: e.subject,
            body: e.body,
            attachments: e.attachments || null,
            scheduledAt: e.scheduledAt || new Date(),
        }));
        return prisma.emailOutbox.createMany({ data });
    },

    /**
     * Fetch pending emails for sending
     */
    getPending: async (limit = 50) => {
        return prisma.emailOutbox.findMany({
            where: { isSent: false, scheduledAt: { lte: new Date() }, attempts: { lt: 3 } },
            orderBy: { scheduledAt: "asc" },
            take: limit,
        });
    },

    /**
     * Mark email as sent
     */
    markAsSent: async (id) => {
        return prisma.emailOutbox.update({
            where: { id },
            data: { isSent: true, sentAt: new Date() },
        });
    },

    /**
     * Increment attempt counter
     */
    incrementAttempt: async (id) => {
        return prisma.emailOutbox.update({
            where: { id },
            data: { attempts: { increment: 1 }, lastAttempt: new Date() },
        });
    },
};
