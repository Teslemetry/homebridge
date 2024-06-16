git checkout teslemetry
npm version patch
git rebase dev
git push --force-with-lease
npm run publish

git checkout tessie
npm version patch
git rebase dev
git push --force-with-lease
npm run publish
