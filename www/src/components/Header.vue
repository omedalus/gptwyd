<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';

const elemSpacer = ref();
const elemHeader = ref();

function adjustSpacerSizeToMatchHeader(this: Window, event: Event) {
  if (!elemHeader.value || !elemSpacer.value) {
    return;
  }
  elemSpacer.value.style.height = `${elemHeader.value.offsetHeight}px`;
}

onMounted(() => {
  window.addEventListener('scroll', adjustSpacerSizeToMatchHeader);
  window.addEventListener('resize', adjustSpacerSizeToMatchHeader);
  adjustSpacerSizeToMatchHeader.bind(window)(new Event('scroll'));
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', adjustSpacerSizeToMatchHeader);
  window.removeEventListener('resize', adjustSpacerSizeToMatchHeader);
});

const emit = defineEmits<{}>();
</script>

<template>
  <div class="header-magic-static-spacer" ref="elemSpacer"></div>
  <header ref="elemHeader">
    <div class="header-contents">
      <div class="header-title">Perceptron visualizer</div>

      <div class="header-text"></div>

      <div class="header-controls"></div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.header-magic-static-spacer {
  display: block;
}

header {
  background-color: #333;
  text-align: center;
  position: relative;
  padding: 0;
  border-bottom: 1px solid #666;
  width: 100%;

  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;

  .header-contents {
    max-width: 1024px;
    margin: auto;
    min-height: 3em;
    padding: 0;

    display: flex;
    flex-direction: row;
    align-items: center;

    @media screen and (max-width: 1024px) {
      display: inline-block;
      padding: 0 1ex 0.5ex;
    }
  }
}

.header-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-right: auto;
  color: white;
  white-space: nowrap;
}
.header-text {
  a {
    white-space: nowrap;
  }

  @media screen and (max-width: 1024px) {
    padding-bottom: 1ex;
  }
}

.header-controls {
  margin-left: auto;
  font-size: 0.875rem;
  text-align: left;

  @media screen and (max-width: 1024px) {
    text-align: center;
  }

  .funny-explanation-controls-caption {
    font-weight: bold;
    color: white;
    font-style: italic;
  }
}

@keyframes animated-punctuation {
  0% {
    transform: rotate(-30deg);
    left: 0;
    top: 0;
  }
  25% {
    transform: rotate(30deg);
    top: -0.25ex;
  }
  50% {
    transform: rotate(-30deg);
    left: 1ex;
    top: 0;
  }
  75% {
    transform: rotate(30deg);
    top: 0.25ex;
  }
  100% {
    transform: rotate(-30deg);
    left: 0;
    top: 0;
  }
}

.animated-punctuation {
  display: inline-block;
  position: relative;
  animation: animated-punctuation 2s infinite;
}

.saveload-controls {
  font-size: 0.75rem;
  position: absolute;
  left: 0;
  top: calc(100% - 0.75ex);
  background-color: #333;
  padding: 0.5ex 1ex;
  padding-top: 0;
  border: 1.5px solid #666;
  border-top: none;
  border-left: none;
  border-radius: 0 0 1em 0;
  text-align: left;
  max-width: 40ex;

  .savemessage,
  .loadmessage {
    display: none;
    &.savemessage-showing,
    &.loadmessage-showing {
      display: block;
    }
  }

  .loadmessage {
    .sample-perceptron {
      a {
        display: block;
        margin-left: 1em;
        padding-left: 1em;
        position: relative;

        &::before {
          position: absolute;
          top: 0;
          left: 0;
          content: '⚬';
        }

        &:hover {
          &::before {
            content: '→';
          }
        }
      }
    }
  }
}
</style>
