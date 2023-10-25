clear

npm run build
npx next export

cd out && zip ../out.zip *.html && cd ..


mkdir out/_cdn
node postprocessor.js
# rsync -avz --delete --exclude-from=exclude.txt ./out/ diascris@crisdias.com:jardim.crisdias.com/

# unzip -o out.zip -d out
