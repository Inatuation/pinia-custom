<template>
    <div>
        <div>{{ store.counter }} / {{ store.dobuleCount }}</div>
        <button @click="handleClick">optionsStore</button>
    </div>
    <div>
        <div>{{ store2.counter }}/ {{ store2.dobuleCount }}</div>
        <button @click="handleClick2">setupStore</button>
    </div>
</template>

<script setup>
import { useCounterStore } from './stores/counter';
import { useCounterStore2 } from './stores/counter2';

const store = useCounterStore();
const store2 = useCounterStore2();

function handleClick() {
    // store.increment();
    store.$patch({ counter: 10 });
}
function handleClick2() {
    store2.increment();
}
</script>
