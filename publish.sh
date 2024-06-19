set -e

git checkout teslemetry
rm -r dist
npm publish

git checkout tessie
rm -r dist
npm publish

git checkout dev