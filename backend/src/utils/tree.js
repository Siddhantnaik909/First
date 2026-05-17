function buildCatalogTree(categories, calculators, searchTerm = "") {
  const byParent = new Map();
  const categoryNodes = categories.map((c) => ({
    id: c.id || String(c._id),
    name: c.name,
    description: c.description || "",
    parentId: c.parentId || null,
    order: c.order || 0,
    tags: c.tags || [],
    type: "category",
    children: [],
    calculators: [],
  }));

  categoryNodes.forEach((node) => {
    if (!byParent.has(node.parentId)) byParent.set(node.parentId, []);
    byParent.get(node.parentId).push(node);
  });

  const categoryMap = new Map(categoryNodes.map((n) => [n.id, n]));
  calculators.forEach((calc) => {
    const categoryId = calc.categoryId || null;
    const container = categoryMap.get(categoryId);
    const payload = {
      id: calc.id || String(calc._id),
      type: "calculator",
      name: calc.name,
      description: calc.description || "",
      tags: calc.tags || [],
      order: calc.order || 0,
      version: calc.currentVersion || 1,
    };
    if (container) {
      container.calculators.push(payload);
    }
  });

  function sortNode(node) {
    node.calculators.sort((a, b) => a.order - b.order);
    node.children.sort((a, b) => a.order - b.order);
    node.children.forEach(sortNode);
    return node;
  }

  function attach(parentId) {
    const nodes = byParent.get(parentId) || [];
    nodes.forEach((node) => {
      node.children = attach(node.id);
      sortNode(node);
    });
    return nodes;
  }

  const tree = attach(null).sort((a, b) => a.order - b.order);

  if (!searchTerm) return tree;
  const q = searchTerm.trim().toLowerCase();

  function filterNode(node) {
    const selfMatch =
      node.name.toLowerCase().includes(q) ||
      node.description.toLowerCase().includes(q) ||
      node.tags.some((t) => t.toLowerCase().includes(q));

    const matchedCalculators = node.calculators.filter(
      (calc) =>
        calc.name.toLowerCase().includes(q) ||
        calc.description.toLowerCase().includes(q) ||
        calc.tags.some((t) => t.toLowerCase().includes(q))
    );

    const matchedChildren = node.children
      .map(filterNode)
      .filter((item) => item !== null);

    if (selfMatch || matchedCalculators.length || matchedChildren.length) {
      return {
        ...node,
        calculators: matchedCalculators,
        children: matchedChildren,
      };
    }
    return null;
  }

  return tree.map(filterNode).filter((item) => item !== null);
}

module.exports = { buildCatalogTree };
