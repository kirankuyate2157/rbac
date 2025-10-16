import { UAParser } from "ua-parser-js";

export const getDeviceMetadata = (req) => {
    const ua = req.headers["user-agent"] || "";
    const parser = new UAParser(ua);
    const uaResult = parser.getResult();

    const screenResolution = req.headers["x-screen-resolution"] || null;
    const appVersion = req.headers["x-app-version"] || null;

    return {
        os: uaResult.os?.name ? `${uaResult.os.name} ${uaResult.os.version || ""}`.trim() : null,
        browser: req.headers["user-agent"] || null,
        device_type: uaResult.device?.type || null,
        device_model: uaResult.device?.model || null,
        device_vendor: uaResult.device?.vendor || null,
        screen_resolution: screenResolution,
        app_version: appVersion,
        location: req.headers["x-device-location"] ? JSON.parse(req.headers["x-device-location"]) : null,
    };
};
