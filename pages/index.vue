<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSessionStorage } from '@vueuse/core'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const initialParticipants = ref<number | null>(null)
const participants = ref<number>(0)
const assignedNumbers = ref<number[]>([])
const sessionData = useSessionStorage<{ participants: number, assignedNumbers: number[] }>('gameData', { participants: 0, assignedNumbers: [] })
const isAssigning = ref<boolean>(false)
const validationMessage = ref<string>('')

const MESSAGES = {
  VALIDATION: '有効な参加者数を入力してください。',
  CONFIRM_FINISH: '本当に終了しますか？',
  BEFORE_UNLOAD: '本当に離れますか？ゲームの記録が削除されます。',
  ASSIGNMENT_NOTIFICATION: '番号が割り当てられました！',
  INPUT_PARTICIPANTS: '参加者数を入力してください',
  ASSIGN_NUMBERS: '番号を割り当てる',
  FINISH_GAME: '終了',
  NEXT_GAME: '次のゲーム'
}

const resetSessionData = () => {
  sessionData.value = { participants: 0, assignedNumbers: [] }
}

const assignNumbers = async () => {
  if (participants.value <= 0) {
    validationMessage.value = MESSAGES.VALIDATION
    return
  }
  resetAssignmentState()
  const usedNumbers = new Set<number>()
  isAssigning.value = true

  for (let i = 1; i <= participants.value; i++) {
    let number
    do {
      number = generateRandomNumber()
    } while (usedNumbers.has(number))
    usedNumbers.add(number)
    assignedNumbers.value.push(number)
  }

  saveSessionData()
  notifyAssignment()
  disableButtons()
}

const finishGame = () => {
  if (confirm(MESSAGES.CONFIRM_FINISH)) {
    resetGameState()
  }
}

const nextGame = () => {
  if (initialParticipants.value === null) {
    initialParticipants.value = participants.value
  }
  resetForNextGame()
}

const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  event.preventDefault()
  event.returnValue = MESSAGES.BEFORE_UNLOAD
  if (confirm(MESSAGES.BEFORE_UNLOAD)) {
    resetSessionData()
  }
}

onMounted(() => {
  if (sessionData.value.participants > 0) {
    restoreSessionData()
  }
  window.addEventListener('beforeunload', handleBeforeUnload)
})

setTimeout(resetSessionData, 6 * 60 * 60 * 1000) // 6時間

const getParticipantLabel = (index: number): string => {
  let label = ''
  while (index >= 0) {
    label = String.fromCharCode(65 + (index % 26)) + label
    index = Math.floor(index / 26) - 1
  }
  return label + 'さん'
}

const resetAssignmentState = () => {
  validationMessage.value = ''
  assignedNumbers.value = []
}

const generateRandomNumber = (): number => {
  return Math.floor(Math.random() * 100) + 1
}

const saveSessionData = () => {
  sessionData.value = { participants: participants.value, assignedNumbers: assignedNumbers.value }
  isAssigning.value = false
}

const notifyAssignment = () => {
  $q.notify({
    message: MESSAGES.ASSIGNMENT_NOTIFICATION,
    color: 'green',
    position: 'top',
    timeout: 2000,
    actions: [{ label: 'OK', color: 'white' }]
  })
}

const disableButtons = () => {
  isAssigning.value = true
}

const resetGameState = () => {
  sessionData.value = { participants: 0, assignedNumbers: [] }
  participants.value = 0
  assignedNumbers.value = []
  isAssigning.value = false
}

const resetForNextGame = () => {
  sessionData.value = { participants: initialParticipants.value ?? 0, assignedNumbers: [] }
  assignedNumbers.value = []
  isAssigning.value = false
}

const restoreSessionData = () => {
  participants.value = sessionData.value.participants
  initialParticipants.value = sessionData.value.participants
  assignedNumbers.value = sessionData.value.assignedNumbers
}
</script>

<template>
  <v-app>
    <v-main>
      <v-container>
        <h1>ITO</h1>
        <v-text-field v-model="participants" :label="MESSAGES.INPUT_PARTICIPANTS" type="number"></v-text-field>
        <v-btn @click="assignNumbers" :disabled="isAssigning" color="primary">{{ MESSAGES.ASSIGN_NUMBERS }}</v-btn>
        <v-btn @click="finishGame" color="red">{{ MESSAGES.FINISH_GAME }}</v-btn>
        <v-btn @click="nextGame" color="blue">{{ MESSAGES.NEXT_GAME }}</v-btn>
        <v-alert v-if="validationMessage" type="error">{{ validationMessage }}</v-alert>
        <v-list>
          <v-list-item v-for="(number, index) in assignedNumbers" :key="index">
            <v-chip color="teal" text-color="white" class="ma-2">
              {{ getParticipantLabel(index) }}: {{ number }}
            </v-chip>
          </v-list-item>
        </v-list>
      </v-container>
    </v-main>
  </v-app>
</template>

<style>
@import 'vuetify/lib/styles/main.sass';

.v-btn {
  font-size: 1.2em;
  font-weight: bold;
}

.v-chip {
  font-size: 1.1em;
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>