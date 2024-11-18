<template>
  <root-table
    ref="tableRef"
    :data="treeData"
    :columns="columns"
    :lazy="true"
    :level-apis="levelApis"
    :default-expand-level="2"
    @selection-change="onSelectionChange"
    v-loading="loading"
    :element-loading-text="loadingText"
    :element-loading-spinner="loadingSpinner"
    :element-loading-background="loadingBackground"
    :show-header="false"
  >
  </root-table>
  <div v-if="error" class="table-error">
    {{ error }}
    <el-button @click="retry">重试</el-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
// import { getFirstLevel, getSecondLevel, getThirdLevel } from '@/api/tree'
const loading = ref(false)
const error = ref(null)

const loadData = async () => {
  loading.value = true
  error.value = null
  try {
    // 加载数据逻辑
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
// 定义不同层级的加载方法
const levelApis = {
  1: async row => {
    // 加载一级子节点
    const res = await getFirstLevel({ parentId: row.id })
    return res.data.map(item => ({
      ...item,
      hasChildren: true, // 标记还有子节点
    }))
  },
  2: async row => {
    // 加载二级子节点，可能使用不同的API和参数
    const res = await getSecondLevel({
      parentId: row.id,
      type: row.type,
      // 其他特定参数
    })
    return res.data
  },
  3: async row => {
    // 加载三级子节点
    const res = await getThirdLevel({
      parentId: row.id,
      // 其他特定参数
    })
    return res.data
  },
}

// API示例
// const mockApis = {
//   // 模拟一级数据加载
//   async getFirstLevel({ parentId }) {
//     return new Promise((resolve) => {
//       setTimeout(() => {
//         resolve({
//           data: [
//             {
//               id: `${parentId}-1`,
//               name: '一级部门',
//               type: 'department',
//               parentId
//             }
//           ]
//         })
//       }, 500)
//     })
//   },

//   // 模拟二级数据加载
//   async getSecondLevel({ parentId, type }) {
//     return new Promise((resolve) => {
//       setTimeout(() => {
//         resolve({
//           data: [
//             {
//               id: `${parentId}-2`,
//               name: '二级团队',
//               type: 'team',
//               parentId
//             }
//           ]
//         })
//       }, 500)
//     })
//   },

//   // 模拟三级数据加载
//   async getThirdLevel({ parentId }) {
//     return new Promise((resolve) => {
//       setTimeout(() => {
//         resolve({
//           data: [
//             {
//               id: `${parentId}-3`,
//               name: '三级成员',
//               type: 'member',
//               parentId
//             }
//           ]
//         })
//       }, 500)
//     })
//   }
// }

// 初始数据
const treeData = ref([
  {
    id: 1,
    name: '总公司',
    type: 'company',
    hasChildren: true,
  },
  {
    id: 2,
    name: '2总公司',
    type: 'company',
    hasChildren: true,
  },
  {
    id: 3,
    name: '3总公司',
    type: 'company',
    hasChildren: true,
  },
  {
    id: 4,
    name: '4总公司',
    type: 'company',
    hasChildren: true,
  },
])

// 列配置
const columns = [
  {
    prop: 'name',
    // label: '名称',
    width: '200',
    sortable: false,
  },
  {
    prop: 'type',
    label: '类型',
    formatter: row => {
      const typeMap = {
        company: '公司',
        department: '部门',
        team: '团队',
        member: '成员',
      }
      return typeMap[row.type] || row.type
    },
  },
  {
    prop: 'action',
    label: '操作',
    slot: 'action',
    width: '200',
  },
]
</script>

<style lang="scss" scoped></style>

