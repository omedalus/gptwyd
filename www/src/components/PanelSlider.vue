<script setup lang="ts">
import { ref } from 'vue';

const isMousePressed = ref(false);
const xMousePressed = ref(0);

const onMouseExited = (ev: MouseEvent) => {
  if (!isMousePressed.value) {
    return;
  }

  isMousePressed.value = false;

  const xMouseMovement = ev.screenX - xMousePressed.value;

  if (xMouseMovement < 0) {
    emit('slide', 'left');
  } else {
    emit('slide', 'right');
  }
};

const emit = defineEmits<{
  (e: 'slide', d: 'left' | 'right'): void;
}>();
</script>

<template>
  <div
    class="panel-slider-component"
    @mousedown.prevent="
      xMousePressed = $event.screenX;
      isMousePressed = true;
    "
    @mouseup="isMousePressed = false"
    @mouseleave="onMouseExited($event)"
  >
    <div class="panel-slider-ui-indicator"></div>
  </div>
</template>

<style scoped lang="scss">
.panel-slider-component {
  height: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding-left: 1ex;
  padding-right: 1ex;
  cursor: col-resize;

  .panel-slider-ui-indicator {
    width: 0.5ex;
    height: 15em;
    border: 1px solid #6666;
    border-top: none;
    border-bottom: none;
  }
}
</style>
