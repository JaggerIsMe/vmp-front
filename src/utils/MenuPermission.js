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

const getOrderNumValue = (orderNum) => {
  if (orderNum === '' || orderNum === null || orderNum === undefined) {
    return Number.MAX_SAFE_INTEGER
  }

  const value = Number(orderNum)
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER
}

const sortMenuNodes = (nodes) => {
  return nodes.sort((a, b) => {
    return getOrderNumValue(a.orderNum) - getOrderNumValue(b.orderNum) ||
      a.sourceIndex - b.sourceIndex
  })
}

export const normalizeMenuDropPosition = (position) => {
  if (position === 'prev') {
    return 'before'
  }
  if (position === 'next') {
    return 'after'
  }
  return position
}

export const canDropMenu = (menu, targetMenu, position) => {
  const normalizedPosition = normalizeMenuDropPosition(position)
  if (normalizedPosition !== 'before' && normalizedPosition !== 'after') {
    return false
  }

  const menuId = String(menu?.menuId || '')
  const targetMenuId = String(targetMenu?.menuId || '')
  return Boolean(
    menuId &&
    targetMenuId &&
    menuId !== targetMenuId &&
    String(menu?.pid || '') === String(targetMenu?.pid || ''),
  )
}

export const buildMenuSortParams = (menu, targetMenu, position) => {
  if (!canDropMenu(menu, targetMenu, position)) {
    return null
  }

  return {
    menuId: String(menu.menuId),
    targetMenuId: String(targetMenu.menuId),
    position: normalizeMenuDropPosition(position),
  }
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
