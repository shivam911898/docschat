const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

export default {
  poweredByHeader: false,
  // Native / Node-only packages stay out of the bundle and are loaded at runtime.
  serverExternalPackages: ["better-sqlite3", "pdf-parse", "@libsql/client", "libsql"],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // /chat and /widget.js are meant to be embedded; the admin area must never be framed.
      { source: "/admin/:path*", headers: [{ key: "X-Frame-Options", value: "DENY" }, { key: "Cache-Control", value: "no-store" }] },
    ];
  },
};
