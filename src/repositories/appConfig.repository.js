import prisma from "../config/db.js";

export const AppConfigRepository = {
    async getByKey(key, tenant_id = null) {
        return prisma.appConfig.findFirst({
            where: { key, tenant_id },
        });
    },

    async setConfig(key, value, description = null, tenant_id = null) {
        return prisma.appConfig.upsert({
            where: { key },
            update: { value, description, tenant_id },
            create: { key, value, description, tenant_id },
        });
    },

    async getAll(tenant_id = null) {
        return prisma.appConfig.findMany({
            where: { tenant_id },
            orderBy: { key: "asc" },
        });
    },

    async delete(key) {
        return prisma.appConfig.delete({
            where: { key },
        });
    },
    async getTenantPolicy(tenant_id) {
        return prisma.tenantPolicy.findFirst({ where: { tenant_id } });
    },
};
