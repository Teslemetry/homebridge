set -e
rm -r dist
npm publish
gh release create v$(node -p "require('./package.json').version") --repo Bre77/homebridge-tessie
