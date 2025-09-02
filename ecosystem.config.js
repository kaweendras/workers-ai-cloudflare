module.exports = {
    apps: [
        {
            name: "node-server-gen",
            script: "dist/src/index.js",
            cwd: "./",
            interpreter: "node",
            watch: false,
            autorestart: true,
            env: {
                NODE_ENV: "production"
            }
        },
        // {
        //     name: "ts-frontend",
        //     script: "npm",
        //     args: ["run", "dev", "--host"],
        //     cwd: "./ts-front",
        //     watch: false,
        //     autorestart: true,
        //     env: {
        //         NODE_ENV: "production"
        //     }
        // },
        {
            name: "ts-frontend",
            script: "npm",
            args: ["run", "dev", "--", "--port", "3001", "--host"],
            cwd: "./ts-front",
            watch: false,
            autorestart: true,
            env: {
                NODE_ENV: "production"
            }
        }
        // {
        //     name: "gradio-ui",
        //     script: "start.sh",
        //     cwd: "./Gradio-UI",
        //     interpreter: "bash",
        //     watch: false,
        //     autorestart: true,
        //     env: {
        //         PYTHONUNBUFFERED: "1",
        //         PATH: "./venv/bin:$PATH",
        //         VIRTUAL_ENV: "./venv"
        //     },
        //     wait_ready: true,
        //     listen_timeout: 10000,
        //     max_restarts: 3,
        //     max_memory_restart: "500M",
        //     depends_on: ["node-server"],
        //     // Add setup for virtual environment
        //     setup: "cd ./Gradio-UI && python -m venv venv && ./venv/bin/pip install -r requirements.txt"
        // }
    ]
};