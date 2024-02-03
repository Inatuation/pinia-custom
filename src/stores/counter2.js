import { ref, computed } from 'vue'
import { defineStore } from '@/pinia'

export const useCounterStore2 = defineStore('counterStore2', () => {
  const counter = ref(0);
  function increment() {
    this.counter++
  }
  const dobuleCount = computed(() => {
    return counter.value * 2;
  })
  return { counter, increment, dobuleCount }
})
