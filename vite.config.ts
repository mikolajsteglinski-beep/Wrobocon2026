import 'dotenv/config';
import { defineConfig } from "vite";
import { getMaps, getMapsOptimizers, getMapsScripts, LogLevel, OptimizeOptions } from "wa-map-optimizer-vite";

const maps = getMaps();

let optimizerOptions: OptimizeOptions = {
    logs: process.env.LOG_LEVEL && process.env.LOG_LEVEL in LogLevel ? LogLevel[process.env.LOG_LEVEL] : LogLevel.NORMAL,
};

if (process.env.TILESET_OPTIMIZATION && process.env.TILESET_OPTIMIZATION === "true") {
    const qualityMin = process.env.TILESET_OPTIMIZATION_QUALITY_MIN ? parseInt(process.env.TILESET_OPTIMIZATION_QUALITY_MIN) : 0.9;
    const qualityMax = process.env.TILESET_OPTIMIZATION_QUALITY_MAX ? parseInt(process.env.TILESET_OPTIMIZATION_QUALITY_MAX) : 1;

    optimizerOptions.output = {
        tileset: {
            compress: {
                quality: [qualityMin, qualityMax],
            }
        }
    }
}

function localNetworkAccessPlugin() {
    return {
        name: "local-network-access",
        configureServer(server: { middlewares: { use: (fn: (...args: any[]) => void) => void } }) {
            server.middlewares.use((req, res, next) => {
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.setHeader("Access-Control-Allow-Private-Network", "true");
                res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
                res.setHeader(
                    "Access-Control-Allow-Headers",
                    req.headers["access-control-request-headers"] || "X-Requested-With, content-type, Authorization"
                );

                const pathname = (req.url ?? "").split("?")[0];
                if (pathname.endsWith(".tmj") || pathname.endsWith(".json")) {
                    res.setHeader("Content-Type", "application/json");
                }

                if (req.method === "OPTIONS" && req.headers["access-control-request-private-network"]) {
                    res.statusCode = 204;
                    res.end();
                    return;
                }

                next();
            });
        },
    };
}

export default defineConfig({
    base: "./",
    build: {
        sourcemap: true,
        rollupOptions: {
            input: {
                index: "./index.html",
                ...getMapsScripts(maps),
            },
        },
    },
    plugins: [localNetworkAccessPlugin(), ...getMapsOptimizers(maps, optimizerOptions)],
    server: {
        host: true,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Private-Network": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
            "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        open: "/",
    },
});
