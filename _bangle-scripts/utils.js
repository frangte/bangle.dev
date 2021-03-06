const path = require('path');
const globby = require('globby');
const fs = require('fs/promises');
const rootPath = path.resolve(__dirname, '..');

module.exports = { getPackages, mapPackages };

async function getPackages({ filter = 'all' } = {}) {
  const globResults = await globby([path.join(rootPath, '**/package.json')]);
  let results = await Promise.all(
    globResults.map(async (path) => [
      path,
      JSON.parse(await fs.readFile(path, 'utf-8')),
    ]),
  );

  results = results.filter(([filePath, packageObj]) => {
    if (filter === 'private') {
      return packageObj.private;
    }
    if (filter === 'public') {
      return !packageObj.private;
    }

    return true;
  });
  console.log(results);
  return results;
}

// cb - ([packagePath, packageObj]) => packageObj
async function mapPackages(cb, { filter } = {}) {
  const result = (await getPackages({ filter })).map((r) => {
    return [r[0], cb(r)];
  });

  console.log(result);
  await Promise.all(
    result.map(([packagePath, packageObj]) => {
      return fs.writeFile(
        packagePath,
        JSON.stringify(packageObj, null, 2) + '\n',
        'utf-8',
      );
    }),
  );
}

mapPackages(([filePath, packageObj]) => {
  delete packageObj.homepage;
  delete packageObj.license;
  delete packageObj.repository;
  delete packageObj.bugs;
  return {
    name: packageObj.name,
    version: packageObj.version,
    homepage: 'https://bangle.dev',
    authors: [
      {
        name: 'Kushan Joshi',
        email: '0o3ko0@gmail.com',
        web: 'http://github.com/kepta',
      },
    ],
    license: 'MIT',
    repository: {
      type: 'git',
      url: 'git+https://github.com/bangle-io/bangle.dev.git',
    },
    bugs: {
      url: 'https://github.com/bangle-io/bangle.dev/issues',
    },
    ...packageObj,
  };
});
