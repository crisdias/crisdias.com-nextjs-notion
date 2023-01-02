npm run build
npx next export
rsync -avz --delete --exclude-from=exclude.txt ./out/ diascris@crisdias.com:jardim.crisdias.com/
