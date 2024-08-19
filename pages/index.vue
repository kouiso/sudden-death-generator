<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSessionStorage } from '@vueuse/core'

const participants = ref<number>(0)
const assignedNumbers = ref<number[]>([])
const sessionData = useSessionStorage<{ participants: number, assignedNumbers: number[] }>('gameData', { participants: 0, assignedNumbers: [] })

const assignNumbers = () => {
  assignedNumbers.value = []
  const usedNumbers = new Set<number>()
  for (let i = 1; i <= participants.value; i++) {
    let number
    do {
      number = Math.floor(Math.random() * 100) + 1
    } while (usedNumbers.has(number))
    usedNumbers.add(number)
    
    assignedNumbers.value.push(number)
  }
  sessionData.value = { participants: participants.value, assignedNumbers: assignedNumbers.value }
}

const finishGame = () => {
  if (confirm('Are you sure?')) {
    sessionData.value = { participants: 0, assignedNumbers: [] }
    participants.value = 0
    assignedNumbers.value = []
  }
}

onMounted(() => {
  if (sessionData.value.participants > 0) {
    participants.value = sessionData.value.participants
    assignedNumbers.value = sessionData.value.assignedNumbers
  }
})

setTimeout(() => {
  sessionData.value = { participants: 0, assignedNumbers: [] }
}, 6 * 60 * 60 * 1000) // 6 hours

const getParticipantLabel = (index: number): string => {
  let label = ''
  while (index >= 0) {
    label = String.fromCharCode(65 + (index % 26)) + label
    index = Math.floor(index / 26) - 1
  }
  return label + 'さん'
}
</script>

<template>
  <v-app>
    <v-main>
      <v-container>
        <v-text-field v-model="participants" label="Enter number of participants" type="number"></v-text-field>
        <v-btn @click="assignNumbers">Assign Numbers</v-btn>
        <v-btn @click="finishGame">Finish</v-btn>
        <v-list>
          <v-list-item v-for="(number, index) in assignedNumbers" :key="index">
            {{ getParticipantLabel(index) }}: {{ number }}
          </v-list-item>
        </v-list>
      </v-container>
    </v-main>
  </v-app>
</template>

<style>
@import 'vuetify/lib/styles/main.sass';
</style>