export function listToTree(deptList, key = "id", parentKey = "parentId") {
    const treeMap = new Map(deptList.map(item => [item[key], item]));
    const array = [];
    for (const item of deptList) {
        const parent = treeMap.get(item[parentKey]);
        if (parent) {
            parent.children = parent.children || [];
            parent.children.push(item);
        } else {
            array.push(item);
        }
    }
    return array;
}


export function getDescendantIds(list, id) {
    const childrenMap = new Map();

    for (const item of list) {
        const children = childrenMap.get(item.parentId);

        if (children) {
            children.push(item.id);
        } else {
            childrenMap.set(item.parentId, [item.id]);
        }
    }

    const descendantIds = new Set();
    const queue = [id];

    while (queue.length) {
        const parentId = queue.shift();
        const children = childrenMap.get(parentId) || [];

        for (const childId of children) {
            if (descendantIds.has(childId)) {
                continue;
            }

            descendantIds.add(childId);
            queue.push(childId);
        }
    }

    return descendantIds;
}


export function countRootNodes(
    list,
    key = "id",
    parentKey = "parentId"
) {
    const treeSet = new Set(list.map(item => item[key]));

    for (const item of list) {
        if (treeSet.has(item[parentKey])) {
            treeSet.delete(item[key]);
        }
    }

    return treeSet.size;
}