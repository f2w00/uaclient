const dotenv = require('dotenv')
let Path = require('path')
export module Config{
    dotenv.config({
        path: Path.join(__dirname, "..", "..", ".env").toString()
    })
    export let port = process.env.APP_PORT
    export let dbPath: string | undefined = process.env.DB_PATH
}