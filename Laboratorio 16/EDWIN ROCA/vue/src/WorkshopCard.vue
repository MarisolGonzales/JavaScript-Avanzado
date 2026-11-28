<script setup>
import { ref } from 'vue';
const quantity = ref(1);
defineProps({ workshop: Object, disabled: Boolean });
const emit = defineEmits(['reserve']);
</script>
<template>
  <article class="tile">
    <h2>{{ workshop.title }}</h2>
    <p>{{ workshop.seats }} cupos disponibles</p>
    <label>Cupos <select v-model.number="quantity" :disabled="disabled"><option v-for="n in 4" :key="n" :value="n">{{ n }}</option></select></label>
    <button :disabled="disabled || !Number.isInteger(quantity) || quantity < 1 || quantity > 4 || quantity > workshop.seats"
      @click="emit('reserve', workshop.id, quantity)">Reservar {{ quantity }} cupo(s)</button>
  </article>
</template>
