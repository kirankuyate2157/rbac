import { AppConfigService } from "../services/appConfig.service.js";

export const loadAppConfig = (keys = []) => {
    return async (req, res, next) => {
        try {
            req.appConfig = {};
            for (const key of keys) {
                req.appConfig[key] = await AppConfigService.get(key);
            }
            next();
        } catch (err) {
            console.error("Error loading app configs:", err);
            next();
        }
    };
};
