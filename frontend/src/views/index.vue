<template>
  <el-container>
    <el-header>
      <el-button type="primary">按钮</el-button>
      <IconSprite name="ppt"></IconSprite>
    </el-header>
    <el-container>
      <el-aside width="200px">Aside</el-aside>
      <el-main>Main</el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import useUserStore from '@/store/user'
const userStore = useUserStore()

userStore.getUserInfo();
</script>