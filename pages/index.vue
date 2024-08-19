<!-- Start of Selection -->
// ITO
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

const assignNumbers = async () => {
  if (participants.value <= 0) {
    validationMessage.value = '有効な参加者数を入力してください。'
    return
  }
  validationMessage.value = ''
  assignedNumbers.value = []
  const usedNumbers = new Set<number>()
  isAssigning.value = true

  for (let i = 1; i <= participants.value; i++) {
    let number
    do {
      number = Math.floor(Math.random() * 100) + 1
    } while (usedNumbers.has(number))
    usedNumbers.add(number)
    assignedNumbers.value.push(number)
  }

  sessionData.value = { participants: participants.value, assignedNumbers: assignedNumbers.value }
  isAssigning.value = false

  // エフェクトを追加
  $q.notify({
    message: '番号が割り当てられました！',
    color: 'green',
    position: 'top',
    timeout: 2000,
    actions: [{ label: 'OK', color: 'white' }]
  })

  // 番号が割り当てられた後、次のゲームまでボタンを無効化
  isAssigning.value = true
}

const finishGame = () => {
  if (confirm('本当に終了しますか？')) {
    sessionData.value = { participants: 0, assignedNumbers: [] }
    participants.value = 0
    assignedNumbers.value = []
    isAssigning.value = false // ゲーム終了時にボタンを有効化
  }
}

const nextGame = () => {
  if (initialParticipants.value === null) {
    initialParticipants.value = participants.value
  }
  sessionData.value = { participants: initialParticipants.value, assignedNumbers: [] }
  assignedNumbers.value = []
  isAssigning.value = false // 次のゲーム開始時にボタンを有効化
}

const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  event.preventDefault()
  // HACK: 非推奨だが、ブラウザによっては動作しないため、event.returnValueも設定
  event.returnValue = '本当に離れますか？ゲームの記録が削除されます。'
  if (confirm('本当に離れますか？ゲームの記録が削除されます。')) {
    sessionData.value = { participants: 0, assignedNumbers: [] }
  }
}

onMounted(() => {
  if (sessionData.value.participants > 0) {
    participants.value = sessionData.value.participants
    initialParticipants.value = sessionData.value.participants
    assignedNumbers.value = sessionData.value.assignedNumbers
  }
  window.addEventListener('beforeunload', handleBeforeUnload)
})

setTimeout(() => {
  sessionData.value = { participants: 0, assignedNumbers: [] }
}, 6 * 60 * 60 * 1000) // 6時間

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
        <h1>ITO</h1>
        <v-text-field v-model="participants" label="参加者数を入力してください" type="number"></v-text-field>
        <v-btn @click="assignNumbers" :disabled="isAssigning" color="primary">番号を割り当てる</v-btn>
        <v-btn @click="finishGame" color="red">終了</v-btn>
        <v-btn @click="nextGame" color="blue">次のゲーム</v-btn>
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
<!-- End of Selection -->