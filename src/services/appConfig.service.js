import { AppConfigRepository } from "../repositories/appConfig.repository.js";
import { getCache, setCache, clearCache } from "../utils/cache.js";

/**
 * Unified Config Service
 * Supports caching + .env fallback + dynamic DB configs.
 */
export const AppConfigService = {
    async get(key, tenant_id = null) {
        // 1️⃣ Check cache first
        const cached = getCache(`${tenant_id || "global"}:${key}`);
        if (cached) return cached;

        // 2️⃣ Try database
        const config = await AppConfigRepository.getByKey(key, tenant_id);
        if (config?.value) {
            setCache(`${tenant_id || "global"}:${key}`, config.value);
            return config.value;
        }

        // 3️⃣ Fallback to .env
        const envVal = process.env[key];
        if (envVal) {
            setCache(`${tenant_id || "global"}:${key}`, envVal);
            return envVal;
        }

        return null;
    },

    async set(key, value, description = null, tenant_id = null) {
        const result = await AppConfigRepository.setConfig(key, value, description, tenant_id);
        clearCache(`${tenant_id || "global"}:${key}`);
        return result;
    },

    async getAll(tenant_id = null) {
        return AppConfigRepository.getAll(tenant_id);
    },

    async delete(key) {
        clearCache(key);
        return AppConfigRepository.delete(key);
    },
};
