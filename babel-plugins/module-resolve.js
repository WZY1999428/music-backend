export default function (babel) {
    return {
        visitor: {
            Identifier(path) {
                console.log(path.node.name)
            }
        }
    }
}
