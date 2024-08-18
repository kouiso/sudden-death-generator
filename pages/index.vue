<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStorage } from '@vueuse/core'
// Removed import of useVuetify as it does not exist

const participants = ref<number>(0)
const assignedNumbers = ref<Map<number, number>>(new Map())
const router = useRouter()
const sessionData = useSessionStorage('gameData', { participants: 0, assignedNumbers: [] })

const assignNumbers = () => {
  assignedNumbers.value.clear()
  for (let i = 1; i <= participants.value; i++) {
    let number
    do {
      number = Math.floor(Math.random() * participants.value) + 1
    } while (Array.from(assignedNumbers.value.values()).includes(number))
    assignedNumbers.value.set(i, number)
  }
  sessionData.value = { participants: participants.value, assignedNumbers: Array.from(assignedNumbers.value.entries()) }
}

const finishGame = () => {
  // Removed usage of useVuetify and replaced with a simple confirm dialog
  if (confirm('Are you sure?')) {
    sessionData.value = { participants: 0, assignedNumbers: [] }
    participants.value = 0
    assignedNumbers.value.clear()
  }
}

onMounted(() => {
  if (sessionData.value.participants > 0) {
    participants.value = sessionData.value.participants
    assignedNumbers.value = new Map(sessionData.value.assignedNumbers)
  }
})

setTimeout(() => {
  sessionData.value = { participants: 0, assignedNumbers: [] }
}, 6 * 60 * 60 * 1000) // 6 hours
</script>

<template>
  <v-app>
    <v-main>
      <v-container>
        <v-text-field v-model="participants" label="Enter number of participants" type="number"></v-text-field>
        <v-btn @click="assignNumbers">Assign Numbers</v-btn>
        <v-btn @click="finishGame">Finish</v-btn>
        <v-list>
          <v-list-item v-for="(number, participant) in assignedNumbers" :key="participant">
            Participant {{ participant }}: {{ number }}
          </v-list-item>
        </v-list>
      </v-container>
    </v-main>
  </v-app>
</template>

<style>
@import 'vuetify/lib/styles/main.sass';
</style>