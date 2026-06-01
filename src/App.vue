<script setup lang="ts">
import FlowPipeline from './components/FlowPipeline/index.vue'
</script>

<template>
  <div class="app-stage">
    <FlowPipeline
      :width="640"
      :height="240"
      :paths="[
        { points: [[40, 120], [200, 120], [200, 60], [420, 60], [420, 180], [600, 180]] }
      ]"
      :nodes="[
        { pathIndex: 0, position: 0.3, radius: 4, pulse: true, color: '#f8fbff', glowColor: '#52f2d5' },
        { pathIndex: 0, position: 0.7, radius: 4, pulse: true, color: '#f8fbff', glowColor: '#58b8ff' }
      ]"
    />
  </div>
</template>

<style scoped>
.app-stage {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 24px;
  background: radial-gradient(circle at 30% 20%, #0f1b2e 0%, #060b16 100%);
  box-sizing: border-box;
}
</style>
