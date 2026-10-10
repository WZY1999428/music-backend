module.exports = {
  apps : [{
    name   : "music-server",
    script : "./.output/index.js",
    env: {
       NODE_ENV: "production"
    }
  }]
}