import {
    ClientMonitoredItem,
    ClientSubscription,
    ClientSubscriptionOptions,
    ModifySubscriptionOptions,
    TimestampsToReturn
} from 'node-opcua'
import {SessionService} from './session.service'
import {Errors, Sources, Warns} from '../../../common/ua.enums'
import {MessageQueue} from '../../../../../core/mq'
import {UaMessage} from '../../models/message.model'
import {ItemAndName, NodeID, SubscriptGroupParam, SubscriptSingleParam} from '../../models/params.model'
import {Config} from '../../../config/config.default'
import {ClientError, ClientWarn} from '../../../../../core/log'

export module SubscriptService {
    export let subscription!: ClientSubscription
    let monitoredItems: Map<string, ItemAndName> = new Map()
    let subscriptionOption = Config.defaultSubscript

    function bindingAndPush(monitoredItem: ClientMonitoredItem, displayName: string, itemId: any) {
        try {
            itemId = itemId.toString()
            monitoredItem
                .on('changed', (data) => {
                    let item = monitoredItems.get(itemId)
                    if (item) {
                        MessageQueue.enqueue(
                            new UaMessage(data, monitoredItem.itemToMonitor.nodeId.toString(), item.displayName),
                        )
                    }
                })
                .on('err', (err) => {
                    throw new ClientError(Sources.subscriptService, Errors.errorMonitoringItem, err)
                })
            monitoredItems.set(itemId, {monitoredItem: monitoredItem, displayName: displayName})
        } catch (e: any) {
            throw new ClientError(Sources.subscriptService, Errors.errorBinding, e.message, e.stack)
        }
    }

    export function createSubscription(subOptions: ClientSubscriptionOptions = subscriptionOption) {
        try {
            subscription = ClientSubscription.create(SessionService.session, subOptions)
        } catch (e: any) {
            throw new ClientError(Sources.subscriptService, Errors.errorCreatingSub, e.message, e.stack)
        }
    }

    export async function modifySubscription(subOptions: ModifySubscriptionOptions) {
        try {
            await subscription.modify(subOptions)
        } catch (e: any) {
            throw new ClientError(Sources.subscriptService, Errors.errorModifySub, e.message, e.stack)
        }
    }

    export async function terminateSubscription() {
        if (subscription) {
            await subscription.terminate()
        }
    }

    /**
     * @description ????????????????????????monitored item
     * @param param
     */
    export function addMonitoredItems(param: SubscriptGroupParam) {
        try {
            param.parameters = param.parameters || {samplingInterval: 100, discardOldest: true, queueSize: 10,}
            param.timeStampToReturn = param.timeStampToReturn || TimestampsToReturn.Both
            if (subscription) {
                for (let i = 0; i < param.itemsToMonitor.length; i++) {
                    let monitoredItem = ClientMonitoredItem.create(
                        subscription,
                        param.itemsToMonitor[i],
                        param.parameters,
                        param.timeStampToReturn
                    )
                    bindingAndPush(monitoredItem, param.displayNames[i], param.itemsToMonitor[i].nodeId)
                }
            } else {
                throw new ClientWarn(Sources.subscriptService, Warns.noSubscription)
            }
        } catch (e: any) {
            throw new ClientError(Sources.subscriptService, Errors.errorAddMonitoredItem, e.message, e.stack)
        }
    }

    /**
     * @description ??????????????????????????????????????????????????????????????????
     * @param param
     */
    export function addMonitoredItem(param: SubscriptSingleParam) {
        try {
            param.parameters = param.parameters || {samplingInterval: 100, discardOldest: true, queueSize: 10,}
            param.timeStampToReturn = param.timeStampToReturn || TimestampsToReturn.Both
            let monitoredItem = ClientMonitoredItem.create(
                subscription,
                param.itemToMonitor,
                param.parameters,
                param.timeStampToReturn,
            )
            bindingAndPush(monitoredItem, param.displayName, param.itemToMonitor.nodeId)
        } catch (e: any) {
            throw new ClientError(Sources.subscriptService, Errors.errorAddMonitoredItem, e.message, e.stack)
        }
    }


    export async function getMonitoredItems() {
        if (subscription) {
            return await subscription.getMonitoredItems()
        }
    }

    /**
     * @description monitored items ????????????map??????????????????,???nodeId???string?????????
     * @param nodeIds
     */
    export async function deleteMonitoredItems(nodeIds: NodeID[]) {
        try {
            for (let nodeId of nodeIds) {
                let item = monitoredItems.get(nodeId)
                if (item) {
                    await item.monitoredItem.terminate()
                    monitoredItems.delete(nodeId)
                } else {
                    throw new ClientWarn(Sources.subscriptService, Warns.nonExistentItem, nodeId)
                }
            }
        } catch (e: any) {
            throw new ClientError(Sources.subscriptService, Errors.wrongIndexOfArray, e.message, e.stack)
        }
    }
}