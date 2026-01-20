const { getDefaultConfig } = require("expo/metro-config");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

const config = getDefaultConfig(__dirname);

const blockList = [
  new RegExp(
    `^${escapeRegExp(
      path.resolve(__dirname, ".config/npm/node_global/lib/node_modules"),
    )}\\/.*$`,
  ),
];

config.resolver.blockList = new RegExp(
  blockList.map((r) => r.source).join("|"),
);

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (req.url.startsWith("/api")) {
        const proxy = createProxyMiddleware({
          target: "http://localhost:5000",
          changeOrigin: true,
          logLevel: "warn",
        });
        return proxy(req, res, next);
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
