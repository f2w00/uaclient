import {Errors, ServerMessage, ServerStatusCodes, Sources} from '../../common/ua.enums'
import {Next, ParameterizedContext} from 'koa'
import {IRouterParamContext} from 'koa-router'
import {ResponseModel} from '../models/response.model'
import {ClientError, ClientWarn, Log} from '../../../../core/log'

export module ErrorMiddleware {

    export async function handleError(ctx: ParameterizedContext<any, IRouterParamContext<any, {}>, any>, next: Next) {
        try {
            await next()
        } catch (e: any) {
            if (e instanceof ClientWarn) {
                Log.warn(e)
                ctx.body = new ResponseModel(e, ServerMessage.warn, ServerStatusCodes.success)
            } else if (e instanceof ClientError) {
                Log.error(e)
                ctx.body = new ResponseModel(e, ServerMessage.error, ServerStatusCodes.internalError)
            } else {
                let err = new ClientError(Sources.server, Errors.internalError, e.message)
                Log.error(err)
                ctx.body = new ResponseModel(err, ServerMessage.error, ServerStatusCodes.internalError)
            }
        }
    }
}