export const isMenuBranch = (menu) => {
  return Array.isArray(menu?.children) && menu.children.length > 0
}

export const getRouteBreadcrumbTitles = (meta = {}) => {
  if (Array.isArray(meta.breadcrumbTitles) && meta.breadcrumbTitles.length) {
    return meta.breadcrumbTitles.filter(Boolean)
  }

  return [meta.parentTitle, meta.title].filter(Boolean)
}
