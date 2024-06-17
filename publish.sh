set -e
git checkout dev

npm run prepublishOnly
npm version minor
git push

git checkout teslemetry
git rebase dev
git push --force-with-lease

git checkout tessie
git rebase dev
git push --force-with-lease

git checkout teslemetry
rm -r dist
npm publish

git checkout tessie
rm -r dist
npm publish

git checkout dev