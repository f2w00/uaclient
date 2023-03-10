import Router = require("koa-router")
import {DbController} from '../controllers/db.controller'
import {ValidatorMiddleware} from '../middlewares/validator.middleware'

export module DbRouter {
    export let router = new Router({
        prefix: '/db'
    })
    router.use(ValidatorMiddleware.dbValidator)

    router.post('/init', DbController.init)
    router.post('/insert', DbController.insert)
    router.post('/insert_many', DbController.insertMany)
    router.post('/create_table', DbController.createTable)
    router.post('/backup', DbController.backUp)
    router.post('/config', DbController.config)

    router.get('/close', DbController.closeDb)
}