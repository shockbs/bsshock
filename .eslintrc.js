module.exports = {
    "env": {
        "browser": true,
        "es2021": true,
        "node": true
    },
    "extends": [
        "eslint:recommended"
    ],
    "overrides": [
        {
            "files": ["*.cjs", "*.js"],
            "parserOptions": {
                "sourceType": "script"
            }
        }
    ],
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "rules": {
        "no-console": "warn",
        "no-undef": "error",
        "semi": "off",
        "semi-spacing": "off",
        "arrow-spacing": "off",
        "no-confusing-arrow": "error",
        "no-duplicate-imports": "error",
        "no-var": "error",
        "object-shorthand": "off",
        "prefer-const": "warn",
        "prefer-template": "warn",
        "no-unused-vars": "off",
    }
}
