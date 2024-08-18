<template>
    <v-app>
      <v-main>
        <v-container>
          <v-btn @click="showMessage">Click me</v-btn>
          <v-alert v-if="message" type="success">{{ message }}</v-alert>
        </v-container>
      </v-main>
    </v-app>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const message = ref('')
  const showMessage = () => {
    message.value = 'Hello World!'
  }
  </script>