const ROOT_MENU_ID = 'VMP'

export const normalizeMenuPath = (path) => {
  const value = String(path || '').trim()

  if (!value) {
    return ''
  }

  const normalized = `/${value.replace(/^\/+|\/+$/g, '')}`
  return normalized === '/' ? '/' : normalized.replace(/\/{2,}/g, '/')
}

const joinMenuPath = (parentPath, childPath) => {
  const normalizedParentPath = normalizeMenuPath(parentPath)
  const normalizedChildPath = normalizeMenuPath(childPath)

  if (!normalizedParentPath) {
    return normalizedChildPath
  }

  if (!normalizedChildPath) {
    return normalizedParentPath
  }

  if (normalizedChildPath.startsWith(`${normalizedParentPath}/`)) {
    return normalizedChildPath
  }

  return normalizeMenuPath(`${normalizedParentPath}/${normalizedChildPath.slice(1)}`)
}

const getCreateTimeValue = (createTime) => {
  if (!createTime) {
    return Number.MAX_SAFE_INTEGER
  }

  const timestamp = new Date(String(createTime).replace(' ', 'T')).getTime()
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp
}

const sortMenuNodes = (nodes) => {
  return nodes.sort((a, b) => {
    return getCreateTimeValue(a.createTime) - getCreateTimeValue(b.createTime) ||
      a.sourceIndex - b.sourceIndex
  })
}

export const buildPermissionMenuTree = (menus) => {
  if (!Array.isArray(menus)) {
    return []
  }

  const nodeMap = new Map()

  menus.forEach((menu, sourceIndex) => {
    const menuId = String(menu?.menuId || '')

    if (!menuId || nodeMap.has(menuId)) {
      return
    }

    nodeMap.set(menuId, {
      ...menu,
      menuId,
      pid: String(menu?.pid || ''),
      path: normalizeMenuPath(menu?.path),
      sourceIndex,
      children: [],
    })
  })

  const roots = []

  nodeMap.forEach((node) => {
    const parent = nodeMap.get(node.pid)

    if (node.pid === ROOT_MENU_ID || !parent) {
      roots.push(node)
      return
    }

    parent.children.push(node)
  })

  const completeTree = (nodes, parentPath = '') => {
    return sortMenuNodes(nodes).map((node) => {
      const fullPath = parentPath ? joinMenuPath(parentPath, node.path) : node.path

      return {
        ...node,
        fullPath,
        children: completeTree(node.children, fullPath),
      }
    })
  }

  return completeTree(roots)
}

export const filterNavigableMenuTree = (menuTree) => {
  return menuTree
    .map((menu) => ({
      ...menu,
      children: filterNavigableMenuTree(menu.children || []),
    }))
    .filter((menu) => menu.pid !== ROOT_MENU_ID || menu.children.length > 0)
}

export const collectPermittedPaths = (menuTree) => {
  const paths = []

  const walk = (nodes) => {
    nodes.forEach((node) => {
      if (node.children?.length) {
        walk(node.children)
        return
      }

      if (node.pid !== ROOT_MENU_ID && node.fullPath) {
        paths.push(normalizeMenuPath(node.fullPath))
      }
    })
  }

  walk(menuTree)
  return [...new Set(paths)]
}
