set -e
git checkout dev

npm run prepublishOnly
npm version minor
git push

git checkout teslemetry
git rebase dev
git push --force-with-lease
npm publish

git checkout tessie
git rebase dev
git push --force-with-lease
npm publish

git checkout dev