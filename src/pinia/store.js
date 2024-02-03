import { piniaSymbol } from './rootStore';
import { getCurrentInstance, inject, reactive, effectScope, computed, isRef, isReactive, toRefs, ref, watch } from 'vue';
import { addSubscription, triggerSubscriptions } from './subscribe';

function isComputed(v) {
    return (isRef(v) && v.effect);
}

function isObject(val) {
    return typeof val === 'object' && val !== null;
}

function mergeReactiveObject(target, state) {
    for (let key in state) {
        let oldValue = target[key];
        let newValue = state[key];
        if (isObject(oldValue) && isObject(newValue)) {
            target[key] = mergeReactiveObject(oldValue, newValue);
        } else {
            target[key] = newValue;
        }
    }
    return target;
}

function createSetupStore(id, setup, pinia, isOptions) {
    let scope;

    function $patch(partialStateOrMutatior) {
        // 判断入参类型
        if (typeof partialStateOrMutatior === 'object') {
            mergeReactiveObject(pinia.state.value[id], partialStateOrMutatior);
        } else {
            partialStateOrMutatior(pinia.state.value[id]);
        }
    }

    function $subscribe(callBack) {
        watch(pinia.state.value[id], (state) => {
            callBack({ storeId: id }, state)
        });
    }
    
    let actionSubscriptions = [];

    const partialStore = {
        $patch,
        $subscribe,
        $onAction: addSubscription.bind(null, actionSubscriptions)
    }
    const store = reactive(partialStore);
    const initState = pinia.state.value[id];
    if (!initState) { // setup API没有初始化过这个值
        pinia.state.value[id] = {};
    }
    const setupStore = pinia._e.run(() => {
        scope = effectScope();
        return scope.run(() => setup());
    });

    function warpAction(name, action) {
        return function (callBack) {
            const afterCallbackList = [];
            const onErrorCallbackList = [];
            function after(callBack) {
                afterCallbackList(callBack);
            }
            function onError(callBack) {
                onErrorCallbackList(callBack);
            }
            triggerSubscriptions(actionSubscriptions, {after, onError});
            try {
                let res = action.apply(store, arguments);
                triggerSubscriptions(afterCallbackList, res)
            } catch(error) {
                triggerSubscriptions(onErrorCallbackList, error);
            }

            if (res instanceof Promise) {
                return res.then((value) => {
                    triggerSubscriptions(afterCallbackList, value)
                }).catch(error => {
                    triggerSubscriptions(onErrorCallbackList, error);
                })
            }
            return res;
        }
    }
    for(let key in setupStore) {
        const prop = setupStore[key];
        if (typeof prop === 'function') {
            setupStore[key] = warpAction(key, prop);
        }
        if (!isOptions) {
            // 如果setup API 需要拿到状态存到全局的state中, computed也是ref，需要另外处理
            if ((isRef(prop) && !isComputed(prop)) || isReactive(prop)) {
                pinia.state.value[id][key] = prop;
            }
        }
    }
    Object.assign(store, setupStore);
    pinia._s.set(id, store);
    console.log(store)
    return store;
}

// 创建选项式的store
function createOptionsStore(id, options, pinia) {
    const { state, getters, actions } = options;

    function setup() {
        const localState = pinia.state.value[id] = state ? state() : {};
        return Object.assign(toRefs(ref(localState).value), actions, Object.keys(getters).reduce((memo, name) => {
            memo[name] = computed(() => {
                let store = pinia._s.get(id);
                return getters[name].call(store);
            })
            return memo;
        }, {}));
    }
    const store = createSetupStore(id, setup, pinia, true); 
    store.$reset = function () {
        const newState = state ? state() : {};
        store.$patch((state) => {
            Object.assign(state, newState);
        })
    }
    return store;
}

export function defineStore(idOrOptions, setup) {
    let id, options;
    const isSetupStore = typeof setup === 'function';
    if (typeof idOrOptions === 'string') {
        id = idOrOptions;
        options = setup;
    } else {
        id = idOrOptions.id;
        options = idOrOptions;
    }

    function useStore() {
        // 获取当前组件实例，拿到pinia实例
        const instance = getCurrentInstance();
        const pinia = instance && inject(piniaSymbol);
        // 判断是否初始化，如果pinia._s没有这个id，则设置一个
        if (!pinia._s.has(id)) {
            if (isSetupStore) {
                createSetupStore(id, setup, pinia);
            } else {
                createOptionsStore(id, options, pinia);
            }
        }
        const store = pinia._s.get(id);
        return store;
    }
    return useStore;
}
