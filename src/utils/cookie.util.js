// src/utils/cookie.util.js
export const setAuthCookies = (res, accessToken, refreshToken, options = {}) => {
    const { accessMaxAge = 15 * 60, refreshMaxAge = 7 * 24 * 60 * 60 } = options; // seconds
    // HttpOnly, Secure (if HTTPS), SameSite
    res.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: accessMaxAge * 1000,
        path: "/"
    });

    res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: refreshMaxAge * 1000,
        path: "/"
    });

};

export const clearAuthCookies = (res) => {
    res.clearCookie("access_token", { path: "/" });
    res.clearCookie("refresh_token", { path: "/" });
};
