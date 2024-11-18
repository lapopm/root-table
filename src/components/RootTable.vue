<template>
  <div class="root-table">
    <!-- 表格主体 -->
    <el-table
      ref="tableRef"
      v-bind="$attrs"
      :data="tableData"
      row-key="id"
      :tree-props="{
        children: 'children',
        hasChildren: 'hasChildren',
        lazy: props.lazy,
        load: loadNode,
      }"
      :lazy="props.lazy"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
    >
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
        <el-table-column v-bind="col" :show-overflow-tooltip="true" :sortable="col.sortable || 'custom'" :align="col.align || 'left'" :width="col.width">
          <!-- 自定义列内容 -->
          <template #default="scope" v-if="col.slot">
            <slot 
              :name="col.slot" 
              :row="scope.row"
              :index="scope.$index"
              :depth="getRowDepth(scope.row)"
            ></slot>
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
    default: () => [],
  },
  // 列配置
  columns: {
    type: Array,
    default: () => [],
  },
  // 是否显示多选
  showSelection: {
    type: Boolean,
    default: false,
  },
  // 是否可展开
  expandable: {
    type: Boolean,
    default: false,
  },
  // 是否显示分页
  showPagination: {
    type: Boolean,
    default: true,
  },
  // 总数据量
  total: {
    type: Number,
    default: 0,
  },
  // 是否开启懒加载
  lazy: {
    type: Boolean,
    default: false
  },
  // 懒加载回调函数
  loadMethod: {
    type: Function,
    default: null
  },
  // 默认展开的层级，-1表示展开所有
  defaultExpandLevel: {
    type: Number,
    default: 1
  },
  // 是否默认展开所有行
  defaultExpandAll: {
    type: Boolean,
    default: false
  },
  // 不同层级的API配置
  levelApis: {
    type: Object,
    default: () => ({})
    // 例如: { 1: loadLevel1, 2: loadLevel2 }
  }
})

const emit = defineEmits([
  'selection-change',
  'sort-change',
  'page-change',
  'node-expand',
  'node-collapse'
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
const handleSelectionChange = selection => {
  emit('selection-change', selection)
}

// 排序改变
const handleSortChange = sort => {
  emit('sort-change', sort)
}

// 页码改变
const handleCurrentChange = page => {
  currentPage.value = page
  emit('page-change', { page, size: pageSize.value })
}

// 每页条数改变
const handleSizeChange = size => {
  pageSize.value = size
  emit('page-change', { page: currentPage.value, size })
}

// 计算合计
const getSummaries = prop => {
  const values = props.data.map(item => Number(item[prop]))
  return values.reduce((prev, curr) => prev + curr, 0)
}

// 获取行的深度
const getRowDepth = (row, depth = 0) => {
  if (!row.parentId) return depth
  const parent = findParentRow(row.parentId)
  if (parent) {
    return getRowDepth(parent, depth + 1)
  }
  return depth
}

// 查找父行数据
const findParentRow = (parentId, data = props.data) => {
  for (const item of data) {
    if (item.id === parentId) return item
    if (item.children) {
      const found = findParentRow(parentId, item.children)
      if (found) return found
    }
  }
  return null
}

// 懒加载节点
const loadNode = async (row, treeNode, resolve) => {
  try {
    let children = []
    const depth = getRowDepth(row)
    const nextDepth = depth + 1
    
    // 优先使用对应层级的API
    if (props.levelApis[nextDepth]) {
      children = await props.levelApis[nextDepth](row)
    } 
    // 其次使用默认的loadMethod
    else if (props.loadMethod) {
      children = await props.loadMethod(row)
    }
    
    resolve(children)
  } catch (error) {
    console.error('加载子节点失败:', error)
    resolve([])
  }
}

// 展开/折叠所有节点
const expandAll = (expanded = true) => {
  const rows = getAllRows(props.data)
  rows.forEach(row => {
    tableRef.value?.toggleRowExpansion(row, expanded)
  })
}

// 获取所有行数据（扁平化）
const getAllRows = (data) => {
  const result = []
  const flatten = (items) => {
    items.forEach(item => {
      result.push(item)
      if (item.children && item.children.length) {
        flatten(item.children)
      }
    })
  }
  flatten(data)
  return result
}

// 展开指定层级
const expandToLevel = (level) => {
  const rows = getAllRows(props.data)
  rows.forEach(row => {
    const depth = getRowDepth(row)
    tableRef.value?.toggleRowExpansion(row, depth < level)
  })
}

// 初始化展开状态
const initExpand = () => {
  if (props.defaultExpandAll) {
    expandAll(true)
  } else if (props.defaultExpandLevel > 0) {
    expandToLevel(props.defaultExpandLevel)
  }
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
  },
  expandAll,
  expandToLevel,
  getRowDepth
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
