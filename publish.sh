set -e
git checkout dev

npm run prepublishOnly
npm version patch
git push

git checkout teslemetry
git rebase dev
git push --force-with-lease

git checkout tessie
git rebase dev
git push --force-with-lease

git checkout dev