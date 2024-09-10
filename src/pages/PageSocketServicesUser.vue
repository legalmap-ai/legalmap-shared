<!-- src/pages/TestApiPage.vue -->

<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <div class="text-h6">CONNECT: {{ currentState }}</div>
        <div><q-btn label="CONNECT" @click="connect" color="primary" /></div>
      </q-card-section>
    </q-card>
    <q-card>
      <q-card-section>
        <q-input v-model="prompt" label="Prompt" />

        <div class="text-h6">Send Message</div>
        <div><q-btn label="SEND" @click="sendMessage" color="primary" /></div>
      </q-card-section>
    </q-card>
    <q-card>
      <q-card-section>
        <div class="text-h6">Close</div>
        <div><q-btn label="CLOSE" @click="close" color="primary" /></div>
      </q-card-section>

      <q-card-section v-if="error_message" class="text-negative">
        Erreur: {{ error_message }}
      </q-card-section>
    </q-card>

    <q-card>
      <q-card-section>
        <div v-html="datas"></div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, onUnmounted } from 'vue';
import { WebSocketClient, WebSocketMessage } from '../services/ServicesSocketUsers';

export default defineComponent({
  name: 'TestApiPage',
  setup() {
    const webSocketClient = new WebSocketClient(); // Create instance of WebSocketClient
    const currentState = webSocketClient.currentState; // Track current WebSocket state
    const error_message = ref<string | null>(null); // Error message
    const datas = webSocketClient.datas;
    const prompt = ref<string>('Bonjour !');

    onUnmounted(() => {
      if (currentState.value === 'OPEN') {
        webSocketClient.closeConnection(); // Close WebSocket connection when component is unmounted
      }
    });

    // Connect to WebSocket
    const connect = async () => {
      try {
        await webSocketClient.connect(); // Establish WebSocket connection
        error_message.value = null; // Reset any previous error messages
      } catch (error) {
        error_message.value = 'Failed to connect to WebSocket';
      }
    };

    // Send a message through WebSocket
    const sendMessage = () => {
      try {
        const message: WebSocketMessage = {
          action: 'sendmessage',
          data: { prompt: prompt.value } as never,
        };
        webSocketClient.sendMessage(message);

        error_message.value = null;
      } catch (error) {
        error_message.value = 'Failed to send message';
      }
    };

    // Close the WebSocket connection
    const close = () => {
      try {
        webSocketClient.closeConnection();
        error_message.value = null;
      } catch (error) {
        error_message.value = 'Failed to close WebSocket';
      }
    };

    return {
      datas,
      currentState,
      error_message,
      prompt,
      connect,
      sendMessage,
      close,
    };
  },
});
</script>

<style scoped>
.text-negative {
  color: #f44336;
}
</style>
