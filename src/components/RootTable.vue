<template>
  <div class="root-table">
    <!-- 表格工具栏 -->
    <div class="table-toolbar" v-if="showToolbar">
      <div class="left">
        <slot name="toolbar-left"></slot>
      </div>
      <div class="right">
        <!-- 列显示控制器 -->
        <el-popover v-if="showColumnFilter" trigger="click">
          <template #reference>
            <el-button :icon="Setting">列设置</el-button>
          </template>
          <el-checkbox-group v-model="visibleColumns">
            <el-checkbox 
              v-for="col in columnOptions"
              :key="col.prop"
              :label="col.prop"
            >
              {{ col.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-popover>
        <slot name="toolbar-right"></slot>
      </div>
    </div>

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
      :show-header="showHeader"
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
      <template v-for="col in columnOptions" :key="col.prop">
        <el-table-column v-bind="col" :show-overflow-tooltip="true" :sortable="getSortable(col)" :align="col.align || 'left'" :width="col.width">
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Setting } from '@element-plus/icons-vue'

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
    default: false,
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
  },
  // 是否显示表格工具栏
  showToolbar: {
    type: Boolean,
    default: true
  },
  // 是否显示列设置控制器
  showColumnFilter: {
    type: Boolean,
    default: true
  },
  storageKey: {
    type: String,
    default: ''
  },
  // 虚拟滚动
  useVirtual: {
    type: Boolean,
    default: false
  },
  rowHeight: {
    type: Number,
    default: 40
  },
  rowClassName: {
    type: [String, Function],
    default: ''
  },
  cellClassName: {
    type: [String, Function],
    default: ''
  },
  summaryMethod: {
    type: Function,
    default: null
  },
  spanMethod: {
    type: Function,
    default: null
  },
  showHeader: {
    type: Boolean,
    default: true
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

// 获取排序属性
const getSortable = (column) => {
  // 如果明确设置了 sortable 为 false，则禁用排序
  if (column.sortable === false) {
    return false
  }
  // 如果设置了具体的排序方式（'custom' 或 true），则使用设置的值
  if (column.sortable) {
    return column.sortable
  }
  // 默认不排序
  return false
}

const columnOptions = computed(() => 
  props.columns.filter(col => 
    // 过滤掉没有 label 的列和特殊列（如操作列）
    col.label
  )
)

// 列显示控制
const visibleColumns = ref([]) // 初始化为空数组

// 初始化可见列
onMounted(() => {
  // 只初始化有效的列
  visibleColumns.value = columnOptions.value.map(col => col.prop)
  loadSavedColumns()
})

// 监听列变化
watch(() => props.columns, () => {
  // 确保 visibleColumns 中只包含有效的列
  visibleColumns.value = visibleColumns.value.filter(prop => 
    columnOptions.value.some(col => col.prop === prop)
  )
}, { deep: true })

// 加载保存的列设置
const loadSavedColumns = () => {
  if (props.storageKey) {
    try {
      const saved = localStorage.getItem(`table_columns_${props.storageKey}`)
      if (saved) {
        visibleColumns.value = JSON.parse(saved)
      }
    } catch (error) {
      console.error('加载列设置失败:', error)
    }
  }
}

onMounted(() => {
  loadSavedColumns()
})

// 新增导出方法
const exportTable = async (options = {}) => {
  const {
    filename = 'table-export.xlsx',
    formatter = null,
    onlySelected = false
  } = options

  try {
    const data = onlySelected ? selectedRows.value : props.data
    const exportData = formatter ? data.map(formatter) : data
    
    // 使用 xlsx 库导出
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
    XLSX.writeFile(workbook, filename)
  } catch (error) {
    console.error('导出失败:', error)
  }
}

// 状态持久化
const saveTableState = () => {
  if (!props.storageKey) return
  
  const state = {
    visibleColumns: visibleColumns.value,
    pageSize: pageSize.value,
    sortConfig: currentSort.value
  }
  localStorage.setItem(`table_state_${props.storageKey}`, JSON.stringify(state))
}

const loadTableState = () => {
  if (!props.storageKey) return
  
  try {
    const state = JSON.parse(localStorage.getItem(`table_state_${props.storageKey}`))
    if (state) {
      visibleColumns.value = state.visibleColumns
      pageSize.value = state.pageSize
      // 恢复排序状态
      if (state.sortConfig) {
        handleSortChange(state.sortConfig)
      }
    }
  } catch (error) {
    console.error('加载表格状态失败:', error)
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
  getRowDepth,
  exportTable
})

const editingRows = ref(new Set())

const isEditing = (row) => editingRows.value.has(row.id)

const startEdit = (row) => {
  editingRows.value.add(row.id)
}

const endEdit = async (row) => {
  try {
    await validateRow(row)
    await saveRow(row)
    editingRows.value.delete(row.id)
  } catch (error) {
    console.error('保存失败:', error)
  }
}

// 启用拖拽排序
const enableDragSort = () => {
  if (!tableRef.value) return
  
  const tbody = tableRef.value.$el.querySelector('.el-table__body tbody')
  sortable.create(tbody, {
    handle: '.drag-handle',
    onEnd: ({ oldIndex, newIndex }) => {
      const data = [...props.data]
      const [moved] = data.splice(oldIndex, 1)
      data.splice(newIndex, 0, moved)
      emit('update:data', data)
    }
  })
}

// 表格高度自适应
const tableHeight = ref(0)
onMounted(() => {
  const updateHeight = () => {
    if (tableRef.value?.$el) {
      const { top } = tableRef.value.$el.getBoundingClientRect()
      tableHeight.value = window.innerHeight - top - 20
    }
  }
  updateHeight()
  window.addEventListener('resize', updateHeight)
  onUnmounted(() => {
    window.removeEventListener('resize', updateHeight)
  })
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
