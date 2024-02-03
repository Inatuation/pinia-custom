import { defineStore } from '@/pinia'

export const useCounterStore = defineStore('counterStore', {
  state: () => {
    return {
      counter: 0
    }
  },
  actions: {
    increment() {
      this.counter++
    }    
  },
  getters: {
    dobuleCount() {
      console.log(this.counter, 111)
      return this.counter * 2
    }
  }
})
