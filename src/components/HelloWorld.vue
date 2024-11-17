<template>
  <root-table
    :data="tableData"
    :columns="columns"
    :show-selection="true"
    :expandable="true"
    @selection-change="onSelectionChange"
    @sort-change="onSortChange"
    @page-change="onPageChange">
    
    <!-- 展开行插槽 -->
    <template #expand="{ row }">
      <div>展开行内容: {{ row.name }}</div>
    </template>
    
    <!-- 自定义列插槽 -->
    <template #action="{ row }">
      <el-button @click="handleEdit(row)">编辑</el-button>
    </template>
  </root-table>
</template>

<script setup>
import RootTable from './RootTable.vue'
import { ref } from 'vue'
const tableData = ref([
  { name: 'John Brown', age: 30, amount: 100 },
  { name: 'Jim Green', age: 40, amount: 200 },
  { name: 'Joe Black', age: 50, amount: 300 }
])
const columns = [
  { prop: 'name', label: '姓名' },
  { prop: 'age', label: '年龄', sortable: true },
  { prop: 'amount', label: '金额', showSum: true },
  { prop: 'action', label: '操作', slot: 'action' }
]
</script>

<style lang="scss" scoped></style>