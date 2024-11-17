<template>
  <div class="root-table">
    <!-- 表格主体 -->
    <el-table
      ref="tableRef"
      v-bind="$attrs"
      :data="tableData"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange">
      
      <!-- 多选列 -->
      <el-table-column v-if="showSelection" type="selection" width="55" />
      
      <!-- 展开行 -->
      <el-table-column v-if="expandable" type="expand">
        <template #default="scope">
          <slot name="expand" :row="scope.row"></slot>
        </template>
      </el-table-column>

      <!-- 动态列 -->
      <template v-for="col in columns" :key="col.prop">
        <el-table-column
          v-bind="col"
          :show-overflow-tooltip="true"
          :sortable="col.sortable || 'custom'">
          <!-- 自定义列内容 -->
          <template #default="scope" v-if="col.slot">
            <slot :name="col.slot" :row="scope.row"></slot>
          </template>
          <!-- 求和列 -->
          <template #footer v-if="col.showSum">
            {{ getSummaries(col.prop) }}
          </template>
        </el-table-column>
      </template>
    </el-table>

    <!-- 分页器 -->
    <el-pagination
      v-if="showPagination"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  // 表格数据
  data: {
    type: Array,
    default: () => []
  },
  // 列配置
  columns: {
    type: Array,
    default: () => []
  },
  // 是否显示多选
  showSelection: {
    type: Boolean,
    default: false
  },
  // 是否可展开
  expandable: {
    type: Boolean,
    default: false
  },
  // 是否显示分页
  showPagination: {
    type: Boolean,
    default: true
  },
  // 总数据量
  total: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits([
  'selection-change',
  'sort-change',
  'page-change'
])

// 表格实例
const tableRef = ref(null)

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)

// 计算分页后的数据
const tableData = computed(() => {
  if (!props.showPagination) return props.data
  const start = (currentPage.value - 1) * pageSize.value
  return props.data.slice(start, start + pageSize.value)
})

// 多选改变
const handleSelectionChange = (selection) => {
  emit('selection-change', selection)
}

// 排序改变
const handleSortChange = (sort) => {
  emit('sort-change', sort)
}

// 页码改变
const handleCurrentChange = (page) => {
  currentPage.value = page
  emit('page-change', { page, size: pageSize.value })
}

// 每页条数改变
const handleSizeChange = (size) => {
  pageSize.value = size
  emit('page-change', { page: currentPage.value, size })
}

// 计算合计
const getSummaries = (prop) => {
  const values = props.data.map(item => Number(item[prop]))
  return values.reduce((prev, curr) => prev + curr, 0)
}

// 暴露方法给父组件
defineExpose({
  tableRef,
  // 清除选择
  clearSelection: () => {
    tableRef.value?.clearSelection()
  },
  // 设置选中行
  toggleRowSelection: (row, selected) => {
    tableRef.value?.toggleRowSelection(row, selected)
  }
})
</script>

<style lang="scss" scoped>
.root-table {
  .el-pagination {
    margin-top: 20px;
    justify-content: flex-end;
  }
}
</style>