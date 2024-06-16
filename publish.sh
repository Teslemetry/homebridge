npm version patch
git push

git checkout teslemetry
git rebase dev
git push --force-with-lease
npm run publish

git checkout tessie
git rebase dev
git push --force-with-lease
npm run publish
