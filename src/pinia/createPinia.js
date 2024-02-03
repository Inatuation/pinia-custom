import { effectScope, ref } from 'vue';
import { piniaSymbol } from './rootStore';

export function createPinia() {
    const scope = effectScope();
    const state = scope.run(() => ref({})); // 用于存储每个store的state方法
    const pinia = {
        _s: new Map(), // 用来存储所有的store实例，{storeName: store, storeName2: store2}
        _e: scope, // effectScope实例
        state, // 存储所有store的state状态值
        install(app) {
            // 注入依赖
            app.provide(piniaSymbol, pinia); // 让所有的store都能够拿到pinia实例

            app.config.globalProperties.$pinia = pinia;
        }
    }
    return pinia;
}