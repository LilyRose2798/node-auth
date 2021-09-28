const path = require("path")
const enableImportsFromExternalPaths = require("./enableExternalImports")

module.exports = {
    plugins: [
        {
            plugin: {
                overrideWebpackConfig: ({ webpackConfig }) => {
                    enableImportsFromExternalPaths(webpackConfig, [
                        path.resolve(__dirname, "../common/src")
                    ])
                    return webpackConfig
                }
            }
        }
    ]
}
