<template>
    <main>
        <h1>Calendar</h1>
        <p>This is the calendar view.</p>
    </main>
</template>


<script setup lang="ts">
import { onMounted } from 'vue'
import { supabase } from '../lib/supabase'

onMounted(async () => {
  const { data, error } = await supabase.auth.getSession()

  console.log('Supabase session:', data)
  console.log('Supabase error:', error)
})
</script>