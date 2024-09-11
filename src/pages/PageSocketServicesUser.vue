<!-- src/pages/TestApiPage.vue -->

<template>
  <q-page padding>
    <q-card v-if="currentState == 'CLOSED'">
      <q-card-section>
        <div class="text-h6">Socket is in state :{{ currentState }}</div>
        <div><q-btn label="CONNECT" @click="connect" color="primary" /></div>
      </q-card-section>
    </q-card>

    <q-card v-if="currentState == 'OPEN'">
      <q-card-section>
        <div class="text-h6">Socket is in state : {{ currentState }}</div>
        <div><q-btn label="CLOSE" @click="close" color="primary" /></div>
      </q-card-section>

      <q-card-section v-if="error_socket" class="text-negative">
        Erreur socket: {{ error_socket }}
      </q-card-section>
      <q-card-section v-if="error_message" class="text-negative">
        Erreur message: {{ error_message }}
      </q-card-section>
    </q-card>
    <q-card v-if="currentState == 'OPEN'">
      <q-card-section>
        <div class="text-h6">Send Message</div>
        <div><q-btn label="SEND" @click="sendMessage" color="primary" /></div>
      </q-card-section>
    </q-card>
    <q-card v-if="datas">
      <q-card-section>
        <div v-html="datas"></div>
      </q-card-section>
      <q-card-section v-if="currentState == 'OPEN'">
        <div class="text-h6">ERASE</div>
        <div><q-btn label="ERASE" @click="datas = ''" color="primary" /></div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, onUnmounted } from 'vue';
import { WebSocketClient, WebSocketOutMessage } from '../services/ServicesSocketUsers';

export default defineComponent({
  name: 'TestApiPage',
  setup() {
    const webSocketClient = new WebSocketClient(); // Create instance of WebSocketClient
    const currentState = webSocketClient.currentState; // Track current WebSocket state
    const error_socket = ref<string | null>(null); // Error message
    const datas = webSocketClient.datas;
    const error_message = webSocketClient.error_message;

    const prompt = ref<string>('Donne moi les planètes du système solaire');

    onUnmounted(() => {
      if (currentState.value === 'OPEN') {
        webSocketClient.closeConnection(); // Close WebSocket connection when component is unmounted
      }
    });

    // Connect to WebSocket
    const connect = async () => {
      try {
        await webSocketClient.connect(); // Establish WebSocket connection
        error_socket.value = null; // Reset any previous error_message messages
      } catch (error_message) {
        error_socket.value = 'Failed to connect to WebSocket';
      }
    };

    // Send a message through WebSocket
    const sendMessage = () => {
      try {
        const message: WebSocketOutMessage = {
          action: 'sendmessage',
          data: { prompt: prompt.value } as never,
        };
        webSocketClient.sendMessage(message);

        error_socket.value = null;
      } catch (error_message) {
        error_socket.value = 'Failed to send message';
      }
    };

    // Close the WebSocket connection
    const close = () => {
      try {
        webSocketClient.closeConnection();
        error_socket.value = null;
        datas.value = '';
      } catch (error_message) {
        error_socket.value = 'Failed to close WebSocket';
      }
    };

    return {
      datas,
      error_message,
      currentState,
      error_socket,
      prompt,
      connect,
      sendMessage,
      close,
    };
  },
});
</script>

<style lang="scss">
.text-negative {
  color: #f44336;
}
person {
  text-decoration: none;
  border-bottom: 1px dotted;
  color: #00a551;
}
role {
  text-decoration: none;
  border-bottom: 1px dotted;
  color: #2884fd;
}
company {
  text-decoration: none;
  border-bottom: 1px dotted;
  color: #ff1616;
}
amount {
  text-decoration: none;
  border-bottom: 1px dotted;
  color: #e400ff;
}
date {
  text-decoration: none;
  border-bottom: 1px dotted;
  color: #810eff;
}
location {
  text-decoration: none;
  color: #e99617;
}
share {
  text-decoration: none;
  border-bottom: 1px dotted;
  color: #e400ff;
}
siren {
  text-decoration: none;
  border-bottom: 1px dotted;
  color: #0084f0;
}
</style>
